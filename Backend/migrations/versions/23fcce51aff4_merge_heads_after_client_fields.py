"""merge heads after client_fields

Revision ID: 23fcce51aff4
Revises: 9d3e2b1f4a87, e4f9c1a2b6d8
Create Date: 2026-04-27 19:27:07.565748

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '23fcce51aff4'
down_revision = ('9d3e2b1f4a87', 'e4f9c1a2b6d8')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
