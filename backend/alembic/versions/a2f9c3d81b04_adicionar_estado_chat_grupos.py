"""adicionar estado chat aos grupos

Revision ID: a2f9c3d81b04
Revises: f33644e866c5
Create Date: 2026-04-11 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = 'a2f9c3d81b04'
down_revision: Union[str, Sequence[str], None] = 'f33644e866c5'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('grupos', sa.Column(
        'chamou_avaliador', sa.Boolean(), nullable=False, server_default='false'
    ))
    op.add_column('grupos', sa.Column(
        'avaliador_presente', sa.Boolean(), nullable=False, server_default='false'
    ))


def downgrade() -> None:
    op.drop_column('grupos', 'avaliador_presente')
    op.drop_column('grupos', 'chamou_avaliador')
