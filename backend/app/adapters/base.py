from abc import ABC, abstractmethod
from typing import Dict, Any, List
from app.schemas.usage import UsageRecordCreate


class BaseProviderAdapter(ABC):
    """
    Abstract base provider adapter.
    
    All implementing adapters must ensure:
    - Provider payload is parsed into normalized UsageRecordCreate schemas.
    - 'cost_usd' is ALWAYS normalized to United States Dollars (USD) regardless of source
      provider billing currency or regional pricing tiers.
    """
    provider_name: str = "generic"

    @abstractmethod
    def parse(self, raw_data: Dict[str, Any], project_tag: str = "default") -> List[UsageRecordCreate]:
        """
        Convert a provider-specific usage payload into normalized UsageRecordCreate items.
        Costs must be normalized to USD ($).
        """
        pass

