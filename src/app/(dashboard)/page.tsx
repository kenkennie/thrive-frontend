"use client";

import { useQuery } from "@tanstack/react-query";
import reportsApi from "@/lib/api/reports";
import appointmentsApi from "@/lib/api/appointments";
import { formatCurrency, formatTime } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth.store";
import { AppointmentCard } from "@/features/appointments/components/Appointmentcard";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import type { Appointment } from "@/lib/api/appointments";

// ── KPI card ──────────────────────────────────────────────────────────────────

function KpiCard({
  title,
  value,
  sub,
  icon: Icon,
  color,
  trend,
}: {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color: string;
  trend?: { value: number };
}) {
  return (
    <div className="bg-card rounded-2xl border border-border p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon
            className="w-4.5 h-4.5"
            style={{ color }}
          />
        </div>
        {trend && (
          <div
            className={`flex items-center gap-0.5 text-xs font-medium ${trend.value >= 0 ? "text-green-600" : "text-red-500"}`}
          >
            <ArrowUpRight
              className={`w-3.5 h-3.5 ${trend.value < 0 ? "rotate-180" : ""}`}
            />
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        <p className="text-sm text-muted-foreground mt-1">{title}</p>
      </div>
    </div>
  );
}

function KpiSkeleton() {
  return (
    <div className="bg-card rounded-2xl border border-border p-5 h-36 animate-pulse">
      <div className="w-9 h-9 rounded-xl bg-muted mb-4" />
      <div className="h-7 w-24 bg-muted rounded mb-2" />
      <div className="h-3 w-32 bg-muted/60 rounded" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];

  const { data: overview, isLoading: loadingOverview } = useQuery({
    queryKey: ["reports", "overview", "today"],
    queryFn: () =>
      reportsApi.getOverview({ preset: "today" }).then((r) => r.data.data),
  });

  const { data: todayAppts, isLoading: loadingAppts } = useQuery({
    queryKey: ["appointments", "today"],
    queryFn: () =>
      appointmentsApi.list({ date: today, limit: 50 }).then((r) => r.data),
  });

  // FIX: todayAppts is the full paginated response { data: [], meta: {} }
  // r.data gives axios .data, then .data is the appointments array
  const appointments: Appointment[] = Array.isArray(todayAppts?.data)
    ? todayAppts.data
    : [];

  const pending = appointments.filter((a) => a.status.name === "PENDING");
  const inProgress = appointments.filter(
    (a) =>
      a.status.name === "IN_PROGRESS" ||
      a.status.name === "ARRIVED" ||
      a.status.name === "CHECKED_IN",
  );
  const completed = appointments.filter((a) => a.status.isCompleted);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-xl font-semibold text-foreground">
          {greeting()}, {user?.fullName?.split(" ")[0] ?? "there"} 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {new Date().toLocaleDateString("en-KE", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loadingOverview ? (
          Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)
        ) : overview ? (
          <>
            <KpiCard
              title="Today's bookings"
              value={overview.appointments.total}
              sub={`${overview.appointments.completionRate}% completion rate`}
              icon={Calendar}
              color="#C8A96E"
            />
            <KpiCard
              title="Revenue (KES)"
              value={formatCurrency(overview.revenue.kes)}
              sub={
                overview.revenue.usd > 0
                  ? `+ USD ${overview.revenue.usd.toFixed(2)}`
                  : undefined
              }
              icon={TrendingUp}
              color="#22c55e"
            />
            <KpiCard
              title="No-shows"
              value={overview.appointments.noShows}
              sub={`${overview.appointments.noShowRate}% no-show rate`}
              icon={AlertCircle}
              color="#ef4444"
            />
            <KpiCard
              title="New clients"
              value={overview.clients.new}
              sub={`${overview.clients.returning} returning today`}
              icon={Users}
              color="#3b82f6"
            />
          </>
        ) : null}
      </div>

      {/* Today's flow */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[
          { label: "Pending", items: pending, icon: Clock, color: "#f59e0b" },
          {
            label: "In Session",
            items: inProgress,
            icon: CheckCircle2,
            color: "#8b5cf6",
          },
          {
            label: "Completed",
            items: completed,
            icon: CheckCircle2,
            color: "#22c55e",
          },
        ].map(({ label, items, icon: Icon, color }) => (
          <div
            key={label}
            className="space-y-2"
          >
            <div className="flex items-center gap-2">
              <Icon
                className="w-4 h-4"
                style={{ color }}
              />
              <h3 className="text-sm font-semibold text-foreground">{label}</h3>
              <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {items.length}
              </span>
            </div>

            {loadingAppts ? (
              <div className="h-20 rounded-xl bg-muted/50 animate-pulse" />
            ) : items.length === 0 ? (
              <div className="h-20 rounded-xl border border-dashed border-border flex items-center justify-center">
                <p className="text-xs text-muted-foreground">None</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-0.5">
                {items.map((appt) => (
                  <AppointmentCard
                    key={appt.id}
                    appointment={appt}
                    compact
                    onClick={() => router.push(`/appointments/${appt.id}`)}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick link */}
      <div className="flex justify-end">
        <button
          onClick={() => router.push("/appointments")}
          className="flex items-center gap-1.5 text-sm font-medium hover:underline transition-colors"
          style={{ color: "var(--brand-gold)" }}
        >
          View full schedule <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
