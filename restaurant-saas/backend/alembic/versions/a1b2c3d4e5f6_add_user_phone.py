"""add user phone, nullable email

Revision ID: a1b2c3d4e5f6
Revises: f93d794cebf8
Create Date: 2026-10-23 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "f93d794cebf8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("phone", sa.String(length=30), nullable=True))
    op.create_index(op.f("ix_users_phone"), "users", ["phone"], unique=True)
    op.alter_column("users", "email", existing_type=sa.String(length=255), nullable=True)


def downgrade() -> None:
    op.alter_column("users", "email", existing_type=sa.String(length=255), nullable=False)
    op.drop_index(op.f("ix_users_phone"), table_name="users")
    op.drop_column("users", "phone")
