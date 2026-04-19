"""adicionar aceitou_termos usuario

Revision ID: h5d3f9a27e61
Revises: e5c2a9b13f71
Create Date: 2026-04-19

"""
from alembic import op
import sqlalchemy as sa

revision = 'h5d3f9a27e61'
down_revision = 'e5c2a9b13f71'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('usuarios', sa.Column('aceitou_termos', sa.Boolean(), nullable=False, server_default='false'))


def downgrade() -> None:
    op.drop_column('usuarios', 'aceitou_termos')
