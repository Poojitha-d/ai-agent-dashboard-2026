"use client";

import React, { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { TimeSeriesPoint } from "../types";
import { Activity, DollarSign, Layers } from "lucide-react";

interface UsageChartProps {
  data: TimeSeriesPoint[];
  interval: "day" | "hour";
  onIntervalChange: (interval: "day" | "hour") => void;
  isLoading?: boolean;
}

type ViewMode = "tokens" | "split" | "cost";

export const UsageChart: React.FC<UsageChartProps> = ({
  data,
  interval,
  onIntervalChange,
  isLoading,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>("tokens");

  const formatNumber = (num: number) => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(0)}k`;
    return num.toLocaleString();
  };

  const formatCurrency = (val: number) => `$${val.toFixed(2)}`;

  const formatDateLabel = (ts: string) => {
    if (!ts) return "";
    if (interval === "hour") {
      const parts = ts.split("T");
      return parts[1] ? parts[1].substring(0, 5) : ts;
    }
    const d = new Date(ts);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-500" />
            Token & Cost Consumption Trends
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Monitor API throughput, prompt/completion split, and spend
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Switcher */}
          <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1 text-xs">
            <button
              onClick={() => setViewMode("tokens")}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                viewMode === "tokens"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              Total Tokens
            </button>
            <button
              onClick={() => setViewMode("split")}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                viewMode === "split"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              Prompt / Output
            </button>
            <button
              onClick={() => setViewMode("cost")}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                viewMode === "cost"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              Cost ($)
            </button>
          </div>

          {/* Interval Switcher */}
          <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1 text-xs">
            <button
              onClick={() => onIntervalChange("day")}
              className={`px-2 py-1 rounded-md font-medium transition-all ${
                interval === "day"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => onIntervalChange("hour")}
              className={`px-2 py-1 rounded-md font-medium transition-all ${
                interval === "hour"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              Hourly
            </button>
          </div>
        </div>
      </div>

      <div className="h-80 w-full mt-4">
        {isLoading ? (
          <div className="h-full w-full flex items-center justify-center">
            <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : data.length === 0 ? (
          <div className="h-full w-full flex items-center justify-center text-slate-400 text-sm">
            No usage records found for selected filter range.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="tokenGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="promptGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="outputGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" vertical={false} />
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatDateLabel}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={viewMode === "cost" ? formatCurrency : formatNumber}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(15, 23, 42, 0.92)",
                  borderColor: "rgba(51, 65, 85, 0.5)",
                  borderRadius: "0.5rem",
                  color: "#f8fafc",
                  fontSize: "12px",
                }}
                labelFormatter={(val) => formatDateLabel(String(val))}
                formatter={(value: any, name: string) => {
                  const num = Number(value);
                  if (name.toLowerCase().includes("cost")) return [`$${num.toFixed(4)}`, name];
                  return [num.toLocaleString() + " tokens", name];
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ fontSize: "12px", paddingBottom: "10px" }}
              />

              {viewMode === "tokens" && (
                <Area
                  type="monotone"
                  dataKey="tokens"
                  name="Total Tokens"
                  stroke="#0284c7"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#tokenGrad)"
                />
              )}

              {viewMode === "split" && (
                <>
                  <Area
                    type="monotone"
                    dataKey="input_tokens"
                    name="Prompt Tokens"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    stackId="1"
                    fillOpacity={1}
                    fill="url(#promptGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="output_tokens"
                    name="Output Tokens"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    stackId="1"
                    fillOpacity={1}
                    fill="url(#outputGrad)"
                  />
                </>
              )}

              {viewMode === "cost" && (
                <Area
                  type="monotone"
                  dataKey="cost_usd"
                  name="Spend ($ USD)"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#costGrad)"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
