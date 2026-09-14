from datetime import datetime
from typing import Dict, Any, List
from app.adapters.base import BaseProviderAdapter
from app.schemas.usage import UsageRecordCreate


class OpenAIAdapter(BaseProviderAdapter):
    provider_name: str = "openai"

    def parse(self, raw_data: Dict[str, Any], project_tag: str = "default") -> List[UsageRecordCreate]:
        # Accepts standard OpenAI ChatCompletion or Completion response dict
        model = raw_data.get("model", "gpt-4o")
        req_id = raw_data.get("id")
        created_timestamp = raw_data.get("created")
        if created_timestamp:
            ts = datetime.utcfromtimestamp(created_timestamp)
        else:
            ts = datetime.utcnow()

        usage = raw_data.get("usage", {})
        prompt_tokens = usage.get("prompt_tokens", 0)
        completion_tokens = usage.get("completion_tokens", 0)
        total_tokens = usage.get("total_tokens", prompt_tokens + completion_tokens)

        return [
            UsageRecordCreate(
                timestamp=ts,
                provider=self.provider_name,
                model=model,
                input_tokens=prompt_tokens,
                output_tokens=completion_tokens,
                total_tokens=total_tokens,
                request_id=req_id,
                project_tag=project_tag,
            )
        ]
