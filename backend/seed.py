import random
import uuid
from datetime import datetime, timedelta

from app.db.session import SessionLocal, engine, Base
from app.models.usage import UsageRecord
from app.services.pricing import calculate_cost

# Ensure tables exist
Base.metadata.create_all(bind=engine)

# Model configuration with realistic usage profile
# Format: (provider, model, relative_frequency, typical_task)
MODEL_CONFIGS = [
    # Frontier reasoning & coding models (High cost per token)
    {
        "provider": "openai",
        "model": "gpt-4o",
        "weight": 0.28,
        "input_range": (1500, 8000),
        "output_range": (300, 2500),
        "latency_range": (800, 3200),
    },
    {
        "provider": "anthropic",
        "model": "claude-3-5-sonnet",
        "weight": 0.24,
        "input_range": (2000, 10000),
        "output_range": (400, 3000),
        "latency_range": (900, 3500),
    },
    {
        "provider": "openai",
        "model": "o1-mini",
        "weight": 0.08,
        "input_range": (1000, 6000),
        "output_range": (500, 3500),
        "latency_range": (2500, 9000),
    },
    # Fast / High-volume utility models (Low cost per token, high token throughput)
    {
        "provider": "openai",
        "model": "gpt-4o-mini",
        "weight": 0.22,
        "input_range": (500, 14000),
        "output_range": (150, 1800),
        "latency_range": (250, 1100),
    },
    {
        "provider": "anthropic",
        "model": "claude-3-5-haiku",
        "weight": 0.08,
        "input_range": (600, 8000),
        "output_range": (100, 1200),
        "latency_range": (200, 950),
    },
    {
        "provider": "gemini",
        "model": "gemini-1.5-pro",
        "weight": 0.05,
        "input_range": (3000, 18000),  # Long context ingestion
        "output_range": (400, 2000),
        "latency_range": (1100, 4200),
    },
    {
        "provider": "gemini",
        "model": "gemini-1.5-flash",
        "weight": 0.05,
        "input_range": (1000, 16000),
        "output_range": (100, 1500),
        "latency_range": (180, 800),
    },
    # Enterprise Azure OpenAI
    {
        "provider": "azure_openai",
        "model": "azure/gpt-4o",
        "weight": 0.05,
        "input_range": (1200, 7500),
        "output_range": (250, 2000),
        "latency_range": (750, 3000),
    },
]

PROJECT_TAGS = [
    ("coding-assistant", 0.40),
    ("pr-reviewer", 0.25),
    ("rag-search", 0.15),
    ("agent-eval", 0.12),
    ("documentation-bot", 0.08),
]


def generate_seed_data(days_back: int = 24):
    """
    Populate database with 24 days (over 3 weeks) of realistic LLM telemetry.
    Demonstrates realistic token volume differences and normalized USD cost divergence.
    """
    db = SessionLocal()
    try:
        # Clear existing records
        db.query(UsageRecord).delete()
        db.commit()
        print("Cleared previous records.")

        now = datetime.utcnow()
        records = []

        model_weights = [cfg["weight"] for cfg in MODEL_CONFIGS]
        tag_choices = [item[0] for item in PROJECT_TAGS]
        tag_weights = [item[1] for item in PROJECT_TAGS]

        # Iterate day by day from (now - days_back) to now
        for day_offset in range(days_back, -1, -1):
            day_date = now - timedelta(days=day_offset)
            is_weekend = day_date.weekday() in (5, 6)

            # Weekdays have higher traffic (20-40 requests), weekends have lighter traffic (6-16 requests)
            if is_weekend:
                requests_today = random.randint(6, 16)
            else:
                requests_today = random.randint(22, 42)

            # More recent days have higher traffic (growth trend)
            growth_multiplier = 1.0 + (days_back - day_offset) * 0.02
            requests_today = int(requests_today * growth_multiplier)

            for _ in range(requests_today):
                # Pick model profile
                cfg = random.choices(MODEL_CONFIGS, weights=model_weights)[0]

                # Timestamp distributed throughout the day (favoring 9:00 - 20:00 UTC)
                if random.random() < 0.8:
                    hour = random.randint(9, 20)
                else:
                    hour = random.randint(0, 23)
                minute = random.randint(0, 59)
                second = random.randint(0, 59)
                timestamp = day_date.replace(hour=hour, minute=minute, second=second)

                # Generate token counts based on model profile
                input_tokens = random.randint(*cfg["input_range"])
                output_tokens = random.randint(*cfg["output_range"])
                total_tokens = input_tokens + output_tokens

                # Cost is ALWAYS normalized to USD ($)
                cost_usd = calculate_cost(cfg["model"], input_tokens, output_tokens)

                latency_ms = random.randint(*cfg["latency_range"])
                project_tag = random.choices(tag_choices, weights=tag_weights)[0]
                req_id = f"req-{uuid.uuid4().hex[:12]}"

                rec = UsageRecord(
                    timestamp=timestamp,
                    provider=cfg["provider"],
                    model=cfg["model"],
                    input_tokens=input_tokens,
                    output_tokens=output_tokens,
                    total_tokens=total_tokens,
                    cost_usd=cost_usd,
                    request_id=req_id,
                    project_tag=project_tag,
                    latency_ms=latency_ms,
                    created_at=timestamp,
                )
                records.append(rec)

        db.bulk_save_objects(records)
        db.commit()
        print(
            f"Successfully seeded {len(records)} realistic LLM usage records across {days_back + 1} days (3+ weeks)!"
        )
    finally:
        db.close()


if __name__ == "__main__":
    generate_seed_data(days_back=24)
