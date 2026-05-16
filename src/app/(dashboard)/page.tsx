"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import reportsApi from "@/lib/api/reports";
import api from "@/lib/api/client";
import { extractArray } from "@/lib/api/response";
import { formatCurrency, cn } from "@/lib/utils";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  Calendar,
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowRight,
  Stethoscope,
  CreditCard,
  Activity,
  ChevronRight,
} from "lucide-react";

// ── Colours ───────────────────────────────────────────────────────────────────

const GOLD = "#C9A84C";
const NAVY = "#1A1A3E";
const GREEN = "#22c55e";
const RED = "#ef4444";
const AMBER = "#f59e0b";
const BLUE = "#3b82f6";
const PURPLE = "#8b5cf6";

const STATUS_DOT: Record<string, string> = {
  PENDING: AMBER,
  CONFIRMED: BLUE,
  ARRIVED: PURPLE,
  CHECKED_IN: "#06b6d4",
  IN_PROGRESS: "#8b5cf6",
  COMPLETED: GREEN,
  CANCELLED: RED,
  NO_SHOW: "#9ca3af",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

function pct(a: number, b: number) {
  return b > 0 ? Math.round((a / b) * 100) : 0;
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Sk({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-muted rounded-xl", className)} />;
}

// ── KPI card ──────────────────────────────────────────────────────────────────

function KpiCard({
  title,
  value,
  sub,
  icon: Icon,
  accent,
  trend,
}: {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  accent: string;
  trend?: number;
}) {
  return (
    <div className="bg-card rounded-2xl border border-border p-5 flex flex-col gap-4 group hover:border-border/80 transition-colors">
      <div className="flex items-start justify-between">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${accent}18` }}
        >
          <Icon
            className="w-5 h-5"
            style={{ color: accent }}
          />
        </div>
        {trend !== undefined && (
          <span
            className={cn(
              "flex items-center gap-0.5 text-xs font-semibold px-2 py-1 rounded-full",
              trend >= 0
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
            )}
          >
            <ArrowUpRight
              className={cn("w-3 h-3", trend < 0 && "rotate-180")}
            />
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground tabular-nums">
          {value}
        </p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        <p className="text-sm text-muted-foreground mt-1">{title}</p>
      </div>
    </div>
  );
}

// ── Custom tooltip ────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label, formatter }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl p-3 shadow-lg">
      <p className="text-xs font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p
          key={i}
          className="text-xs"
          style={{ color: p.color }}
        >
          {p.name}:{" "}
          <span className="font-semibold">
            {formatter ? formatter(p.value) : p.value}
          </span>
        </p>
      ))}
    </div>
  );
}

// ── Mini appointment row ──────────────────────────────────────────────────────

function ApptRow({ appt, onClick }: { appt: any; onClick: () => void }) {
  const dot = STATUS_DOT[appt.status?.name] ?? "#9ca3af";
  const service = appt.appointmentServices?.[0]?.service?.name ?? "—";
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/40 transition-colors text-left group"
    >
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: dot }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {appt.client?.fullName}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {service} · {appt.startTime}
        </p>
      </div>
      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
    </button>
  );
}

// ── Section header ────────────────────────────────────────────────────────────

function SectionHeader({
  title,
  sub,
  action,
  onAction,
}: {
  title: string;
  sub?: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
      {action && onAction && (
        <button
          onClick={onAction}
          className="flex items-center gap-1 text-xs font-medium hover:underline transition-colors"
          style={{ color: GOLD }}
        >
          {action} <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];

  // ── Data fetching ──────────────────────────────────────────────────────────

  const { data: overview, isLoading: loadOv } = useQuery({
    queryKey: ["reports", "overview", "today"],
    queryFn: () =>
      reportsApi
        .getOverview({ preset: "today" })
        .then((r) => (r as any).data?.data ?? (r as any).data),
  });

  const { data: trendData } = useQuery({
    queryKey: ["reports", "trend", "30d"],
    queryFn: () =>
      reportsApi
        .getTrend({ preset: "last_30_days", groupBy: "day" })
        .then((r) => (r as any).data?.data ?? (r as any).data),
    select: (d: any) => (d?.data ?? []).slice(-14), // last 14 days
  });

  const { data: todayRaw, isLoading: loadAppts } = useQuery({
    queryKey: ["appointments", "today-dash"],
    queryFn: () =>
      api.get("/appointments", { params: { date: today, limit: 50 } }),
    select: (res) => extractArray(res),
    refetchInterval: 60_000,
  });
  const todayAppts: any[] = todayRaw ?? [];

  const { data: serviceData } = useQuery({
    queryKey: ["reports", "services", "30d"],
    queryFn: () =>
      reportsApi
        .getServices({ preset: "last_30_days", limit: 5 })
        .then((r) => (r as any).data?.data ?? (r as any).data),
    select: (d: any) => (d?.data ?? []).slice(0, 5),
  });

  const { data: peakData } = useQuery({
    queryKey: ["reports", "peak", "30d"],
    queryFn: () =>
      reportsApi
        .getPeakHours({ preset: "last_30_days" })
        .then((r) => (r as any).data?.data ?? (r as any).data),
    select: (d: any) => d?.byDayOfWeek ?? [],
  });

  // ── Derived ────────────────────────────────────────────────────────────────

  const pending = todayAppts.filter((a) =>
    ["PENDING", "CONFIRMED"].includes(a.status?.name),
  );
  const active = todayAppts.filter((a) =>
    ["ARRIVED", "CHECKED_IN", "IN_PROGRESS"].includes(a.status?.name),
  );
  const completed = todayAppts.filter((a) => a.status?.isCompleted);
  const noShows = todayAppts.filter((a) => a.status?.isNoShow);

  const maxService = Math.max(
    ...((serviceData ?? []) as any[]).map((s: any) => s.revenue),
    1,
  );
  const maxPeak = Math.max(
    ...((peakData ?? []) as any[]).map((d: any) => d.count),
    1,
  );

  // Payment method breakdown
  const methodData = ((overview?.paymentMethods ?? []) as any[]).map(
    (m: any) => ({
      name: m.method.replace("_", " "),
      value: m.amountKes,
      fill:
        m.method === "MPESA"
          ? "#22c55e"
          : m.method === "CASH"
            ? GOLD
            : m.method === "CARD"
              ? BLUE
              : PURPLE,
    }),
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 pb-8">
      {/* Greeting */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">
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
        <button
          onClick={() => router.push("/appointments/new")}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium shadow-sm"
          style={{ backgroundColor: GOLD, color: NAVY }}
        >
          <Calendar className="w-4 h-4" /> Book appointment
        </button>
      </div>

      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loadOv ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Sk
              key={i}
              className="h-36"
            />
          ))
        ) : overview ? (
          <>
            <KpiCard
              title="Today's appointments"
              icon={Calendar}
              accent={GOLD}
              value={overview.appointments?.total ?? 0}
              sub={`${overview.appointments?.completionRate ?? 0}% completed`}
            />
            <KpiCard
              title="Revenue today"
              icon={TrendingUp}
              accent={GREEN}
              value={formatCurrency(overview.revenue?.kes ?? 0, "KES")}
              sub={
                overview.revenue?.usd > 0
                  ? `+ USD ${overview.revenue.usd.toFixed(2)}`
                  : "KES collected today"
              }
            />
            <KpiCard
              title="No-shows"
              icon={AlertCircle}
              accent={RED}
              value={overview.appointments?.noShows ?? 0}
              sub={`${overview.appointments?.noShowRate ?? 0}% rate`}
            />
            <KpiCard
              title="New clients"
              icon={Users}
              accent={BLUE}
              value={overview.clients?.new ?? 0}
              sub={`${overview.clients?.returning ?? 0} returning`}
            />
          </>
        ) : null}
      </div>

      {/* ── Today's flow + Revenue trend ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Today flow — left 2 cols */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-5">
          <SectionHeader
            title="Today's flow"
            sub={`${todayAppts.length} appointments`}
            action="Full schedule"
            onAction={() => router.push("/appointments")}
          />

          {/* Status summary pills */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[
              { label: "Upcoming", count: pending.length, color: AMBER },
              { label: "Active", count: active.length, color: PURPLE },
              { label: "Done", count: completed.length, color: GREEN },
              { label: "No-show", count: noShows.length, color: RED },
            ].map(({ label, count, color }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-1 p-2 rounded-xl bg-muted/30"
              >
                <span className="text-xl font-bold text-foreground tabular-nums">
                  {count}
                </span>
                <span className="text-[10px] text-muted-foreground font-medium">
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Stacked progress bar */}
          {todayAppts.length > 0 && (
            <div className="h-2 rounded-full overflow-hidden flex mb-4">
              {[
                { items: completed, color: GREEN },
                { items: active, color: PURPLE },
                { items: pending, color: AMBER },
                { items: noShows, color: RED },
              ].map(
                ({ items, color }) =>
                  items.length > 0 && (
                    <div
                      key={color}
                      className="h-full transition-all"
                      style={{
                        width: `${pct(items.length, todayAppts.length)}%`,
                        backgroundColor: color,
                      }}
                    />
                  ),
              )}
            </div>
          )}

          {/* Appointment list */}
          {loadAppts ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Sk
                  key={i}
                  className="h-12"
                />
              ))}
            </div>
          ) : todayAppts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <Calendar className="w-8 h-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                No appointments today
              </p>
            </div>
          ) : (
            <div className="space-y-1 max-h-64 overflow-y-auto pr-0.5">
              {todayAppts.slice(0, 8).map((a: any) => (
                <ApptRow
                  key={a.id}
                  appt={a}
                  onClick={() => router.push(`/appointments/${a.id}`)}
                />
              ))}
              {todayAppts.length > 8 && (
                <button
                  onClick={() => router.push("/appointments")}
                  className="w-full text-center text-xs text-muted-foreground hover:text-foreground py-2 transition-colors"
                >
                  +{todayAppts.length - 8} more
                </button>
              )}
            </div>
          )}
        </div>

        {/* Revenue trend — right 3 cols */}
        <div className="lg:col-span-3 bg-card rounded-2xl border border-border p-5">
          <SectionHeader
            title="Revenue — last 14 days"
            action="Full reports"
            onAction={() => router.push("/reports")}
          />

          {!trendData ? (
            <Sk className="h-52 mt-2" />
          ) : (
            <ResponsiveContainer
              width="100%"
              height={220}
            >
              <AreaChart
                data={trendData}
                margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="revGrad"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={GOLD}
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor={GOLD}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) =>
                    v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v
                  }
                />
                <Tooltip
                  content={
                    <ChartTooltip
                      formatter={(v: number) => formatCurrency(v, "KES")}
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="revenueKes"
                  name="Revenue (KES)"
                  stroke={GOLD}
                  strokeWidth={2}
                  fill="url(#revGrad)"
                  dot={false}
                  activeDot={{ r: 4, fill: GOLD }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}

          {/* Secondary: bookings vs completed */}
          <div className="mt-1">
            <p className="text-xs font-semibold text-muted-foreground mb-2">
              Bookings vs completed
            </p>
            {!trendData ? (
              <Sk className="h-24" />
            ) : (
              <ResponsiveContainer
                width="100%"
                height={90}
              >
                <BarChart
                  data={trendData}
                  barGap={2}
                  margin={{ top: 0, right: 4, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis hide />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar
                    dataKey="bookings"
                    name="Bookings"
                    fill={`${BLUE}60`}
                    radius={[3, 3, 0, 0]}
                  />
                  <Bar
                    dataKey="completed"
                    name="Completed"
                    fill={GREEN}
                    radius={[3, 3, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ── Services + Peak hours + Payment methods ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Top services by revenue */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <SectionHeader
            title="Top services"
            sub="Last 30 days"
            action="See all"
            onAction={() => router.push("/reports")}
          />
          {!serviceData ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Sk
                  key={i}
                  className="h-10"
                />
              ))}
            </div>
          ) : (serviceData as any[]).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No data yet
            </p>
          ) : (
            <div className="space-y-3">
              {(serviceData as any[]).map((s: any, i: number) => (
                <div key={s.serviceId ?? i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-foreground truncate max-w-[55%]">
                      {s.serviceName}
                    </span>
                    <span className="text-xs font-semibold text-foreground">
                      {formatCurrency(s.revenue, "KES")}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct(s.revenue, maxService)}%`,
                        backgroundColor: GOLD,
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {s.completed} sessions · {s.completionRate}% completion
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Peak days */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <SectionHeader
            title="Busiest days"
            sub="Last 30 days"
          />
          {!peakData ? (
            <Sk className="h-40" />
          ) : (
            <div className="space-y-2">
              {(peakData as any[]).map((d: any, i: number) => {
                const p = pct(d.count, maxPeak);
                return (
                  <div
                    key={i}
                    className="flex items-center gap-3"
                  >
                    <span className="text-xs text-muted-foreground w-8 shrink-0">
                      {d.day.slice(0, 3)}
                    </span>
                    <div className="flex-1 h-6 bg-muted rounded-lg overflow-hidden flex items-center">
                      <div
                        className="h-full rounded-lg transition-all flex items-center justify-end pr-2"
                        style={{
                          width: `${Math.max(p, 8)}%`,
                          backgroundColor:
                            p > 70 ? GOLD : p > 40 ? `${GOLD}90` : `${GOLD}50`,
                        }}
                      >
                        {p > 25 && (
                          <span
                            className="text-[10px] font-bold"
                            style={{ color: NAVY }}
                          >
                            {d.count}
                          </span>
                        )}
                      </div>
                    </div>
                    {p <= 25 && (
                      <span className="text-[10px] text-muted-foreground w-6">
                        {d.count}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Payment method split */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <SectionHeader
            title="Payment methods"
            sub="Today's collections"
          />
          {methodData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <CreditCard className="w-8 h-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No payments today</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <ResponsiveContainer
                width="100%"
                height={130}
              >
                <PieChart>
                  <Pie
                    data={methodData}
                    cx="50%"
                    cy="50%"
                    innerRadius={38}
                    outerRadius={58}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {methodData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={entry.fill}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={
                      <ChartTooltip
                        formatter={(v: number) => formatCurrency(v, "KES")}
                      />
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="w-full space-y-1.5">
                {methodData.map((m, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: m.fill }}
                      />
                      <span className="text-xs text-muted-foreground capitalize">
                        {m.name}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-foreground">
                      {formatCurrency(m.value, "KES")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── No-shows alert ── */}
      {noShows.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/40 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-800 dark:text-red-300">
                {noShows.length} no-show{noShows.length > 1 ? "s" : ""} today
              </p>
              <p className="text-xs text-red-600 dark:text-red-400">
                {noShows.map((a: any) => a.client?.fullName).join(", ")}
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push("/appointments")}
            className="text-xs font-medium text-red-700 dark:text-red-400 hover:underline whitespace-nowrap"
          >
            View all →
          </button>
        </div>
      )}
    </div>
  );
}
