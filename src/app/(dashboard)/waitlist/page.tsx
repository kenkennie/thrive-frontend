"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useWaitlist,
  useWaitlistStats,
  useNotifyEntry,
  useCancelEntry,
} from "@/features/waitlist/hooks/useWaitlist";
import { AddToWaitlistForm } from "@/features/waitlist/components/AddToWaitlistForm";
import { Pagination } from "@/components/ui/Pagination";
import { formatDate, cn } from "@/lib/utils";
import {
  Plus,
  X,
  Clock,
  Bell,
  CheckCircle2,
  XCircle,
  CalendarDays,
  UserCheck,
  Phone,
  Mail,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  Users,
} from "lucide-react";

const LIMIT = 20;

const STATUS_STYLES: Record<string, string> = {
  WAITING:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  NOTIFIED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  BOOKED:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  EXPIRED: "bg-muted text-muted-foreground",
  CANCELLED: "bg-muted text-muted-foreground",
};

const STATUS_ICON: Record<string, React.ElementType> = {
  WAITING: Clock,
  NOTIFIED: Bell,
  BOOKED: CheckCircle2,
  EXPIRED: XCircle,
  CANCELLED: XCircle,
};

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "WAITING", label: "Waiting" },
  { value: "NOTIFIED", label: "Notified" },
  { value: "BOOKED", label: "Booked" },
  { value: "EXPIRED", label: "Expired" },
  { value: "CANCELLED", label: "Cancelled" },
];

