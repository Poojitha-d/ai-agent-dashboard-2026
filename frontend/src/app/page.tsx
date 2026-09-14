"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Coins,
  Cpu,
  Clock,
  Zap,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

import {
  UsageSummary,
  TimeSeriesPoint,
  ModelUsageBreakdown,
  CostProjection,
  FilterState,
} from "../types";
import {
  fetchUsageSummary,
  fetchUsageTimeseries,
  fetchUsageByModel,
  fetchCostProjections,
} from "../lib/api";
import { useRealtimeUsage } from "../hooks/useRealtimeUsage";

import { Navbar } from "../components/Navbar";
import { MetricCard } from "../components/MetricCard";
import { FilterBar } from "../components/FilterBar";
import { UsageChart } from "../components/UsageChart";
import { ModelBarChart } from "../components/ModelBarChart";
import { CostDonutChart } from "../components/CostDonutChart";
import { IngestModal } from "../components/IngestModal";

export default function DashboardPage() {
  const [filters, setFilters] = useState<FilterState>({
    range: "30d",
    provider: "all",
    project_tag: "all",
  });
  const [interval, setInterval] = useState<"day" | "hour">("day");

  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [timeseries, setTimeseries] = useState<TimeSeriesPoint[]>([]);
  const [models, setModels] = useState<ModelUsageBreakdown[]>([]);
  const [costs, setCosts] = useState<CostProjection | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isIngestOpen, setIsIngestOpen] = useState(false);

  const loadData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    setError(null);
    try {
      const [sumRes, timeRes, modRes, costRes] = await Promise.all([
        fetchUsageSummary(filters),
        fetchUsageTimeseries(filters, interval),
        fetchUsageByModel(filters),
        fetchCostProjections(),
      ]);

      setSummary(sumRes);
      setTimeseries(timeRes.points || []);
      setModels(modRes || []);
      setCosts(costRes);
    } catch (err: any) {
      console.error("Failed to load dashboard data:", err);
      setError("Unable to connect to backend API. Please ensure the FastAPI server is running.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [filters, interval]);

  // Hook into Server-Sent Events for real-time live updates
  const { isConnected } = useRealtimeUsage(() => {
    loadData(false);
  });

  useEffect(() => {
    loadData(true);
  }, [loadData]);

  // Formatters
  const formatTokens = (num: number) => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}k`;
    return num.toLocaleString();
  };

  const activeProviders = summary?.active_providers || [];
  const activeProjects = costs ? Object.keys(costs.project_breakdown) : [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <Navbar
        isLiveConnected={isConnected}
        onRefresh={() => loadData(true)}
        onOpenIngest={() => setIsIngestOpen(true)}
        isRefreshing={isRefreshing}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Error notification banner */}
        {error && (
          <div className="bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 p-4 rounded-xl flex items-center gap-3 text-sm text-rose-800 dark:text-rose-200 shadow-sm">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-600 dark:text-rose-400" />
            <div className="flex-1 font-medium">{error}</div>
            <button
              onClick={() => loadData(true)}
              className="px-3 py-1 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-700 transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* Filter Controls Bar */}
        <FilterBar
          filters={filters}
          onFilterChange={setFilters}
          availableProviders={activeProviders}
          availableProjects={activeProjects}
        />

        {/* Overview KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Tokens Processed"
            value={summary ? formatTokens(summary.total_tokens) : "—"}
            subtitle={
              summary
                ? `${formatTokens(summary.total_input_tokens)} in / ${formatTokens(
                    summary.total_output_tokens
                  )} out`
                : undefined
            }
            icon={Coins}
            accentColor="blue"
            trend={{ value: "+14.2% wk", isPositive: true }}
          />

          <MetricCard
            title="Total API Cost (USD)"
            value={summary ? `$${summary.total_cost_usd.toFixed(2)}` : "—"}
            subtitle={
              costs ? `Est. $${costs.projected_monthly_cost.toFixed(2)} / mo` : undefined
            }
            icon={TrendingUp}
            accentColor="emerald"
            trend={{ value: "-4.8% cost/req", isPositive: true }}
          />

          <MetricCard
            title="Most Used Model"
            value={summary?.most_used_model || "—"}
            subtitle={
              summary
                ? `${summary.active_models.length} active models across ${summary.active_providers.length} providers`
                : undefined
            }
            icon={Cpu}
            accentColor="purple"
          />

          <MetricCard
            title="Requests & Latency"
            value={
              summary?.avg_latency_ms
                ? `${summary.avg_latency_ms} ms`
                : summary
                ? `${summary.total_requests} reqs`
                : "—"
            }
            subtitle={
              summary
                ? `${summary.total_requests.toLocaleString()} total API executions`
                : undefined
            }
            icon={Zap}
            accentColor="amber"
          />
        </div>

        {/* Time-series area chart */}
        <UsageChart
          data={timeseries}
          interval={interval}
          onIntervalChange={setInterval}
          isLoading={isLoading}
        />

        {/* Two-column comparison views */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ModelBarChart data={models} isLoading={isLoading} />
          <CostDonutChart projections={costs} isLoading={isLoading} />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-400 dark:text-slate-500">
          AI Agent Dashboard 2026 • Real-time Multi-Provider LLM Telemetry • Built with Next.js & FastAPI
        </div>
      </footer>

      {/* Modal for manual ingestion and CSV upload */}
      <IngestModal
        isOpen={isIngestOpen}
        onClose={() => setIsIngestOpen(false)}
        onSuccess={() => loadData(true)}
      />
    </div>
  );
}
