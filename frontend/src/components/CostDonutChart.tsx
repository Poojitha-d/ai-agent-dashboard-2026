"use client";

import React, { useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import { CostProjection } from "../types";
import { PieChart as PieIcon, TrendingUp } from "lucide-react";

interface CostDonutChartProps {
  projections: CostProjection | null;
  isLoading?: boolean;
}

const PALETTE = [
  "#0284c7",
  "#10b981",
  "#8b5cf6",
  "#f59e0b",
  "#ec4899",
  "#06b6d4",
  "#64748b",
];

export const CostDonutChart: React.FC<CostDonutChartProps> = ({
  projections,
  isLoading,
}) => {
  const [groupBy, setGroupBy] = useState<"provider" | "project">("provider");

  const rawMap =
    groupBy === "provider"
      ? projections?.provider_breakdown || {}
      : projections?.project_breakdown || {};

  const chartData = Object.entries(rawMap).map(([name, value]) => ({
    name,
    value: Number(value),
  }));

  const totalSpend = projections?.total_cost_to_date || 0;
  const projectedMonthly = projections?.projected_monthly_cost || 0;
  const dailyAverage = projections?.daily_average_cost || 0;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-purple-500" />
            Spend Distribution & Projections
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Cost attribution and projected monthly run rate
          </p>
        </div>

        <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1 text-xs">
          <button
            onClick={() => setGroupBy("provider")}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              groupBy === "provider"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            By Provider
          </button>
          <button
            onClick={() => setGroupBy("project")}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              groupBy === "project"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            By Project
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center mt-3">
        <div className="h-56 w-full relative">
          {isLoading ? (
            <div className="h-full w-full flex items-center justify-center">
              <div className="w-7 h-7 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-full w-full flex items-center justify-center text-slate-400 text-sm">
              No spend data available.
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PALETTE[index % PALETTE.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.92)",
                      borderColor: "rgba(51, 65, 85, 0.5)",
                      borderRadius: "0.5rem",
                      color: "#f8fafc",
                      fontSize: "12px",
                    }}
                    formatter={(val: any) => [`$${Number(val).toFixed(3)}`, "Cost"]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs text-slate-400">Total Spend</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  ${totalSpend.toFixed(2)}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Projection Box */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            Monthly Run Rate Forecast
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            ${projectedMonthly.toFixed(2)}
            <span className="text-xs font-normal text-slate-400 ml-1">/ month</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Based on an average daily velocity of{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              ${dailyAverage.toFixed(3)} / day
            </span>
            .
          </p>

          <div className="mt-3 space-y-1.5 max-h-28 overflow-y-auto pr-1">
            {chartData.map((item, idx) => (
              <div
                key={item.name}
                className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400"
              >
                <div className="flex items-center gap-1.5 truncate max-w-[140px]">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: PALETTE[idx % PALETTE.length] }}
                  />
                  <span className="truncate">{item.name}</span>
                </div>
                <span className="font-medium text-slate-900 dark:text-slate-200">
                  ${item.value.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
