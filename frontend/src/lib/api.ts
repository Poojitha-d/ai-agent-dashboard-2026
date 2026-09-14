import {
  UsageSummary,
  TimeSeriesResponse,
  ModelUsageBreakdown,
  CostProjection,
  UsageRecord,
  FilterState,
} from "../types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_URL = `${API_BASE}/api`;
const API_KEY = "ai-dash-secret-key-2026";

function getDateRange(range: FilterState["range"]): { start_date?: string } {
  const now = new Date();
  if (range === "24h") {
    const d = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    return { start_date: d.toISOString() };
  }
  if (range === "7d") {
    const d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return { start_date: d.toISOString() };
  }
  if (range === "30d") {
    const d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return { start_date: d.toISOString() };
  }
  return {};
}

function buildQuery(filters?: Partial<FilterState> & { interval?: string }): string {
  const params = new URLSearchParams();
  if (!filters) return "";

  if (filters.range) {
    const { start_date } = getDateRange(filters.range);
    if (start_date) params.append("start_date", start_date);
  }
  if (filters.provider && filters.provider !== "all") {
    params.append("provider", filters.provider);
  }
  if (filters.project_tag && filters.project_tag !== "all") {
    params.append("project_tag", filters.project_tag);
  }
  if (filters.interval) {
    params.append("interval", filters.interval);
  }

  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export async function fetchUsageSummary(filters?: Partial<FilterState>): Promise<UsageSummary> {
  const qs = buildQuery(filters);
  const res = await fetch(`${API_URL}/usage/summary${qs}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch summary: ${res.statusText}`);
  return res.json();
}

export async function fetchUsageTimeseries(
  filters?: Partial<FilterState>,
  interval: "day" | "hour" = "day"
): Promise<TimeSeriesResponse> {
  const qs = buildQuery({ ...filters, interval });
  const res = await fetch(`${API_URL}/usage/timeseries${qs}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch timeseries: ${res.statusText}`);
  return res.json();
}

export async function fetchUsageByModel(filters?: Partial<FilterState>): Promise<ModelUsageBreakdown[]> {
  const qs = buildQuery(filters);
  const res = await fetch(`${API_URL}/usage/by-model${qs}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch model breakdown: ${res.statusText}`);
  return res.json();
}

export async function fetchCostProjections(): Promise<CostProjection> {
  const res = await fetch(`${API_URL}/usage/costs`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch cost projections: ${res.statusText}`);
  return res.json();
}

export async function ingestManualRecord(data: {
  provider: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  project_tag: string;
  latency_ms?: number;
}): Promise<UsageRecord[]> {
  const res = await fetch(`${API_URL}/usage/ingest`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": API_KEY,
    },
    body: JSON.stringify({
      records: [data],
    }),
  });
  if (!res.ok) throw new Error(`Failed to ingest record: ${res.statusText}`);
  return res.json();
}

export async function uploadCSVFile(file: File, projectTag = "csv-import"): Promise<UsageRecord[]> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_URL}/usage/ingest/csv?project_tag=${encodeURIComponent(projectTag)}`, {
    method: "POST",
    headers: {
      "X-API-Key": API_KEY,
    },
    body: formData,
  });
  if (!res.ok) throw new Error(`Failed to upload CSV: ${res.statusText}`);
  return res.json();
}

export function getSSEUrl(): string {
  return `${API_URL}/usage/events`;
}
