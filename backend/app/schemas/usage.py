from datetime import datetime
from typing import Optional, List, Dict
from pydantic import BaseModel, Field, ConfigDict


class UsageRecordBase(BaseModel):
    """
    Base usage record schema.
    NOTE: 'cost_usd' is strictly normalized to United States Dollars (USD)
    across all providers (OpenAI, Anthropic, Gemini, Azure, etc.). If omitted
    during ingestion, the backend computes it in USD using standard rate tables.
    """
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="UTC completion timestamp")
    provider: str = Field(description="AI provider identifier (openai, anthropic, gemini, azure_openai)")
    model: str = Field(description="Specific AI model identifier (e.g. gpt-4o, claude-3-5-sonnet)")
    input_tokens: int = Field(default=0, ge=0, description="Prompt / input token count")
    output_tokens: int = Field(default=0, ge=0, description="Completion / output token count")
    total_tokens: Optional[int] = Field(default=None, description="Sum of input and output tokens")
    cost_usd: Optional[float] = Field(
        default=None,
        ge=0,
        description="Total execution cost normalized to USD ($) regardless of source provider currency",
    )
    request_id: Optional[str] = Field(default=None, description="Client or provider request ID")
    project_tag: str = Field(default="default", description="Attribution / environment tag")
    latency_ms: Optional[int] = Field(default=None, description="API execution latency in milliseconds")


class UsageRecordCreate(UsageRecordBase):
    pass


class UsageRecordResponse(UsageRecordBase):
    id: int
    total_tokens: int
    cost_usd: float = Field(description="Execution cost strictly normalized to USD ($)")
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UsageSummaryResponse(BaseModel):
    total_tokens: int
    total_input_tokens: int
    total_output_tokens: int
    total_cost_usd: float
    total_requests: int
    most_used_model: str
    avg_latency_ms: Optional[float] = None
    active_providers: List[str]
    active_models: List[str]


class TimeSeriesDataPoint(BaseModel):
    timestamp: str  # YYYY-MM-DD or YYYY-MM-DDTHH:00:00
    tokens: int
    input_tokens: int
    output_tokens: int
    cost_usd: float
    requests: int


class TimeSeriesResponse(BaseModel):
    interval: str  # "hour" | "day"
    points: List[TimeSeriesDataPoint]


class ModelUsageBreakdown(BaseModel):
    model: str
    provider: str
    total_tokens: int
    input_tokens: int
    output_tokens: int
    cost_usd: float
    request_count: int
    percentage_cost: float


class CostProjectionResponse(BaseModel):
    total_cost_to_date: float
    daily_average_cost: float
    projected_monthly_cost: float
    provider_breakdown: Dict[str, float]
    project_breakdown: Dict[str, float]


class BatchIngestRequest(BaseModel):
    records: List[UsageRecordCreate]
