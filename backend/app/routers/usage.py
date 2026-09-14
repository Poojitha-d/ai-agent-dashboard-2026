from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Security, status, Query, UploadFile, File
from fastapi.security.api_key import APIKeyHeader
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.db.session import get_db
from app.models.usage import UsageRecord
from app.schemas.usage import (
    UsageRecordCreate,
    UsageRecordResponse,
    UsageSummaryResponse,
    TimeSeriesResponse,
    TimeSeriesDataPoint,
    ModelUsageBreakdown,
    CostProjectionResponse,
    BatchIngestRequest,
)
from app.services.pricing import calculate_cost
from app.services.event_bus import event_bus
from app.core.config import settings

router = APIRouter(prefix="/usage", tags=["usage"])
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


def get_api_key(header_key: Optional[str] = Security(api_key_header)) -> str:
    # Allow authentication if matching configured key or if key not strictly configured
    if not settings.API_KEY:
        return ""
    if header_key != settings.API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API Key. Provide 'X-API-Key' header.",
        )
    return header_key


@router.get("/summary", response_model=UsageSummaryResponse)
def get_usage_summary(
    provider: Optional[str] = None,
    model: Optional[str] = None,
    project_tag: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
):
    """Aggregate totals for tokens and cost, filterable by provider/model/date range."""
    query = db.query(UsageRecord)
    if provider:
        query = query.filter(UsageRecord.provider == provider)
    if model:
        query = query.filter(UsageRecord.model == model)
    if project_tag:
        query = query.filter(UsageRecord.project_tag == project_tag)
    if start_date:
        query = query.filter(UsageRecord.timestamp >= start_date)
    if end_date:
        query = query.filter(UsageRecord.timestamp <= end_date)

    records = query.all()
    if not records:
        return UsageSummaryResponse(
            total_tokens=0,
            total_input_tokens=0,
            total_output_tokens=0,
            total_cost_usd=0.0,
            total_requests=0,
            most_used_model="None",
            avg_latency_ms=None,
            active_providers=[],
            active_models=[],
        )

    total_tokens = sum(r.total_tokens for r in records)
    total_input = sum(r.input_tokens for r in records)
    total_output = sum(r.output_tokens for r in records)
    total_cost = sum(r.cost_usd for r in records)
    total_requests = len(records)

    model_counts: Dict[str, int] = {}
    providers_set = set()
    models_set = set()
    latencies = []

    for r in records:
        model_counts[r.model] = model_counts.get(r.model, 0) + r.total_tokens
        providers_set.add(r.provider)
        models_set.add(r.model)
        if r.latency_ms is not None:
            latencies.append(r.latency_ms)

    most_used = max(model_counts.items(), key=lambda x: x[1])[0] if model_counts else "None"
    avg_lat = (sum(latencies) / len(latencies)) if latencies else None

    return UsageSummaryResponse(
        total_tokens=total_tokens,
        total_input_tokens=total_input,
        total_output_tokens=total_output,
        total_cost_usd=round(total_cost, 4),
        total_requests=total_requests,
        most_used_model=most_used,
        avg_latency_ms=round(avg_lat, 1) if avg_lat is not None else None,
        active_providers=sorted(list(providers_set)),
        active_models=sorted(list(models_set)),
    )


