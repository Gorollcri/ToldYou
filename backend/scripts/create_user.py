from __future__ import annotations

import argparse
import sys
from pathlib import Path

from sqlalchemy import select

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from app.core.security import get_password_hash
from app.db.init_db import init_db
from app.db.session import with_session
from app.models import User


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Create a single user account.")
    parser.add_argument("--username", default="gocri", help="Username to create.")
    parser.add_argument("--password", default="0988698", help="Password for the new user.")
    parser.add_argument("--nickname", default="userMe", help="Display nickname for the new user.")
    parser.add_argument("--role", default="member", choices=["admin", "member"], help="Role for the new user.")
    parser.add_argument(
        "--status", default="active", choices=["active", "disabled"], help="Initial status for the new user."
    )
    parser.add_argument("--avatar", default=None, help="Optional avatar URL.")
    parser.add_argument("--bio", default=None, help="Optional user bio.")
    return parser.parse_args()


def create_user(args: argparse.Namespace) -> int:
    init_db()

    with with_session() as db:
        existing = db.scalar(select(User).where(User.username == args.username))
        if existing is not None:
            print(f"Skipped: username already exists -> {existing.username} (id={existing.id})")
            return 0

        user = User(
            username=args.username,
            password_hash=get_password_hash(args.password),
            nickname=args.nickname,
            avatar=args.avatar,
            bio=args.bio,
            role=args.role,
            status=args.status,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        print(f"Created user: id={user.id}, username={user.username}, role={user.role}, status={user.status}")
        return 0


def main() -> int:
    args = parse_args()
    return create_user(args)


if __name__ == "__main__":
    raise SystemExit(main())
