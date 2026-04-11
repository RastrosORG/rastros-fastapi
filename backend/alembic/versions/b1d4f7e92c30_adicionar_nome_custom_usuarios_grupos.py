"""adicionar nome_custom e nome_alterado em usuarios e grupos

Revision ID: b1d4f7e92c30
Revises: e5c2a9b13f71
Create Date: 2026-04-11

"""
from alembic import op
import sqlalchemy as sa

revision = 'b1d4f7e92c30'
down_revision = 'e5c2a9b13f71'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('usuarios', sa.Column('nome_custom', sa.String(length=100), nullable=True))
    op.add_column('usuarios', sa.Column('nome_alterado', sa.Boolean(), nullable=False, server_default='false'))

    op.add_column('grupos', sa.Column('nome_custom', sa.String(length=100), nullable=True))
    op.add_column('grupos', sa.Column('nome_alterado', sa.Boolean(), nullable=False, server_default='false'))


def downgrade() -> None:
    op.drop_column('grupos', 'nome_alterado')
    op.drop_column('grupos', 'nome_custom')
    op.drop_column('usuarios', 'nome_alterado')
    op.drop_column('usuarios', 'nome_custom')
