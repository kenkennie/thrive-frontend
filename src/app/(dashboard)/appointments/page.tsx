"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useAppointmentsList,
  useCreateAppointment,
} from "@/features/appointments/hooks/useAppointments";
import { DailySchedule } from "@/features/appointments/components/DailySchedule";
import { AppointmentCard } from "@/features/appointments/components/Appointmentcard";
import { AppointmentDetail } from "@/features/appointments/components/AppointmentDetail";
import { AppointmentForm } from "@/features/appointments/components/Appointmentform";
import { Pagination } from "@/components/ui/Pagination";
import type { Appointment } from "@/lib/api/appointments";
import { cn } from "@/lib/utils";
import { usePermission } from "@/hooks/usePermission";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api/client";
import {
  CalendarDays,
  List,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Filter,
  X,
  SlidersHorizontal,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────

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

type ViewMode = "schedule" | "list";

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

// ─────────────────────────────────────────────────────────────────────────────

export default function AppointmentsPage() {
  const router = useRouter();
  const canCreate = usePermission("appointments:create");

  // View state
  const [view, setView] = useState<ViewMode>("list");
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<Appointment | null>(null);

  // Filters
  const [date, setDate] = useState(todayStr());
  const [search, setSearch] = useState("");
  const [statusName, setStatusName] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Reset page on filter change
  const resetPage = () => setPage(1);

  const { data, isLoading } = useAppointmentsList({
    date,
    search: search || undefined,
    statusName: statusName || undefined,
    doctorId: doctorId || undefined,
    page,
    limit: LIMIT,
  });

  const appointments: Appointment[] = Array.isArray(data?.data)
    ? data.data
    : [];
  const meta = data?.meta;

  const createAppt = useCreateAppointment();

  // Load doctors for filter
  const { data: doctorsData } = useQuery({
    queryKey: ["doctors-filter"],
    queryFn: () =>
      api
        .get<any>("/users?role=doctor&limit=50")
        .then((r) => r.data?.data ?? []),
  });
  const doctors = doctorsData ?? [];

  const activeFilterCount = [search, statusName, doctorId].filter(
    Boolean,
  ).length;

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-9rem)]">
      {/* ── Toolbar ── */}
      <div className="flex items-center gap-2 flex-wrap shrink-0">
        {/* Date nav */}
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

        {/* Filter toggle */}
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={cn(
            "flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm border transition-colors",
            showFilters || activeFilterCount > 0
              ? "border-primary/60 text-primary bg-primary/5"
              : "border-input text-muted-foreground hover:bg-muted",
          )}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filters
          {activeFilterCount > 0 && (
            <span
              className="ml-0.5 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
              style={{
                backgroundColor: "var(--brand-gold)",
                color: "var(--brand-navy)",
              }}
            >
              {activeFilterCount}
            </span>
          )}
        </button>

        <div className="ml-auto flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center bg-muted rounded-lg p-1">
            {(["schedule", "list"] as ViewMode[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "p-1.5 rounded-md transition-colors",
                  view === v
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {v === "schedule" ? (
                  <CalendarDays className="w-4 h-4" />
                ) : (
                  <List className="w-4 h-4" />
                )}
              </button>
            ))}
          </div>

          {canCreate && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                backgroundColor: "var(--brand-gold)",
                color: "var(--brand-navy)",
              }}
            >
              <Plus className="w-4 h-4" />
              New Appointment
            </button>
          )}
        </div>
      </div>

      {/* ── Filter bar ── */}
      {showFilters && (
        <div className="flex items-center gap-2 flex-wrap shrink-0 p-3 bg-muted/30 rounded-xl border border-border">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                resetPage();
              }}
              placeholder="Client name or phone…"
              className="h-8 pl-8 pr-3 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 w-52"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch("");
                  resetPage();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Status filter */}
          <select
            value={statusName}
            onChange={(e) => {
              setStatusName(e.target.value);
              resetPage();
            }}
            className="h-8 px-2 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none cursor-pointer"
          >
            {STATUS_OPTIONS.map((o) => (
              <option
                key={o.value}
                value={o.value}
              >
                {o.label}
              </option>
            ))}
          </select>

          {/* Doctor filter */}
          {doctors.length > 0 && (
            <select
              value={doctorId}
              onChange={(e) => {
                setDoctorId(e.target.value);
                resetPage();
              }}
              className="h-8 px-2 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none cursor-pointer"
            >
              <option value="">All doctors</option>
              {doctors.map((d: any) => (
                <option
                  key={d.id}
                  value={d.id}
                >
                  {d.fullName}
                </option>
              ))}
            </select>
          )}

          {activeFilterCount > 0 && (
            <button
              onClick={() => {
                setSearch("");
                setStatusName("");
                setDoctorId("");
                resetPage();
              }}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* ── Stats bar ── */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
        <span>{meta?.total ?? appointments.length} appointments</span>
        {[
          {
            label: "completed",
            color: "text-green-600 dark:text-green-400",
            filter: (a: Appointment) => a.status.isCompleted,
          },
          {
            label: "pending",
            color: "text-amber-600 dark:text-amber-400",
            filter: (a: Appointment) => a.status.name === "PENDING",
          },
          {
            label: "no-show",
            color: "text-gray-500",
            filter: (a: Appointment) => a.status.isNoShow,
          },
        ].map(({ label, color, filter }) => {
          const count = appointments.filter(filter).length;
          if (!count) return null;
          return (
            <span
              key={label}
              className="flex items-center gap-1"
            >
              <span>·</span>
              <span className={color}>
                {count} {label}
              </span>
            </span>
          );
        })}
      </div>

      {/* ── New appointment form ── */}
      {showForm && (
        <div className="shrink-0 bg-card rounded-2xl border border-border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-muted/30">
            <h2 className="text-sm font-semibold text-foreground">
              New Appointment
            </h2>
            <button
              onClick={() => setShowForm(false)}
              className="p-1 rounded-md hover:bg-muted transition-colors text-muted-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-5 max-h-[60vh] overflow-y-auto">
            <AppointmentForm
              isLoading={createAppt.isPending}
              onCancel={() => setShowForm(false)}
              onSubmit={async (data) => {
                await createAppt.mutateAsync(data as any);
                setShowForm(false);
              }}
            />
          </div>
        </div>
      )}

      {/* ── Main content ── */}
      <div className="flex-1 overflow-hidden min-h-0">
        {view === "schedule" ? (
          <DailySchedule
            date={date}
            doctorId={doctorId || undefined}
          />
        ) : (
          <div className="flex gap-4 h-full">
            {/* List */}
            <div className="flex-1 flex flex-col gap-3 min-w-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
                {isLoading ? (
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
                      {activeFilterCount > 0
                        ? "No appointments match your filters"
                        : "No appointments for this date"}
                    </p>
                    {activeFilterCount > 0 && (
                      <button
                        onClick={() => {
                          setSearch("");
                          setStatusName("");
                          setDoctorId("");
                          resetPage();
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
                      onClick={() =>
                        setSelected(selected?.id === appt.id ? null : appt)
                      }
                    />
                  ))
                )}
              </div>

              {/* Pagination */}
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

            {/* Detail panel */}
            {selected && (
              <div className="w-80 shrink-0 rounded-xl border border-border bg-card overflow-hidden flex flex-col">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
                  <span className="text-sm font-semibold text-foreground">
                    Details
                  </span>
                  <button
                    onClick={() => setSelected(null)}
                    className="p-1 rounded-md hover:bg-muted transition-colors text-muted-foreground text-xs"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex-1 overflow-hidden">
                  <AppointmentDetail
                    appointment={selected}
                    onClose={() => setSelected(null)}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
