import csv
import io
from datetime import datetime
from typing import List
from app.schemas.usage import UsageRecordCreate
from app.services.pricing import calculate_cost


class CSVLogAdapter:
    @staticmethod
    def parse_csv(csv_text: str, default_project_tag: str = "csv-import") -> List[UsageRecordCreate]:
        reader = csv.DictReader(io.StringIO(csv_text.strip()))
        results = []
        for row in reader:
            # Case insensitive key lookups
            normalized_row = {k.strip().lower(): v.strip() for k, v in row.items() if k}

            provider = normalized_row.get("provider", "openai")
            model = normalized_row.get("model", "gpt-4o")
            input_tokens = int(normalized_row.get("input_tokens") or normalized_row.get("prompt_tokens") or 0)
            output_tokens = int(normalized_row.get("output_tokens") or normalized_row.get("completion_tokens") or 0)
            total_tokens = int(normalized_row.get("total_tokens") or (input_tokens + output_tokens))

            cost_val = normalized_row.get("cost_usd") or normalized_row.get("cost")
            cost_usd = float(cost_val) if cost_val else calculate_cost(model, input_tokens, output_tokens)

            ts_str = normalized_row.get("timestamp") or normalized_row.get("time") or normalized_row.get("date")
            if ts_str:
                try:
                    ts = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
                except Exception:
                    ts = datetime.utcnow()
            else:
                ts = datetime.utcnow()

            req_id = normalized_row.get("request_id") or normalized_row.get("id")
            project_tag = normalized_row.get("project_tag") or normalized_row.get("project") or default_project_tag

            results.append(
                UsageRecordCreate(
                    timestamp=ts,
                    provider=provider,
                    model=model,
                    input_tokens=input_tokens,
                    output_tokens=output_tokens,
                    total_tokens=total_tokens,
                    cost_usd=cost_usd,
                    request_id=req_id,
                    project_tag=project_tag,
                )
            )
        return results