@router.get("/timeseries", response_model=TimeSeriesResponse)
def get_usage_timeseries(
    interval: str = Query("day", pattern="^(day|hour)$"),
    provider: Optional[str] = None,
    model: Optional[str] = None,
    project_tag: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
):
    """Time-series usage data grouped by day or hour."""
    query = db.query(UsageRecord)
    if provider:
        query = query.filter(UsageRecord.provider == provider)
    if model:
        query = query.filter(UsageRecord.model == model)
    if project_tag:
        query = query.filter(UsageRecord.project_tag == project_tag)
    if start_date:
        query = query.filter(UsageRecord.timestamp >= start_date)
    if end_date:
        query = query.filter(UsageRecord.timestamp <= end_date)

    records = query.order_by(UsageRecord.timestamp.asc()).all()

    # Bucket aggregation in python for cross-database SQLite / Postgres compatibility
    buckets: Dict[str, Dict[str, Any]] = {}
    for r in records:
        if interval == "hour":
            key = r.timestamp.strftime("%Y-%m-%dT%H:00:00")
        else:
            key = r.timestamp.strftime("%Y-%m-%d")

        if key not in buckets:
            buckets[key] = {
                "timestamp": key,
                "tokens": 0,
                "input_tokens": 0,
                "output_tokens": 0,
                "cost_usd": 0.0,
                "requests": 0,
            }

        b = buckets[key]
        b["tokens"] += r.total_tokens
        b["input_tokens"] += r.input_tokens
        b["output_tokens"] += r.output_tokens
        b["cost_usd"] += r.cost_usd
        b["requests"] += 1

    points = [
        TimeSeriesDataPoint(
            timestamp=b["timestamp"],
            tokens=b["tokens"],
            input_tokens=b["input_tokens"],
            output_tokens=b["output_tokens"],
            cost_usd=round(b["cost_usd"], 4),
            requests=b["requests"],
        )
        for b in sorted(buckets.values(), key=lambda x: x["timestamp"])
    ]

    return TimeSeriesResponse(interval=interval, points=points)


@router.get("/by-model", response_model=List[ModelUsageBreakdown])
def get_usage_by_model(
    provider: Optional[str] = None,
    project_tag: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
):
    """Breakdown of token consumption, cost, and requests grouped by model."""
    query = db.query(UsageRecord)
    if provider:
        query = query.filter(UsageRecord.provider == provider)
    if project_tag:
        query = query.filter(UsageRecord.project_tag == project_tag)
    if start_date:
        query = query.filter(UsageRecord.timestamp >= start_date)
    if end_date:
        query = query.filter(UsageRecord.timestamp <= end_date)

    records = query.all()
    total_cost_overall = sum(r.cost_usd for r in records) or 1.0

    grouped: Dict[str, Dict[str, Any]] = {}
    for r in records:
        key = f"{r.provider}::{r.model}"
        if key not in grouped:
            grouped[key] = {
                "model": r.model,
                "provider": r.provider,
                "total_tokens": 0,
                "input_tokens": 0,
                "output_tokens": 0,
                "cost_usd": 0.0,
                "request_count": 0,
            }
        g = grouped[key]
        g["total_tokens"] += r.total_tokens
        g["input_tokens"] += r.input_tokens
        g["output_tokens"] += r.output_tokens
        g["cost_usd"] += r.cost_usd
        g["request_count"] += 1

    results = []
    for g in grouped.values():
        cost = round(g["cost_usd"], 4)
        pct = round((g["cost_usd"] / total_cost_overall) * 100, 2)
        results.append(
            ModelUsageBreakdown(
                model=g["model"],
                provider=g["provider"],
                total_tokens=g["total_tokens"],
                input_tokens=g["input_tokens"],
                output_tokens=g["output_tokens"],
                cost_usd=cost,
                request_count=g["request_count"],
                percentage_cost=pct,
            )
        )

    results.sort(key=lambda x: x.cost_usd, reverse=True)
    return results


