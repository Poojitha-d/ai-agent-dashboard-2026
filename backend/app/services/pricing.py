from typing import Dict, Tuple

# Rates in USD per 1 Million tokens: (input_rate_per_m, output_rate_per_m)
MODEL_PRICING: Dict[str, Tuple[float, float]] = {
    # OpenAI
    "gpt-4o": (2.50, 10.00),
    "gpt-4o-mini": (0.15, 0.60),
    "gpt-4-turbo": (10.00, 30.00),
    "o1": (15.00, 60.00),
    "o1-mini": (3.00, 12.00),
    
    # Anthropic
    "claude-3-5-sonnet": (3.00, 15.00),
    "claude-3-5-haiku": (0.80, 4.00),
    "claude-3-opus": (15.00, 75.00),
    
    # Google Gemini
    "gemini-1.5-pro": (1.25, 5.00),
    "gemini-1.5-flash": (0.075, 0.30),
    "gemini-2.0-flash": (0.10, 0.40),
    "gemini-2.5-pro": (1.50, 6.00),
    
    # Azure OpenAI
    "azure/gpt-4o": (2.50, 10.00),
    "azure/gpt-4o-mini": (0.15, 0.60),
}

DEFAULT_RATE: Tuple[float, float] = (1.00, 3.00)


def calculate_cost(model: str, input_tokens: int, output_tokens: int) -> float:
    """Calculate USD cost given model and token counts."""
    # Find matching rate (case-insensitive substring match)
    model_lower = model.lower()
    rates = DEFAULT_RATE
    for key, val in MODEL_PRICING.items():
        if key in model_lower or model_lower in key:
            rates = val
            break
            
    input_cost = (input_tokens / 1_000_000.0) * rates[0]
    output_cost = (output_tokens / 1_000_000.0) * rates[1]
    return round(input_cost + output_cost, 6)
