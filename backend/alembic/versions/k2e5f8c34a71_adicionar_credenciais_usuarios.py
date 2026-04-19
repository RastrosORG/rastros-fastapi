"""adicionar credenciais_usuarios

Revision ID: k2e5f8c34a71
Revises: h5d3f9a27e61
Create Date: 2026-04-19

"""
from alembic import op
import sqlalchemy as sa

revision = 'k2e5f8c34a71'
down_revision = 'h5d3f9a27e61'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'credenciais_usuarios',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('usuario_id', sa.Integer(), nullable=False),
        sa.Column('login', sa.String(50), nullable=False),
        sa.Column('senha', sa.String(100), nullable=False),
        sa.Column('grupo_id', sa.Integer(), nullable=False),
        sa.Column('grupo_nome', sa.String(100), nullable=False),
        sa.Column('criado_em', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['usuario_id'], ['usuarios.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('usuario_id'),
    )
    op.create_index(op.f('ix_credenciais_usuarios_id'), 'credenciais_usuarios', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_credenciais_usuarios_id'), table_name='credenciais_usuarios')
    op.drop_table('credenciais_usuarios')
