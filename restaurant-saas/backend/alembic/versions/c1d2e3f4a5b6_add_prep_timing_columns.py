"""add prep timing columns to menu_items and orders

Revision ID: c1d2e3f4a5b6
Revises: a1b2c3d4e5f6
Create Date: 2026-10-29 00:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c1d2e3f4a5b6"
down_revision: Union[str, None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("menu_items", sa.Column("prep_time_minutes", sa.Integer(), nullable=False, server_default="5"))
    op.add_column("orders", sa.Column("estimated_prep_minutes", sa.Integer(), nullable=False, server_default="5"))
    op.add_column("orders", sa.Column("prep_started_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("orders", sa.Column("ready_at", sa.DateTime(timezone=True), nullable=True))
    
    # Ensure existing items have 5 minutes set
    op.execute("UPDATE menu_items SET prep_time_minutes = 5 WHERE prep_time_minutes IS NULL;")


def downgrade() -> None:
    op.drop_column("orders", "ready_at")
    op.drop_column("orders", "prep_started_at")
    op.drop_column("orders", "estimated_prep_minutes")
    op.drop_column("menu_items", "prep_time_minutes")
