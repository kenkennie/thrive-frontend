"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { extractArray } from "@/lib/api/response";
import api from "@/lib/api/client";
import { formatDate, cn } from "@/lib/utils";
import {
  Stethoscope,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  X,
  ChevronRight,
} from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-muted text-muted-foreground",
  COMPLETED:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  MISSED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const STATUS_ICON: Record<string, React.ElementType> = {
  PENDING: Clock,
  COMPLETED: CheckCircle2,
  MISSED: AlertCircle,
};

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "COMPLETED", label: "Completed" },
  { value: "PENDING", label: "Pending" },
  { value: "MISSED", label: "Missed" },
];

export default function SessionsPage() {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["sessions", "list", status, search],
    queryFn: () =>
      api.get("/treatment-sessions", {
        params: {
          status: status || undefined,
          search: search || undefined,
          limit: 50,
        },
      }),
    select: (res) => extractArray(res),
  });
  const sessions: any[] = data ?? [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Clinical Sessions
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {sessions.length} sessions
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search client…"
            className="h-9 pl-8 pr-3 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 w-48"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="flex items-center bg-muted rounded-xl p-1 gap-0.5">
          {STATUS_TABS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setStatus(value)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                status === value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-4 animate-pulse"
              >
                <div className="w-9 h-9 rounded-xl bg-muted shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 bg-muted rounded" />
                  <div className="h-3 w-32 bg-muted/60 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2">
            <Stethoscope className="w-10 h-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No sessions found</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {sessions.map((s: any) => {
              const Icon = STATUS_ICON[s.status] ?? Clock;
              const service =
                s.appointment?.appointmentServices?.[0]?.service?.name;
              return (
                <button
                  key={s.id}
                  onClick={() => router.push(`/clinical/sessions/${s.id}`)}
                  className="w-full flex items-center gap-4 px-4 py-3.5 text-left hover:bg-muted/20 transition-colors group"
                >
                  <div
                    className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                      STATUS_STYLES[s.status] ??
                        "bg-muted text-muted-foreground",
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-foreground">
                        {s.client?.fullName ?? "—"}
                      </p>
                      <span
                        className={cn(
                          "text-[10px] px-2 py-0.5 rounded-full font-medium",
                          STATUS_STYLES[s.status],
                        )}
                      >
                        {s.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {service ?? "Session"} ·{" "}
                      {formatDate(s.appointment?.date ?? s.createdAt)} · Dr.{" "}
                      {s.doctor?.fullName}
                    </p>
                    {s.followUpRequired && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-0.5">
                        <AlertCircle className="w-3 h-3" /> Follow-up required
                      </p>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
