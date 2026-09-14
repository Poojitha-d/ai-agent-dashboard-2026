import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings

client = TestClient(app)


def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "healthy"}


def test_get_usage_summary():
    res = client.get("/api/usage/summary")
    assert res.status_code == 200
    data = res.json()
    assert "total_tokens" in data
    assert "total_cost_usd" in data
    assert data["total_tokens"] > 0
    assert data["total_requests"] > 0
    assert len(data["active_providers"]) > 0


def test_get_usage_timeseries():
    res = client.get("/api/usage/timeseries?interval=day")
    assert res.status_code == 200
    data = res.json()
    assert data["interval"] == "day"
    assert len(data["points"]) > 0
    point = data["points"][0]
    assert "tokens" in point
    assert "cost_usd" in point


def test_get_usage_by_model():
    res = client.get("/api/usage/by-model")
    assert res.status_code == 200
    data = res.json()
    assert len(data) > 0
    first = data[0]
    assert "model" in first
    assert "total_tokens" in first
    assert "percentage_cost" in first


def test_get_cost_projections():
    res = client.get("/api/usage/costs")
    assert res.status_code == 200
    data = res.json()
    assert "total_cost_to_date" in data
    assert "projected_monthly_cost" in data
    assert "provider_breakdown" in data


def test_ingest_usage_auth_failure():
    payload = {
        "records": [
            {
                "provider": "openai",
                "model": "gpt-4o",
                "input_tokens": 100,
                "output_tokens": 50,
            }
        ]
    }
    # No API key
    res = client.post("/api/usage/ingest", json=payload)
    assert res.status_code == 401


def test_ingest_usage_success():
    payload = {
        "records": [
            {
                "provider": "openai",
                "model": "gpt-4o",
                "input_tokens": 1000,
                "output_tokens": 500,
                "project_tag": "test-suite",
            }
        ]
    }
    headers = {"X-API-Key": settings.API_KEY}
    res = client.post("/api/usage/ingest", json=payload, headers=headers)
    assert res.status_code == 200
    records = res.json()
    assert len(records) == 1
    assert records[0]["total_tokens"] == 1500
    assert records[0]["cost_usd"] > 0.0


def test_ingest_openai_payload():
    payload = {
        "id": "chatcmpl-test12345",
        "model": "gpt-4o",
        "usage": {
            "prompt_tokens": 120,
            "completion_tokens": 80,
            "total_tokens": 200,
        },
    }
    headers = {"X-API-Key": settings.API_KEY}
    res = client.post("/api/usage/ingest/provider/openai?project_tag=ci-eval", json=payload, headers=headers)
    assert res.status_code == 200
    records = res.json()
    assert len(records) == 1
    assert records[0]["provider"] == "openai"
    assert records[0]["total_tokens"] == 200
    assert records[0]["request_id"] == "chatcmpl-test12345"
    assert records[0]["project_tag"] == "ci-eval"


def test_ingest_anthropic_payload():
    payload = {
        "id": "msg_01XyZ",
        "model": "claude-3-5-sonnet",
        "usage": {
            "input_tokens": 300,
            "output_tokens": 150,
        },
    }
    headers = {"X-API-Key": settings.API_KEY}
    res = client.post("/api/usage/ingest/provider/anthropic?project_tag=coding", json=payload, headers=headers)
    assert res.status_code == 200
    records = res.json()
    assert len(records) == 1
    assert records[0]["provider"] == "anthropic"
    assert records[0]["total_tokens"] == 450


def test_ingest_gemini_payload():
    payload = {
        "responseId": "gemini-resp-99",
        "modelVersion": "gemini-1.5-pro",
        "usageMetadata": {
            "promptTokenCount": 500,
            "candidatesTokenCount": 250,
            "totalTokenCount": 750,
        },
    }
    headers = {"X-API-Key": settings.API_KEY}
    res = client.post("/api/usage/ingest/provider/gemini", json=payload, headers=headers)
    assert res.status_code == 200
    records = res.json()
    assert len(records) == 1
    assert records[0]["provider"] == "gemini"
    assert records[0]["total_tokens"] == 750


def test_ingest_csv_upload():
    csv_content = (
        "timestamp,provider,model,input_tokens,output_tokens,cost_usd,request_id,project_tag\n"
        "2026-09-12T10:00:00Z,openai,gpt-4o,500,200,0.00325,req-csv-1,batch-job\n"
        "2026-09-12T10:05:00Z,anthropic,claude-3-5-sonnet,800,300,0.0069,req-csv-2,batch-job\n"
    )
    files = {"file": ("test.csv", csv_content, "text/csv")}
    headers = {"X-API-Key": settings.API_KEY}
    res = client.post("/api/usage/ingest/csv?project_tag=batch-job", files=files, headers=headers)
    assert res.status_code == 200
    records = res.json()
    assert len(records) == 2
    assert records[0]["request_id"] == "req-csv-1"
    assert records[1]["provider"] == "anthropic"

