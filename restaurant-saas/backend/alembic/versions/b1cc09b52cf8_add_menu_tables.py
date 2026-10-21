"""add menu tables

Revision ID: b1cc09b52cf8
Revises: 001_initial_schema
Create Date: 2026-10-21 21:09:06.790879

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b1cc09b52cf8'
down_revision: Union[str, Sequence[str], None] = '001_initial_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Categories
    op.create_table(
        'categories',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('restaurant_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('sort_order', sa.Integer(), nullable=False, server_default='0'),
        sa.ForeignKeyConstraint(['restaurant_id'], ['restaurants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_categories_restaurant_id'), 'categories', ['restaurant_id'], unique=False)

    # Menu Items
    op.create_table(
        'menu_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('restaurant_id', sa.Integer(), nullable=False),
        sa.Column('category_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=120), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('price', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('image_url', sa.String(length=500), nullable=True),
        sa.Column('is_available', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('sort_order', sa.Integer(), nullable=False, server_default='0'),
        sa.ForeignKeyConstraint(['category_id'], ['categories.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['restaurant_id'], ['restaurants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_menu_items_category_id'), 'menu_items', ['category_id'], unique=False)
    op.create_index(op.f('ix_menu_items_restaurant_id'), 'menu_items', ['restaurant_id'], unique=False)

    # Add-on Groups
    op.create_table(
        'addon_groups',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('restaurant_id', sa.Integer(), nullable=False),
        sa.Column('item_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('is_required', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('min_select', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('max_select', sa.Integer(), nullable=False, server_default='1'),
        sa.ForeignKeyConstraint(['item_id'], ['menu_items.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['restaurant_id'], ['restaurants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_addon_groups_item_id'), 'addon_groups', ['item_id'], unique=False)
    op.create_index(op.f('ix_addon_groups_restaurant_id'), 'addon_groups', ['restaurant_id'], unique=False)

    # Add-on Options
    op.create_table(
        'addon_options',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('restaurant_id', sa.Integer(), nullable=False),
        sa.Column('group_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('extra_price', sa.Numeric(precision=10, scale=2), nullable=False, server_default='0'),
        sa.Column('is_available', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.ForeignKeyConstraint(['group_id'], ['addon_groups.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['restaurant_id'], ['restaurants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_addon_options_group_id'), 'addon_options', ['group_id'], unique=False)
    op.create_index(op.f('ix_addon_options_restaurant_id'), 'addon_options', ['restaurant_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_addon_options_restaurant_id'), table_name='addon_options')
    op.drop_index(op.f('ix_addon_options_group_id'), table_name='addon_options')
    op.drop_table('addon_options')

    op.drop_index(op.f('ix_addon_groups_restaurant_id'), table_name='addon_groups')
    op.drop_index(op.f('ix_addon_groups_item_id'), table_name='addon_groups')
    op.drop_table('addon_groups')

    op.drop_index(op.f('ix_menu_items_restaurant_id'), table_name='menu_items')
    op.drop_index(op.f('ix_menu_items_category_id'), table_name='menu_items')
    op.drop_table('menu_items')

    op.drop_index(op.f('ix_categories_restaurant_id'), table_name='categories')
    op.drop_table('categories')
