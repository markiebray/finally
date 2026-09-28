"""Fixtures for API tests: a running app on a temp DB with mock LLM."""

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client(tmp_path, monkeypatch):
    """TestClient with lifespan started (DB init, simulator running)."""
    monkeypatch.setenv("DB_PATH", str(tmp_path / "test.db"))
    monkeypatch.setenv("LLM_MOCK", "true")
    with TestClient(app) as client:
        yield client
