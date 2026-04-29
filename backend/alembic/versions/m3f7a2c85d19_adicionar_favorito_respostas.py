"""adicionar favorito respostas

Revision ID: m3f7a2c85d19
Revises: k2e5f8c34a71
Create Date: 2026-04-29

"""
from alembic import op
import sqlalchemy as sa

revision = 'm3f7a2c85d19'
down_revision = 'k2e5f8c34a71'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('respostas', sa.Column(
        'favorito', sa.Boolean(), nullable=False, server_default='false'
    ))


def downgrade() -> None:
    op.drop_column('respostas', 'favorito')
