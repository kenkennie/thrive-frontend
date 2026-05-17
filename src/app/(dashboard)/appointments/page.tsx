"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppointmentsList } from "@/features/appointments/hooks/useAppointments";
import { DailySchedule } from "@/features/appointments/components/DailySchedule";
import { AppointmentCard } from "@/features/appointments/components/Appointmentcard";
import { MonthlyCalendar } from "@/components/ui/Monthlycalendar";
import { Pagination } from "@/components/ui/Pagination";
import { usePermission } from "@/hooks/usePermission";
import { extractArray, extractMeta } from "@/lib/api/response";
import type { Appointment } from "@/lib/api/appointments";
import { cn } from "@/lib/utils";
import {
  CalendarDays,
  List,
  Calendar,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  SlidersHorizontal,
} from "lucide-react";

const todayStr = () => new Date().toISOString().split("T")[0];
const addDays = (d: string, n: number) => {
  const dt = new Date(d);
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().split("T")[0];
};
const fmtLabel = (date: string) => {
  const d = new Date(date),
    now = new Date();
  const diff = Math.round((d.getTime() - now.getTime()) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return d.toLocaleDateString("en-KE", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
};

type ViewMode = "month" | "list" | "schedule";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "ARRIVED", label: "Arrived" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "NO_SHOW", label: "No Show" },
];

const LIMIT = 15;

export default function AppointmentsPage() {
  const router = useRouter();
  const canCreate = usePermission("appointments:create");

  // Default to month view
  const [view, setView] = useState<ViewMode>("month");
  const [date, setDate] = useState(todayStr());
  const [search, setSearch] = useState("");
  const [statusName, setStatusName] = useState("");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [monthYear, setMonthYear] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const resetPage = () => setPage(1);

  const listQuery = useAppointmentsList(
    view === "month"
      ? {
          dateFrom: `${monthYear.year}-${String(monthYear.month + 1).padStart(2, "0")}-01`,
          dateTo: new Date(monthYear.year, monthYear.month + 1, 0)
            .toISOString()
            .split("T")[0],
          limit: 200,
        }
      : {
          date,
          search: search || undefined,
          statusName: statusName || undefined,
          page,
          limit: LIMIT,
        },
  );

  const appointments: Appointment[] = extractArray(listQuery.data);
  const meta = extractMeta(listQuery.data);
  const activeFilterCount = [search, statusName].filter(Boolean).length;

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-9rem)]">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap shrink-0">
        {view !== "month" && (
          <>
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              <button
                onClick={() => {
                  setDate(addDays(date, -1));
                  resetPage();
                }}
                className="p-1.5 rounded-md hover:bg-background transition-colors text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setDate(todayStr());
                  resetPage();
                }}
                className="px-3 py-1.5 rounded-md text-sm font-medium text-foreground hover:bg-background transition-colors min-w-[110px] text-center"
              >
                {fmtLabel(date)}
              </button>
              <button
                onClick={() => {
                  setDate(addDays(date, 1));
                  resetPage();
                }}
                className="p-1.5 rounded-md hover:bg-background transition-colors text-muted-foreground hover:text-foreground"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                resetPage();
              }}
              className="h-9 px-2.5 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          </>
        )}

        {view === "list" && (
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm border transition-colors",
              showFilters || activeFilterCount > 0
                ? "border-primary/50 text-primary bg-primary/5"
                : "border-input text-muted-foreground hover:bg-muted",
            )}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters
            {activeFilterCount > 0 && (
              <span
                className="w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center"
                style={{
                  backgroundColor: "var(--brand-gold)",
                  color: "var(--brand-navy)",
                }}
              >
                {activeFilterCount}
              </span>
            )}
          </button>
        )}

        <div className="ml-auto flex items-center gap-2">
          {/* Order: Month, List, Schedule */}
          <div className="flex items-center bg-muted rounded-lg p-1">
            {(
              [
                { id: "month", icon: Calendar },
                { id: "list", icon: List },
                { id: "schedule", icon: CalendarDays },
              ] as { id: ViewMode; icon: any }[]
            ).map(({ id, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setView(id)}
                className={cn(
                  "p-1.5 rounded-md transition-colors",
                  view === id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
                title={id}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>

          {canCreate && (
            <button
              onClick={() => router.push("/appointments/new")}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                backgroundColor: "var(--brand-gold)",
                color: "var(--brand-navy)",
              }}
            >
              <Plus className="w-4 h-4" />
              New
            </button>
          )}
        </div>
      </div>

      {/* Filter bar */}
      {showFilters && view === "list" && (
        <div className="flex items-center gap-2 flex-wrap shrink-0 p-3 bg-muted/30 rounded-xl border border-border">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                resetPage();
              }}
              placeholder="Client name or phone…"
              className="h-8 pl-8 pr-3 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none w-52"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch("");
                  resetPage();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <select
            value={statusName}
            onChange={(e) => {
              setStatusName(e.target.value);
              resetPage();
            }}
            className="h-8 px-2 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none cursor-pointer"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {activeFilterCount > 0 && (
            <button
              onClick={() => {
                setSearch("");
                setStatusName("");
                resetPage();
              }}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>
      )}

      {/* Stats bar — list and schedule only */}
      {view !== "month" && (
        <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
          <span>{meta?.total ?? appointments.length} appointments</span>
          {[
            {
              label: "completed",
              cls: "text-green-600 dark:text-green-400",
              fn: (a: Appointment) => a.status.isCompleted,
            },
            {
              label: "pending",
              cls: "text-amber-600 dark:text-amber-400",
              fn: (a: Appointment) => a.status.name === "PENDING",
            },
            {
              label: "no-show",
              cls: "text-gray-500",
              fn: (a: Appointment) => a.status.isNoShow,
            },
          ].map(({ label, cls, fn }) => {
            const count = appointments.filter(fn).length;
            return count ? (
              <span key={label} className="flex items-center gap-1">
                <span>·</span>
                <span className={cls}>
                  {count} {label}
                </span>
              </span>
            ) : null;
          })}
        </div>
      )}

      {/* Views — Month first, List second, Schedule third */}
      <div className="flex-1 overflow-hidden min-h-0">
        {view === "month" && (
          <div className="h-full overflow-y-auto">
            <MonthlyCalendar
              appointments={appointments}
              selectedDate={date}
              onSelectDate={(d) => {
                setDate(d);
                setView("list");
              }}
              onMonthChange={(y, m) => setMonthYear({ year: y, month: m })}
            />
          </div>
        )}

        {view === "list" && (
          <div className="flex flex-col gap-3 h-full">
            <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
              {listQuery.isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-24 rounded-xl bg-muted/50 animate-pulse"
                  />
                ))
              ) : appointments.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 gap-2">
                  <CalendarDays className="w-10 h-10 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">
                    No appointments found
                  </p>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={() => {
                        setSearch("");
                        setStatusName("");
                      }}
                      className="text-xs hover:underline"
                      style={{ color: "var(--brand-gold)" }}
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              ) : (
                appointments.map((appt) => (
                  <AppointmentCard
                    key={appt.id}
                    appointment={appt}
                    onClick={() => router.push(`/appointments/${appt.id}`)}
                  />
                ))
              )}
            </div>
            {meta && meta.totalPages > 1 && (
              <div className="shrink-0 pt-2 border-t border-border">
                <Pagination
                  page={page}
                  totalPages={meta.totalPages}
                  total={meta.total}
                  limit={LIMIT}
                  onPageChange={setPage}
                />
              </div>
            )}
          </div>
        )}

        {view === "schedule" && <DailySchedule date={date} />}
      </div>
    </div>
  );
}
