"use client";

import React, { useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import { ModelUsageBreakdown } from "../types";
import { Cpu } from "lucide-react";

interface ModelBarChartProps {
  data: ModelUsageBreakdown[];
  isLoading?: boolean;
}

const PROVIDER_COLORS: Record<string, string> = {
  openai: "#10a37f",
  anthropic: "#d97706",
  gemini: "#8b5cf6",
  google: "#8b5cf6",
  azure_openai: "#0284c7",
  azure: "#0284c7",
};

export const ModelBarChart: React.FC<ModelBarChartProps> = ({ data, isLoading }) => {
  const [metric, setMetric] = useState<"tokens" | "cost">("tokens");

  const formatNumber = (num: number) => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(0)}k`;
    return num.toLocaleString();
  };

  const chartData = data.slice(0, 8).map((m) => ({
    model: m.model,
    provider: m.provider,
    value: metric === "tokens" ? m.total_tokens : m.cost_usd,
    tokens: m.total_tokens,
    cost: m.cost_usd,
    percentage: m.percentage_cost,
  }));

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-500" />
            Model Consumption & Cost
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Compare usage volume across deployed AI models
          </p>
        </div>

        <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1 text-xs">
          <button
            onClick={() => setMetric("tokens")}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              metric === "tokens"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            Tokens
          </button>
          <button
            onClick={() => setMetric("cost")}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              metric === "cost"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            Cost ($)
          </button>
        </div>
      </div>

      <div className="h-72 w-full mt-4">
        {isLoading ? (
          <div className="h-full w-full flex items-center justify-center">
            <div className="w-7 h-7 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-full w-full flex items-center justify-center text-slate-400 text-sm">
            No model data available.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 35, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" horizontal={false} />
              <XAxis
                type="number"
                tickFormatter={metric === "tokens" ? formatNumber : (v) => `$${v.toFixed(2)}`}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="model"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                width={85}
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
                formatter={(value: any, name: string, props: any) => {
                  const item = props.payload;
                  return [
                    `${formatNumber(item.tokens)} tokens ($${item.cost.toFixed(4)} | ${item.percentage}%)`,
                    "Usage",
                  ];
                }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={PROVIDER_COLORS[entry.provider.toLowerCase()] || "#0284c7"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#10a37f]" /> OpenAI
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#d97706]" /> Anthropic
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#8b5cf6]" /> Gemini
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7]" /> Azure OpenAI
        </span>
      </div>
    </div>
  );
};
