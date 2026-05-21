from __future__ import annotations

import argparse
import sys
from dataclasses import dataclass
from pathlib import Path

from sqlalchemy import select

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from app.core.config import get_settings
from app.db.init_db import init_db
from app.db.session import with_session
from app.models import Article, Category, Tag, User
from app.schemas.article import ArticleCreate
from app.services.article import create_article
from app.utils.slug import make_slug


@dataclass
class ParsedArticle:
    title: str
    slug: str | None
    summary: str | None
    content: str
    status: str
    cover_image: str | None
    category_name: str | None
    tag_names: list[str]
    is_top: bool
    is_featured: bool


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Import markdown articles from backend/assets into the database.")
    parser.add_argument(
        "--assets-dir",
        default=str(ROOT_DIR / "assets"),
        help="Directory that contains markdown files. Defaults to backend/assets.",
    )
    parser.add_argument(
        "--pattern",
        default="*.md",
        help="Glob pattern used to find article files. Defaults to *.md.",
    )
    parser.add_argument(
        "--status",
        default="published",
        choices=["draft", "published", "hidden"],
        help="Default status when a file does not specify one.",
    )
    parser.add_argument(
        "--update-existing",
        action="store_true",
        help="Update existing articles that match the parsed slug instead of skipping them.",
    )
    return parser.parse_args()


def parse_bool(value: str) -> bool:
    return value.strip().lower() in {"1", "true", "yes", "on"}


def parse_frontmatter(raw_text: str) -> tuple[dict[str, str], str]:
    if not raw_text.startswith("---\n"):
        return {}, raw_text

    lines = raw_text.splitlines()
    if not lines or lines[0].strip() != "---":
        return {}, raw_text

    end_index = None
    for index in range(1, len(lines)):
        if lines[index].strip() == "---":
            end_index = index
            break

    if end_index is None:
        return {}, raw_text

    metadata: dict[str, str] = {}
    for line in lines[1:end_index]:
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        metadata[key.strip().lower()] = value.strip()

    content = "\n".join(lines[end_index + 1 :]).lstrip()
    return metadata, content


def build_summary(content: str, limit: int = 180) -> str | None:
    normalized = " ".join(line.strip() for line in content.splitlines() if line.strip())
    if not normalized:
        return None
    if len(normalized) <= limit:
        return normalized
    return normalized[: limit - 3].rstrip() + "..."


def parse_tags(raw_tags: str | None) -> list[str]:
    if not raw_tags:
        return []
    return [item.strip() for item in raw_tags.split(",") if item.strip()]


def parse_markdown_file(path: Path, default_status: str) -> ParsedArticle:
    raw_text = path.read_text(encoding="utf-8")
    metadata, content = parse_frontmatter(raw_text)

    title = metadata.get("title") or path.stem
    slug = metadata.get("slug") or make_slug(title)
    summary = metadata.get("summary") or build_summary(content)
    status = metadata.get("status") or default_status
    cover_image = metadata.get("cover_image")
    category_name = metadata.get("category")
    tag_names = parse_tags(metadata.get("tags"))
    is_top = parse_bool(metadata.get("is_top", "false"))
    is_featured = parse_bool(metadata.get("is_featured", "false"))

    return ParsedArticle(
        title=title,
        slug=slug,
        summary=summary,
        content=content.strip(),
        status=status,
        cover_image=cover_image,
        category_name=category_name,
        tag_names=tag_names,
        is_top=is_top,
        is_featured=is_featured,
    )


def resolve_admin_user(db) -> User:
    settings = get_settings()
    admin = db.scalar(select(User).where(User.username == settings.admin_username))
    if admin is None:
        admin = db.scalar(select(User).order_by(User.id.asc()))
    if admin is None:
        raise RuntimeError("No user found. Start the backend once or run database initialization before importing.")
    return admin


def resolve_category_id(db, category_name: str | None) -> int | None:
    if not category_name:
        return None
    category = db.scalar(select(Category).where(Category.name == category_name))
    if category is None:
        category = Category(name=category_name, slug=make_slug(category_name))
        db.add(category)
        db.flush()
    return category.id


def resolve_tag_ids(db, tag_names: list[str]) -> list[int]:
    tag_ids: list[int] = []
    for tag_name in tag_names:
        tag = db.scalar(select(Tag).where(Tag.name == tag_name))
        if tag is None:
            tag = Tag(name=tag_name, slug=make_slug(tag_name))
            db.add(tag)
            db.flush()
        tag_ids.append(tag.id)
    return tag_ids


def update_existing_article(db, article: Article, parsed: ParsedArticle) -> None:
    article.title = parsed.title
    article.summary = parsed.summary
    article.content = parsed.content
    article.cover_image = parsed.cover_image
    article.status = parsed.status
    article.is_top = parsed.is_top
    article.is_featured = parsed.is_featured
    article.category_id = resolve_category_id(db, parsed.category_name)
    if parsed.tag_names:
        tags = list(db.scalars(select(Tag).where(Tag.id.in_(resolve_tag_ids(db, parsed.tag_names)))))
        article.tags = tags
    else:
        article.tags = []
    db.commit()


def import_articles(args: argparse.Namespace) -> int:
    assets_dir = Path(args.assets_dir)
    if not assets_dir.exists():
        raise FileNotFoundError(f"Assets directory not found: {assets_dir}")

    files = sorted(assets_dir.glob(args.pattern))
    if not files:
        print(f"No files matched {args.pattern} in {assets_dir}")
        return 0

    init_db()

    created_count = 0
    updated_count = 0
    skipped_count = 0

    with with_session() as db:
        admin = resolve_admin_user(db)

        for file_path in files:
            parsed = parse_markdown_file(file_path, args.status)
            if not parsed.content:
                print(f"Skipped {file_path.name}: content is empty")
                skipped_count += 1
                continue

            existing = db.scalar(select(Article).where(Article.slug == parsed.slug))
            if existing is not None:
                if not args.update_existing:
                    print(f"Skipped {file_path.name}: article slug already exists ({parsed.slug})")
                    skipped_count += 1
                    continue
                update_existing_article(db, existing, parsed)
                print(f"Updated {file_path.name} -> article #{existing.id} ({parsed.slug})")
                updated_count += 1
                continue

            payload = ArticleCreate(
                title=parsed.title,
                slug=parsed.slug,
                summary=parsed.summary,
                content=parsed.content,
                cover_image=parsed.cover_image,
                status=parsed.status,
                is_top=parsed.is_top,
                is_featured=parsed.is_featured,
                category_id=resolve_category_id(db, parsed.category_name),
                tag_ids=resolve_tag_ids(db, parsed.tag_names),
            )
            article = create_article(db, payload, admin.id)
            print(f"Created {file_path.name} -> article #{article.id} ({article.slug})")
            created_count += 1

    print(
        f"Import complete: created={created_count}, updated={updated_count}, skipped={skipped_count}, scanned={len(files)}"
    )
    return 0


def main() -> int:
    args = parse_args()
    return import_articles(args)


if __name__ == "__main__":
    raise SystemExit(main())
