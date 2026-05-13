"use client";

import { cn } from "@/lib/utils";

const PRESETS = [
  { value: "today", label: "Today" },
  { value: "this_week", label: "This week" },
  { value: "this_month", label: "This month" },
  { value: "last_month", label: "Last month" },
  { value: "last_30_days", label: "Last 30 days" },
  { value: "last_90_days", label: "Last 90 days" },
  { value: "custom", label: "Custom" },
];

interface Props {
  preset: string;
  dateFrom: string;
  dateTo: string;
  onChange: (update: {
    preset?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => void;
}

export function DateRangeFilter({ preset, dateFrom, dateTo, onChange }: Props) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center bg-muted rounded-xl p-1 gap-0.5 flex-wrap">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            onClick={() => onChange({ preset: p.value })}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
              preset === p.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {preset === "custom" && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => onChange({ dateFrom: e.target.value })}
            className="h-9 px-2.5 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none"
          />
          <span className="text-xs text-muted-foreground">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => onChange({ dateTo: e.target.value })}
            className="h-9 px-2.5 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none"
          />
        </div>
      )}
    </div>
  );
}
