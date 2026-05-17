"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useOverviewReport,
  useTrendReport,
  useServiceReport,
  useDoctorReport,
  useClientReport,
  useNoShowReport,
  usePeakHoursReport,
  useAgingReport,
} from "@/features/reports/hooks/useReports";
import { DateRangeFilter } from "@/features/reports/components/DateRangeFilter";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import {
  TrendingUp,
  Users,
  Calendar,
  CreditCard,
  Star,
  AlertCircle,
  Clock,
  FileText,
  Stethoscope,
  BarChart2,
  ChevronRight,
  Loader2,
} from "lucide-react";

// ── Tiny helpers ──────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  accent?: string;
}) {
  return (
    <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <div className="w-8 h-8 rounded-xl bg-muted/50 flex items-center justify-center">
          <Icon className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>
      <p
        className="text-2xl font-bold text-foreground"
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function SectionCard({
  title,
  children,
  loading,
}: {
  title: string;
  children: React.ReactNode;
  loading?: boolean;
}) {
  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border bg-muted/20 flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {loading && (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
        )}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function MiniBar({
  label,
  value,
  max,
  formatter = (v: number) => String(v),
  colour,
}: {
  label: string;
  value: number;
  max: number;
  formatter?: (v: number) => string;
  colour?: string;
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-28 truncate shrink-0">
        {label}
      </span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            backgroundColor: colour ?? "var(--brand-gold)",
          }}
        />
      </div>
      <span className="text-xs font-semibold text-foreground w-20 text-right shrink-0">
        {formatter(value)}
      </span>
    </div>
  );
}

function StarRow({ label, avg }: { label: string; avg: number | null }) {
  if (avg == null) return null;
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/60 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star
              key={i}
              className={cn(
                "w-3.5 h-3.5",
                i <= Math.round(avg)
                  ? "text-amber-400 fill-amber-400"
                  : "text-muted-foreground/30",
              )}
            />
          ))}
        </div>
        <span className="text-sm font-semibold text-foreground">
          {avg.toFixed(1)}
        </span>
      </div>
    </div>
  );
}

// ── Tab types ─────────────────────────────────────────────────────────────────

type Tab = "overview" | "services" | "doctors" | "clients" | "aging" | "peak";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: BarChart2 },
  { id: "services", label: "Services", icon: Star },
  { id: "doctors", label: "Doctors", icon: Stethoscope },
  { id: "clients", label: "Top Clients", icon: Users },
  { id: "aging", label: "Aging", icon: FileText },
  { id: "peak", label: "Peak hours", icon: Clock },
];

