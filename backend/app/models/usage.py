import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime
from app.db.session import Base


class UsageRecord(Base):
    __tablename__ = "usage_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True, nullable=False)
    provider = Column(String(64), index=True, nullable=False)
    model = Column(String(128), index=True, nullable=False)
    input_tokens = Column(Integer, default=0, nullable=False)
    output_tokens = Column(Integer, default=0, nullable=False)
    total_tokens = Column(Integer, default=0, nullable=False)
    cost_usd = Column(Float, default=0.0, nullable=False)
    request_id = Column(String(128), nullable=True, index=True)
    project_tag = Column(String(64), default="default", index=True, nullable=False)
    latency_ms = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
