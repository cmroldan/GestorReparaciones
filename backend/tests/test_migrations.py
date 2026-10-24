from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, inspect


def test_upgrade_and_downgrade(tmp_path, monkeypatch):
    db_path = tmp_path / "migration.db"
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{db_path}")
    cfg = Config("alembic.ini")
    command.upgrade(cfg, "head")
    inspector = inspect(create_engine(f"sqlite:///{db_path}"))
    assert "clients" in inspector.get_table_names()
    command.downgrade(cfg, "base")
    inspector = inspect(create_engine(f"sqlite:///{db_path}"))
    assert set(inspector.get_table_names()) <= {"alembic_version"}
