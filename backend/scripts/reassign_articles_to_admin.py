from __future__ import annotations

import argparse
import sys
from pathlib import Path

from sqlalchemy import select

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from app.core.config import get_settings
from app.db.init_db import init_db
from app.db.session import with_session
from app.models import Article, User


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Reassign existing articles to the admin user.")
    parser.add_argument(
        "--username",
        default=None,
        help="Admin username to assign articles to. Defaults to ADMIN_USERNAME from settings.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview the number of affected articles without writing changes.",
    )
    return parser.parse_args()


def resolve_admin_user(db, username: str | None) -> User:
    settings = get_settings()
    target_username = username or settings.admin_username

    admin = db.scalar(select(User).where(User.username == target_username))
    if admin is None:
        raise RuntimeError(f"Target admin user not found: {target_username}")
    return admin


def main() -> int:
    args = parse_args()
    init_db()

    with with_session() as db:
        admin = resolve_admin_user(db, args.username)
        articles = list(db.scalars(select(Article)))

        affected = [article for article in articles if article.author_id != admin.id]
        if args.dry_run:
            print(
                f"Dry run complete: would reassign {len(affected)} of {len(articles)} articles to "
                f"user #{admin.id} ({admin.username})"
            )
            return 0

        for article in affected:
            article.author_id = admin.id

        db.commit()
        print(
            f"Reassigned {len(affected)} of {len(articles)} articles to "
            f"user #{admin.id} ({admin.username})"
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
