export interface UsageSummary {
  total_tokens: number;
  total_input_tokens: number;
  total_output_tokens: number;
  total_cost_usd: number;
  total_requests: number;
  most_used_model: string;
  avg_latency_ms: number | null;
  active_providers: string[];
  active_models: string[];
}

export interface TimeSeriesPoint {
  timestamp: string;
  tokens: number;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  requests: number;
}

export interface TimeSeriesResponse {
  interval: string;
  points: TimeSeriesPoint[];
}

export interface ModelUsageBreakdown {
  model: string;
  provider: string;
  total_tokens: number;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  request_count: number;
  percentage_cost: number;
}

export interface CostProjection {
  total_cost_to_date: number;
  daily_average_cost: number;
  projected_monthly_cost: number;
  provider_breakdown: Record<string, number>;
  project_breakdown: Record<string, number>;
}

export interface UsageRecord {
  id: number;
  timestamp: string;
  provider: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  cost_usd: number;
  request_id?: string | null;
  project_tag: string;
  latency_ms?: number | null;
  created_at: string;
}

export interface FilterState {
  range: "24h" | "7d" | "30d" | "all";
  provider: string;
  project_tag: string;
}
