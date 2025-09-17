import pytest
from app import app  # اگر اسم فایل اصلی‌ات app.py نیست، اینجا تغییر بده

@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client

def test_ping(client):
    """تست می‌کنه که endpoint /ping درست جواب می‌ده"""
    response = client.get("/ping")
    assert response.status_code == 200
    data = response.get_json()
    assert data["message"] == "pong"