// ─────────────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [preset, setPreset] = useState("this_month");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const params =
    preset === "custom"
      ? { dateFrom: dateFrom || undefined, dateTo: dateTo || undefined }
      : { preset };

  const { data: overview, isLoading: loadOverview } = useOverviewReport(params);
  const { data: trend, isLoading: loadTrend } = useTrendReport({
    ...params,
    groupBy: "day",
  });
  const { data: services, isLoading: loadServices } = useServiceReport({
    ...params,
    limit: 10,
  });
  const { data: doctors, isLoading: loadDoctors } = useDoctorReport(params);
  const { data: clients, isLoading: loadClients } = useClientReport({
    ...params,
    limit: 10,
  });
  const { data: noShows, isLoading: loadNoShows } = useNoShowReport(params);
  const { data: peak, isLoading: loadPeak } = usePeakHoursReport(params);
  const { data: aging, isLoading: loadAging } = useAgingReport({
    ...params,
    detail: "summary",
  });

  const handleRangeChange = (u: {
    preset?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    if (u.preset) setPreset(u.preset);
    if (u.dateFrom !== undefined) setDateFrom(u.dateFrom);
    if (u.dateTo !== undefined) setDateTo(u.dateTo);
  };

  const maxServiceRevenue = Math.max(
    ...(services?.data?.map((s: any) => s.revenue) ?? [1]),
  );
  const maxDoctorRevenue = Math.max(
    ...(doctors?.data?.map((d: any) => d.revenueKes) ?? [1]),
  );
  const maxClientSpend = Math.max(
    ...(clients?.data?.map((c: any) => c.spendKes) ?? [1]),
  );
  const maxPeakHour = Math.max(
    ...(peak?.byHour?.map((h: any) => h.count) ?? [1]),
  );
  const maxPeakDay = Math.max(
    ...(peak?.byDayOfWeek?.map((d: any) => d.count) ?? [1]),
  );
  const maxNoShow = Math.max(
    ...(noShows?.data?.map((n: any) => n.noShowsInPeriod) ?? [1]),
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Reports</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {overview?.period
            ? `${overview.period.from} — ${overview.period.to}`
            : ""}
        </p>
      </div>

      {/* Date range */}
      <DateRangeFilter
        preset={preset}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onChange={handleRangeChange}
      />

      {/* Tab nav */}
      <div className="flex items-center bg-muted rounded-2xl p-1.5 gap-0.5 overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all",
              tab === id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === "overview" && (
        <div className="space-y-5">
          {/* KPI grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <KpiCard
              icon={Calendar}
              label="Total bookings"
              value={overview?.appointments?.total ?? "—"}
              sub={`${overview?.appointments?.completionRate ?? 0}% completion rate`}
            />
            <KpiCard
              icon={TrendingUp}
              label="Net revenue (KES)"
              value={
                overview?.revenue?.net != null
                  ? formatCurrency(overview.revenue.net, "KES")
                  : "—"
              }
              accent="var(--brand-gold)"
              sub={`${formatCurrency(overview?.revenue?.refunds ?? 0, "KES")} refunded`}
            />
            <KpiCard
              icon={Users}
              label="New clients"
              value={overview?.clients?.new ?? "—"}
              sub={`${overview?.clients?.returning ?? 0} returning`}
            />
            <KpiCard
              icon={AlertCircle}
              label="No-shows"
              value={overview?.appointments?.noShows ?? "—"}
              sub={`${overview?.appointments?.noShowRate ?? 0}% no-show rate`}
            />
          </div>

          {/* Revenue + payment methods */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SectionCard title="Revenue breakdown" loading={loadOverview}>
              <div className="space-y-3">
                {[
                  { label: "Gross (KES)", value: overview?.revenue?.kes },
                  { label: "Gross (USD)", value: overview?.revenue?.usd },
                  {
                    label: "Refunds",
                    value: overview?.revenue?.refunds,
                    neg: true,
                  },
                  { label: "Net (KES equiv)", value: overview?.revenue?.net },
                ].map(({ label, value, neg }) =>
                  value != null ? (
                    <div key={label} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{label}</span>
                      <span
                        className={cn(
                          "font-semibold",
                          neg ? "text-red-500" : "text-foreground",
                        )}
                      >
                        {neg && "−"}
                        {formatCurrency(
                          value ?? 0,
                          label.includes("USD") ? "USD" : "KES",
                        )}
                      </span>
                    </div>
                  ) : null,
                )}
              </div>
            </SectionCard>

            <SectionCard title="Payment methods" loading={loadOverview}>
              <div className="space-y-2.5">
                {(overview?.paymentMethods ?? []).map((m: any) => (
                  <MiniBar
                    key={m.method}
                    label={m.method.replace("_", " ")}
                    value={m.amountKes}
                    max={Math.max(
                      ...(overview?.paymentMethods?.map(
                        (x: any) => x.amountKes,
                      ) ?? [1]),
                    )}
                    formatter={(v) => formatCurrency(v, "KES")}
                  />
                ))}
                {!overview?.paymentMethods?.length && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No payment data
                  </p>
                )}
              </div>
            </SectionCard>
          </div>

          {/* Trend chart — simple bar */}
          <SectionCard title="Daily trend" loading={loadTrend}>
            {(trend?.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No trend data
              </p>
            ) : (
              <div className="space-y-4">
                <div className="flex items-end gap-1 h-32">
                  {(trend?.data ?? []).slice(-30).map((d: any, i: number) => {
                    const maxRev = Math.max(
                      ...trend.data.map((x: any) => x.revenueKes),
                      1,
                    );
                    const h = Math.max(4, (d.revenueKes / maxRev) * 100);
                    return (
                      <div
                        key={i}
                        className="flex-1 flex flex-col items-center gap-1 group relative"
                      >
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-max bg-foreground text-background text-[10px] px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none z-10 transition-opacity">
                          {d.label}: {formatCurrency(d.revenueKes, "KES")} ·{" "}
                          {d.completed} appts
                        </div>
                        <div
                          className="w-full rounded-t-sm transition-all"
                          style={{
                            height: `${h}%`,
                            backgroundColor: "var(--brand-gold)",
                            opacity: 0.8,
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>{trend?.data?.[0]?.label}</span>
                  <span>{trend?.data?.[trend.data.length - 1]?.label}</span>
                </div>
              </div>
            )}
          </SectionCard>

          {/* Booking sources */}
          {(overview?.bookingSources ?? []).length > 0 && (
            <SectionCard title="Booking sources" loading={loadOverview}>
              <div className="space-y-2.5">
                {(overview?.bookingSources ?? [])
                  .sort((a: any, b: any) => b.count - a.count)
                  .map((s: any) => (
                    <MiniBar
                      key={s.source?.name ?? "unknown"}
                      label={s.source?.label ?? "Unknown"}
                      value={s.count}
                      max={Math.max(
                        ...(overview?.bookingSources?.map(
                          (x: any) => x.count,
                        ) ?? [1]),
                      )}
                      formatter={(v) => `${v} bookings`}
                    />
                  ))}
              </div>
            </SectionCard>
          )}

          {/* No-shows */}
          {(noShows?.data ?? []).length > 0 && (
            <SectionCard title="Top no-show clients" loading={loadNoShows}>
              <div className="divide-y divide-border/60">
                {(noShows?.data ?? []).slice(0, 5).map((n: any) => (
                  <div
                    key={n.clientId}
                    className="flex items-center gap-3 py-2.5"
                  >
                    <button
                      onClick={() => router.push(`/clients/${n.clientId}`)}
                      className="flex-1 text-left text-sm font-medium text-foreground hover:underline"
                    >
                      {n.fullName}
                    </button>
                    <span className="text-xs text-muted-foreground">
                      {n.phoneNumber}
                    </span>
                    <span className="text-xs font-bold text-red-500">
                      {n.noShowsInPeriod}× this period
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({n.lifetimeNoShows} lifetime)
                    </span>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
        </div>
      )}

      {/* ── SERVICES ── */}
      {tab === "services" && (
        <SectionCard title="Service performance" loading={loadServices}>
          {(services?.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No data
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {[
                      "Service",
                      "Category",
                      "Completed",
                      "Cancelled",
                      "Completion %",
                      "Revenue",
                      "Avg rating",
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left py-2.5 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {(services?.data ?? []).map((s: any) => (
                    <tr
                      key={s.serviceId}
                      className="hover:bg-muted/20 transition-colors"
                    >
                      <td className="py-3 px-3 font-medium text-foreground">
                        {s.serviceName}
                      </td>
                      <td className="py-3 px-3 text-muted-foreground">
                        {s.category}
                      </td>
                      <td className="py-3 px-3 text-green-600 dark:text-green-400 font-semibold">
                        {s.completed}
                      </td>
                      <td className="py-3 px-3 text-red-500">{s.cancelled}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-green-500"
                              style={{ width: `${s.completionRate}%` }}
                            />
                          </div>
                          <span className="text-muted-foreground text-xs">
                            {s.completionRate}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-semibold text-foreground">
                        {formatCurrency(s.revenue, "KES")}
                      </td>
                      <td className="py-3 px-3">
                        {s.avgRating ? (
                          <div className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                            <span className="font-semibold">{s.avgRating}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      )}

      {/* ── DOCTORS ── */}
      {tab === "doctors" && (
        <div className="space-y-4">
          {(doctors?.data ?? []).map((d: any) => (
            <div
              key={d.doctorId}
              className="bg-card rounded-2xl border border-border p-5"
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                  style={{
                    backgroundColor: "var(--brand-gold)",
                    color: "var(--brand-navy)",
                  }}
                >
                  {d.fullName
                    .split(" ")
                    .map((n: string) => n[0])
                    .slice(0, 2)
                    .join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {d.fullName}
                  </p>
                  {d.specialisation && (
                    <p className="text-xs text-muted-foreground">
                      {d.specialisation}
                    </p>
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                    {[
                      {
                        label: "Completed",
                        value: d.completed,
                        cls: "text-green-600 dark:text-green-400",
                      },
                      {
                        label: "No-shows",
                        value: `${d.noShows} (${d.noShowRate}%)`,
                        cls:
                          d.noShowRate > 10
                            ? "text-red-500"
                            : "text-muted-foreground",
                      },
                      {
                        label: "Revenue",
                        value: formatCurrency(d.revenueKes, "KES"),
                        cls: "text-foreground",
                      },
                      {
                        label: "Avg rating",
                        value: d.avgRating ? `${d.avgRating}/5` : "—",
                        cls: "text-foreground",
                      },
                    ].map(({ label, value, cls }) => (
                      <div key={label} className="bg-muted/30 rounded-xl p-2.5">
                        <p className="text-[10px] text-muted-foreground">
                          {label}
                        </p>
                        <p className={cn("text-sm font-bold mt-0.5", cls)}>
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {loadDoctors && (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {!loadDoctors && (doctors?.data ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-10">
              No data
            </p>
          )}
        </div>
      )}

      {/* ── TOP CLIENTS ── */}
      {tab === "clients" && (
        <SectionCard title="Top clients by visits" loading={loadClients}>
          {(clients?.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No data
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {[
                      "#",
                      "Client",
                      "Visits",
                      "Spend (KES)",
                      "No-shows",
                      "Rating",
                      "Since",
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left py-2.5 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {(clients?.data ?? []).map((c: any, i: number) => (
                    <tr
                      key={c.clientId}
                      className="hover:bg-muted/20 transition-colors"
                    >
                      <td className="py-3 px-3 text-muted-foreground font-mono text-xs">
                        {i + 1}
                      </td>
                      <td className="py-3 px-3">
                        <button
                          onClick={() => router.push(`/clients/${c.clientId}`)}
                          className="text-sm font-medium text-foreground hover:underline text-left"
                        >
                          {c.fullName}
                        </button>
                        <p className="text-xs text-muted-foreground">
                          {c.phoneNumber}
                        </p>
                      </td>
                      <td className="py-3 px-3 font-semibold">{c.visits}</td>
                      <td
                        className="py-3 px-3 font-semibold"
                        style={{ color: "var(--brand-gold)" }}
                      >
                        {formatCurrency(c.spendKes, "KES")}
                      </td>
                      <td className="py-3 px-3">
                        {c.noShows > 0 ? (
                          <span className="text-red-500 font-semibold">
                            {c.noShows}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {c.avgRating ? (
                          <div className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                            <span>{Number(c.avgRating).toFixed(1)}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-xs text-muted-foreground">
                        {c.clientSince ? formatDate(c.clientSince) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      )}

      {/* ── AGING ── */}
      {tab === "aging" && (
        <div className="space-y-4">
          <SectionCard title="Outstanding invoice aging" loading={loadAging}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  key: "current",
                  label: "Current (not due)",
                  cls: "text-green-600 dark:text-green-400",
                },
                {
                  key: "days1_30",
                  label: "1–30 days overdue",
                  cls: "text-amber-600 dark:text-amber-400",
                },
                {
                  key: "days31_60",
                  label: "31–60 days overdue",
                  cls: "text-orange-600 dark:text-orange-400",
                },
                {
                  key: "days61plus",
                  label: "61+ days overdue",
                  cls: "text-red-600 dark:text-red-400",
                },
              ].map(({ key, label, cls }) => {
                const bucket = aging?.summary?.[key];
                return (
                  <div
                    key={key}
                    className="bg-muted/30 rounded-xl p-4 space-y-1"
                  >
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className={cn("text-xl font-bold", cls)}>
                      {bucket?.count ?? 0} invoices
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      {formatCurrency(bucket?.totalDue ?? 0, "KES")}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">
                Grand total outstanding
              </p>
              <p
                className="text-xl font-bold"
                style={{ color: "var(--brand-gold)" }}
              >
                {formatCurrency(
                  aging?.summary?.grandTotal?.totalDue ?? 0,
                  "KES",
                )}
              </p>
            </div>
          </SectionCard>
        </div>
      )}

      {/* ── PEAK HOURS ── */}
      {tab === "peak" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SectionCard title="Bookings by hour" loading={loadPeak}>
            <div className="flex items-end gap-1 h-40 pt-2">
              {(peak?.byHour ?? []).map((h: any) => {
                const pct =
                  maxPeakHour > 0
                    ? Math.max(4, (h.count / maxPeakHour) * 100)
                    : 4;
                return (
                  <div
                    key={h.hour}
                    className="flex-1 flex flex-col items-center gap-1 group relative"
                  >
                    {h.count > 0 && (
                      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-max bg-foreground text-background text-[10px] px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none z-10 whitespace-nowrap">
                        {h.hour}: {h.count}
                      </div>
                    )}
                    <div
                      className="w-full rounded-t-sm"
                      style={{
                        height: `${pct}%`,
                        backgroundColor:
                          h.count > 0
                            ? "var(--brand-gold)"
                            : "hsl(var(--muted))",
                        opacity: h.count > 0 ? 0.85 : 0.3,
                      }}
                    />
                    {parseInt(h.hour) % 4 === 0 && (
                      <span className="text-[9px] text-muted-foreground">
                        {h.hour.split(":")[0]}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard title="Bookings by day" loading={loadPeak}>
            <div className="space-y-2.5">
              {(peak?.byDayOfWeek ?? []).map((d: any) => (
                <MiniBar
                  key={d.day}
                  label={d.day}
                  value={d.count}
                  max={maxPeakDay}
                  formatter={(v) => `${v} bookings`}
                />
              ))}
            </div>
          </SectionCard>
        </div>
      )}
    </div>
  );
}