@router.get("/costs", response_model=CostProjectionResponse)
def get_cost_projections(
    db: Session = Depends(get_db),
):
    """Cost breakdown by provider and project tag, plus monthly run-rate projection."""
    now = datetime.utcnow()
    thirty_days_ago = now - timedelta(days=30)

    records = db.query(UsageRecord).all()
    if not records:
        return CostProjectionResponse(
            total_cost_to_date=0.0,
            daily_average_cost=0.0,
            projected_monthly_cost=0.0,
            provider_breakdown={},
            project_breakdown={},
        )

    total_cost = sum(r.cost_usd for r in records)
    recent_records = [r for r in records if r.timestamp >= thirty_days_ago]

    # Calculate time span in days
    first_time = min(r.timestamp for r in records)
    days_active = max((now - first_time).total_seconds() / 86400.0, 1.0)
    daily_avg = total_cost / days_active
    projected_monthly = daily_avg * 30.0

    provider_breakdown: Dict[str, float] = {}
    project_breakdown: Dict[str, float] = {}

    for r in records:
        provider_breakdown[r.provider] = round(
            provider_breakdown.get(r.provider, 0.0) + r.cost_usd, 4
        )
        project_breakdown[r.project_tag] = round(
            project_breakdown.get(r.project_tag, 0.0) + r.cost_usd, 4
        )

    return CostProjectionResponse(
        total_cost_to_date=round(total_cost, 4),
        daily_average_cost=round(daily_avg, 4),
        projected_monthly_cost=round(projected_monthly, 4),
        provider_breakdown=provider_breakdown,
        project_breakdown=project_breakdown,
    )


@router.post("/ingest", response_model=List[UsageRecordResponse])
async def ingest_usage(
    batch: BatchIngestRequest,
    db: Session = Depends(get_db),
    _key: str = Depends(get_api_key),
):
    """Ingest one or multiple usage records (protected by API key)."""
    saved_records = []
    for item in batch.records:
        total = item.total_tokens or (item.input_tokens + item.output_tokens)
        cost = item.cost_usd
        if cost is None:
            cost = calculate_cost(item.model, item.input_tokens, item.output_tokens)

        db_item = UsageRecord(
            timestamp=item.timestamp,
            provider=item.provider,
            model=item.model,
            input_tokens=item.input_tokens,
            output_tokens=item.output_tokens,
            total_tokens=total,
            cost_usd=cost,
            request_id=item.request_id,
            project_tag=item.project_tag,
            latency_ms=item.latency_ms,
        )
        db.add(db_item)
        saved_records.append(db_item)

    db.commit()
    for rec in saved_records:
        db.refresh(rec)

    # Broadcast event via real-time bus
    event_payload = {
        "count": len(saved_records),
        "total_tokens": sum(r.total_tokens for r in saved_records),
        "total_cost": round(sum(r.cost_usd for r in saved_records), 6),
        "latest_model": saved_records[-1].model if saved_records else None,
        "latest_provider": saved_records[-1].provider if saved_records else None,
    }
    await event_bus.broadcast("usage_ingested", event_payload)

    return saved_records


@router.post("/ingest/provider/{provider}", response_model=List[UsageRecordResponse])
async def ingest_provider_payload(
    provider: str,
    payload: Dict[str, Any],
    project_tag: str = Query("default"),
    db: Session = Depends(get_db),
    _key: str = Depends(get_api_key),
):
    """Ingest raw payload directly from an LLM provider (OpenAI, Anthropic, Gemini, Azure) using provider adapters."""
    from app.adapters import get_adapter

    adapter = get_adapter(provider)
    if not adapter:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported provider '{provider}'. Supported providers: openai, anthropic, gemini, azure_openai",
        )

    parsed_items = adapter.parse(payload, project_tag=project_tag)
    batch = BatchIngestRequest(records=parsed_items)
    return await ingest_usage(batch=batch, db=db, _key=_key)


@router.post("/ingest/csv", response_model=List[UsageRecordResponse])
async def ingest_csv_file(
    file: UploadFile = File(...),
    project_tag: str = Query("csv-import"),
    db: Session = Depends(get_db),
    _key: str = Depends(get_api_key),
):
    """Upload and ingest a CSV file of LLM usage records."""
    from app.adapters import CSVLogAdapter

    contents = await file.read()
    csv_text = contents.decode("utf-8", errors="replace")
    parsed_items = CSVLogAdapter.parse_csv(csv_text, default_project_tag=project_tag)

    if not parsed_items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid records found in CSV file.",
        )

    batch = BatchIngestRequest(records=parsed_items)
    return await ingest_usage(batch=batch, db=db, _key=_key)

