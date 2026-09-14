from datetime import datetime
from typing import Dict, Any, List
from app.adapters.base import BaseProviderAdapter
from app.schemas.usage import UsageRecordCreate


class AnthropicAdapter(BaseProviderAdapter):
    provider_name: str = "anthropic"

    def parse(self, raw_data: Dict[str, Any], project_tag: str = "default") -> List[UsageRecordCreate]:
        # Accepts Anthropic Messages API response dict
        model = raw_data.get("model", "claude-3-5-sonnet")
        req_id = raw_data.get("id")
        ts = datetime.utcnow()

        usage = raw_data.get("usage", {})
        input_tokens = usage.get("input_tokens", 0)
        output_tokens = usage.get("output_tokens", 0)

        return [
            UsageRecordCreate(
                timestamp=ts,
                provider=self.provider_name,
                model=model,
                input_tokens=input_tokens,
                output_tokens=output_tokens,
                total_tokens=input_tokens + output_tokens,
                request_id=req_id,
                project_tag=project_tag,
            )
        ]
