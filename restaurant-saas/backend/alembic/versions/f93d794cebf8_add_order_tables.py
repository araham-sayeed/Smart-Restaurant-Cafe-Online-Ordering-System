"""add order tables

Revision ID: f93d794cebf8
Revises: b1cc09b52cf8
Create Date: 2026-10-21 22:21:17.088338

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f93d794cebf8'
down_revision: Union[str, Sequence[str], None] = 'b1cc09b52cf8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Orders
    op.create_table(
        'orders',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('public_id', sa.String(length=32), nullable=False),
        sa.Column('restaurant_id', sa.Integer(), nullable=False),
        sa.Column('customer_name', sa.String(length=120), nullable=False),
        sa.Column('customer_phone', sa.String(length=30), nullable=False),
        sa.Column('order_type', sa.String(length=20), nullable=False),
        sa.Column('delivery_address', sa.String(length=300), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='received'),
        sa.Column('payment_method', sa.String(length=20), nullable=False, server_default='cash'),
        sa.Column('payment_status', sa.String(length=20), nullable=False, server_default='unpaid'),
        sa.Column('subtotal', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('total', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['restaurant_id'], ['restaurants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_orders_public_id'), 'orders', ['public_id'], unique=True)
    op.create_index(op.f('ix_orders_restaurant_id'), 'orders', ['restaurant_id'], unique=False)

    # Order Items
    op.create_table(
        'order_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('order_id', sa.Integer(), nullable=False),
        sa.Column('menu_item_id', sa.Integer(), nullable=True),
        sa.Column('name', sa.String(length=120), nullable=False),
        sa.Column('unit_price', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False),
        sa.Column('note', sa.String(length=200), nullable=True),
        sa.Column('line_total', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.ForeignKeyConstraint(['menu_item_id'], ['menu_items.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_order_items_order_id'), 'order_items', ['order_id'], unique=False)

    # Order Item Addons
    op.create_table(
        'order_item_addons',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('order_item_id', sa.Integer(), nullable=False),
        sa.Column('option_id', sa.Integer(), nullable=True),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('extra_price', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.ForeignKeyConstraint(['option_id'], ['addon_options.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['order_item_id'], ['order_items.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_order_item_addons_order_item_id'), 'order_item_addons', ['order_item_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_order_item_addons_order_item_id'), table_name='order_item_addons')
    op.drop_table('order_item_addons')

    op.drop_index(op.f('ix_order_items_order_id'), table_name='order_items')
    op.drop_table('order_items')

    op.drop_index(op.f('ix_orders_restaurant_id'), table_name='orders')
    op.drop_index(op.f('ix_orders_public_id'), table_name='orders')
    op.drop_table('orders')