export default function WaitlistPage() {
  const router = useRouter();
  const [status, setStatus] = useState("WAITING");
  const [page, setPage] = useState(1);
  const [showAdd, setShowAdd] = useState(false);
  const [notifyId, setNotifyId] = useState<string | null>(null);
  const [customMsg, setCustomMsg] = useState("");

  const { data, isLoading } = useWaitlist({
    status: status || undefined,
    page,
    limit: LIMIT,
  });
  const { data: stats } = useWaitlistStats();

  const notifyEntry = useNotifyEntry();
  const cancelEntry = useCancelEntry();

  const entries = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Waitlist</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {stats?.byStatus?.find((s: any) => s.status === "WAITING")?.count ??
              0}{" "}
            waiting ·{" "}
            {stats?.byStatus?.find((s: any) => s.status === "NOTIFIED")
              ?.count ?? 0}{" "}
            notified
          </p>
        </div>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium shadow-sm transition-all hover:shadow-md"
          style={{
            backgroundColor: "var(--brand-gold)",
            color: "var(--brand-navy)",
          }}
        >
          {showAdd ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showAdd ? "Cancel" : "Add to waitlist"}
        </button>
      </div>

      {/* Stats chips */}
      {stats?.topWaitedServices?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <p className="text-xs font-medium text-muted-foreground self-center">
            Most waited:
          </p>
          {stats.topWaitedServices.map((s: any) => (
            <span
              key={s.serviceId}
              className="text-xs px-2.5 py-1 rounded-full bg-muted text-foreground font-medium"
            >
              {s.serviceName}{" "}
              <span className="text-muted-foreground ml-1">{s.waiting}</span>
            </span>
          ))}
        </div>
      )}

      {/* Add form */}
      {showAdd && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-muted/20">
            <h2 className="text-sm font-semibold text-foreground">
              Add Client to Waitlist
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Client will be notified when a slot opens
            </p>
          </div>
          <div className="p-5">
            <AddToWaitlistForm onDone={() => setShowAdd(false)} />
          </div>
        </div>
      )}

      {/* Notify modal */}
      {notifyId && (
        <div className="bg-card rounded-2xl border border-blue-200 dark:border-blue-800/40 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-blue-50 dark:bg-blue-900/10">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Notify client of available slot
            </h3>
            <button
              onClick={() => {
                setNotifyId(null);
                setCustomMsg("");
              }}
              className="p-1 rounded-md hover:bg-muted text-muted-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-5 space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Custom message (optional)
              </label>
              <textarea
                value={customMsg}
                onChange={(e) => setCustomMsg(e.target.value)}
                rows={3}
                placeholder="Leave blank to use default template…"
                className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
              <p className="text-xs text-muted-foreground">
                Client receives both SMS and email. Offer expires after the
                configured waitlist expiry window.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  notifyEntry.mutate({
                    entryId: notifyId,
                    message: customMsg || undefined,
                  });
                  setNotifyId(null);
                  setCustomMsg("");
                }}
                disabled={notifyEntry.isPending}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-60"
                style={{
                  backgroundColor: "var(--brand-gold)",
                  color: "var(--brand-navy)",
                }}
              >
                {notifyEntry.isPending && (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                )}
                Send notification
              </button>
              <button
                onClick={() => {
                  setNotifyId(null);
                  setCustomMsg("");
                }}
                className="px-5 py-2 rounded-lg text-sm border border-border hover:bg-muted transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status tabs */}
      <div className="flex items-center bg-muted rounded-xl p-1 gap-0.5 w-fit overflow-x-auto">
        {STATUS_TABS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => {
              setStatus(value);
              setPage(1);
            }}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
              status === value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
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
                <div className="w-10 h-10 rounded-xl bg-muted shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 bg-muted rounded" />
                  <div className="h-3 w-32 bg-muted/60 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center">
              <Users className="w-7 h-7 text-muted-foreground/40" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">No entries</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {status
                  ? `No ${status.toLowerCase()} waitlist entries`
                  : "Waitlist is empty"}
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {entries.map((entry: any) => {
              const Icon = STATUS_ICON[entry.status] ?? Clock;
              const isExpiringSoon =
                entry.status === "NOTIFIED" &&
                entry.expiresAt &&
                new Date(entry.expiresAt) <
                  new Date(Date.now() + 60 * 60 * 1000); // < 1hr

              return (
                <div
                  key={entry.id}
                  className="px-4 py-4 hover:bg-muted/10 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Status icon */}
                    <div
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                        STATUS_STYLES[entry.status] ??
                          "bg-muted text-muted-foreground",
                      )}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          {/* Client */}
                          <button
                            onClick={() =>
                              router.push(`/clients/${entry.client.id}`)
                            }
                            className="text-sm font-semibold text-foreground hover:underline text-left"
                          >
                            {entry.client.fullName}
                          </button>
                          {/* Service */}
                          <p className="text-sm text-muted-foreground">
                            {entry.service.name}
                          </p>
                          {/* Contact */}
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                            <a
                              href={`tel:${entry.client.phoneNumber}`}
                              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <Phone className="w-3 h-3" />
                              {entry.client.phoneNumber}
                            </a>
                            {entry.client.email && (
                              <a
                                href={`mailto:${entry.client.email}`}
                                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                              >
                                <Mail className="w-3 h-3" />
                                {entry.client.email}
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-wrap gap-2 shrink-0">
                          {entry.status === "WAITING" && (
                            <button
                              onClick={() => setNotifyId(entry.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                            >
                              <Bell className="w-3.5 h-3.5" /> Notify
                            </button>
                          )}
                          {entry.status === "NOTIFIED" && (
                            <button
                              onClick={() =>
                                router.push(
                                  `/appointments/new?clientId=${entry.client.id}&serviceId=${entry.service.id}`,
                                )
                              }
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                              style={{
                                backgroundColor: "var(--brand-gold)",
                                color: "var(--brand-navy)",
                              }}
                            >
                              <CalendarDays className="w-3.5 h-3.5" /> Book now
                            </button>
                          )}
                          {entry.status === "BOOKED" &&
                            entry.bookedAppointmentId && (
                              <button
                                onClick={() =>
                                  router.push(
                                    `/appointments/${entry.bookedAppointmentId}`,
                                  )
                                }
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-border hover:bg-muted transition-colors"
                              >
                                <ChevronRight className="w-3.5 h-3.5" /> View
                                appt
                              </button>
                            )}
                          {["WAITING", "NOTIFIED"].includes(entry.status) && (
                            <button
                              onClick={() => {
                                if (confirm("Cancel this waitlist entry?"))
                                  cancelEntry.mutate(entry.id);
                              }}
                              className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                              title="Cancel entry"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Dates + meta */}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <CalendarDays className="w-3 h-3" />
                          Preferred: {formatDate(entry.preferredDate)}
                          {entry.flexibleDate && (
                            <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-muted">
                              flexible
                            </span>
                          )}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Joined {formatDate(entry.joinedAt)}
                        </span>
                        {entry.notifiedAt && (
                          <span className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                            <Bell className="w-3 h-3" />
                            Notified {formatDate(entry.notifiedAt)}
                          </span>
                        )}
                        {entry.expiresAt && entry.status === "NOTIFIED" && (
                          <span
                            className={cn(
                              "flex items-center gap-1 text-xs",
                              isExpiringSoon
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-muted-foreground",
                            )}
                          >
                            {isExpiringSoon && (
                              <AlertCircle className="w-3 h-3" />
                            )}
                            Expires {formatDate(entry.expiresAt)}
                          </span>
                        )}
                      </div>

                      {entry.note && (
                        <p className="text-xs text-muted-foreground mt-2 bg-muted/30 px-2.5 py-1.5 rounded-lg italic">
                          "{entry.note}"
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {meta && meta.totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={meta.totalPages}
          total={meta.total}
          limit={LIMIT}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
