"""indice mensagens grupo_id criado_em

Revision ID: c7e1a4f02d88
Revises: a2f9c3d81b04
Create Date: 2026-04-11

"""
from alembic import op

revision = 'c7e1a4f02d88'
down_revision = 'a2f9c3d81b04'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index(
        'ix_mensagens_grupo_criado_em',
        'mensagens',
        ['grupo_id', 'criado_em'],
    )


def downgrade() -> None:
    op.drop_index('ix_mensagens_grupo_criado_em', table_name='mensagens')
