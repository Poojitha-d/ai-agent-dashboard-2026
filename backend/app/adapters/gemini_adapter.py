from datetime import datetime
from typing import Dict, Any, List
from app.adapters.base import BaseProviderAdapter
from app.schemas.usage import UsageRecordCreate


class GeminiAdapter(BaseProviderAdapter):
    provider_name: str = "gemini"

    def parse(self, raw_data: Dict[str, Any], project_tag: str = "default") -> List[UsageRecordCreate]:
        # Accepts Google Gemini GenerateContent response dict
        model = raw_data.get("modelVersion") or raw_data.get("model", "gemini-1.5-pro")
        req_id = raw_data.get("responseId")
        ts = datetime.utcnow()

        meta = raw_data.get("usageMetadata", {})
        prompt_tokens = meta.get("promptTokenCount", 0)
        candidates_tokens = meta.get("candidatesTokenCount", 0)
        total_tokens = meta.get("totalTokenCount", prompt_tokens + candidates_tokens)

        return [
            UsageRecordCreate(
                timestamp=ts,
                provider=self.provider_name,
                model=model,
                input_tokens=prompt_tokens,
                output_tokens=candidates_tokens,
                total_tokens=total_tokens,
                request_id=req_id,
                project_tag=project_tag,
            )
        ]
