"""Fixtures for database tests."""

import pytest


@pytest.fixture(autouse=True)
def temp_db(tmp_path, monkeypatch):
    """Point DB_PATH at a fresh temp file for each test."""
    path = tmp_path / "sub" / "test.db"
    monkeypatch.setenv("DB_PATH", str(path))
    return path
