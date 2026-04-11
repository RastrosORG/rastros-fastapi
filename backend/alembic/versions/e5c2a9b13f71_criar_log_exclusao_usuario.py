"""criar log_exclusao_usuario

Revision ID: e5c2a9b13f71
Revises: d3b5e8f14a02
Create Date: 2026-04-11

"""
from alembic import op
import sqlalchemy as sa

revision = 'e5c2a9b13f71'
down_revision = 'd3b5e8f14a02'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'log_exclusao_usuario',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tipo', sa.String(length=10), nullable=False),
        sa.Column('nome_usuario', sa.String(length=100), nullable=False),
        sa.Column('grupo_nome', sa.String(length=100), nullable=False),
        sa.Column('excluido_em', sa.DateTime(), nullable=False),
        sa.Column('avaliador_nome', sa.String(length=100), nullable=False),
        sa.Column('motivo', sa.String(length=100), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_log_exclusao_usuario_id', 'log_exclusao_usuario', ['id'])


def downgrade() -> None:
    op.drop_index('ix_log_exclusao_usuario_id', table_name='log_exclusao_usuario')
    op.drop_table('log_exclusao_usuario')
