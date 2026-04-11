"""criar log_exclusao_dossie

Revision ID: d3b5e8f14a02
Revises: c7e1a4f02d88
Create Date: 2026-04-11

"""
from alembic import op
import sqlalchemy as sa

revision = 'd3b5e8f14a02'
down_revision = 'c7e1a4f02d88'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'log_exclusao_dossie',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('nome_dossie', sa.String(150), nullable=False),
        sa.Column('criado_em', sa.DateTime(), nullable=False),
        sa.Column('excluido_em', sa.DateTime(), nullable=False),
        sa.Column('avaliador_nome', sa.String(100), nullable=False),
        sa.Column('motivo', sa.String(100), nullable=False),
    )


def downgrade() -> None:
    op.drop_table('log_exclusao_dossie')
