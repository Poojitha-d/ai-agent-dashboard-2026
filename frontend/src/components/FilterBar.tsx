"use client";

import React from "react";
import { FilterState } from "../types";
import { Calendar, Filter, Tag } from "lucide-react";

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  availableProviders: string[];
  availableProjects: string[];
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  availableProviders,
  availableProjects,
}) => {
  const rangeOptions: { label: string; value: FilterState["range"] }[] = [
    { label: "24 Hours", value: "24h" },
    { label: "7 Days", value: "7d" },
    { label: "30 Days", value: "30d" },
    { label: "All Time", value: "all" },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Date Range Buttons */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          Range:
        </span>
        <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1 text-xs">
          {rangeOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onFilterChange({ ...filters, range: opt.value })}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                filters.range === opt.value
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Select Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Provider Filter */}
        <div className="flex items-center gap-1.5 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={filters.provider}
            onChange={(e) =>
              onFilterChange({ ...filters, provider: e.target.value })
            }
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">All Providers</option>
            {availableProviders.map((p) => (
              <option key={p} value={p}>
                {p.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        {/* Project Tag Filter */}
        <div className="flex items-center gap-1.5 text-xs">
          <Tag className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={filters.project_tag}
            onChange={(e) =>
              onFilterChange({ ...filters, project_tag: e.target.value })
            }
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">All Projects</option>
            {availableProjects.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
