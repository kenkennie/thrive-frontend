"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useNotificationList,
  useRetryNotification,
  useCancelNotification,
} from "@/features/notifications/hooks/useNotifications";
import { Pagination } from "@/components/ui/Pagination";
import { formatDate, cn } from "@/lib/utils";
import {
  Mail,
  MessageSquare,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  RefreshCw,
  X,
  Search,
  ChevronRight,
  Bell,
} from "lucide-react";

const LIMIT = 25;

const STATUS_STYLES: Record<string, string> = {
  SENT: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  PENDING:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  FAILED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  CANCELLED: "bg-muted text-muted-foreground",
  SKIPPED: "bg-muted text-muted-foreground",
};

const STATUS_ICON: Record<string, React.ElementType> = {
  SENT: CheckCircle2,
  PENDING: Clock,
  FAILED: AlertCircle,
  CANCELLED: XCircle,
  SKIPPED: XCircle,
};

const CHANNEL_ICON: Record<string, React.ElementType> = {
  EMAIL: Mail,
  SMS: MessageSquare,
};

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "SENT", label: "Sent" },
  { value: "FAILED", label: "Failed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const CHANNEL_TABS = [
  { value: "", label: "All channels" },
  { value: "EMAIL", label: "Email" },
  { value: "SMS", label: "SMS" },
];

export default function NotificationsPage() {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [channel, setChannel] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useNotificationList({
    status: status || undefined,
    channel: channel || undefined,
    page,
    limit: LIMIT,
  });

  const retry = useRetryNotification();
  const cancel = useCancelNotification();

  const notifications = data?.data ?? [];
  const meta = data?.meta;

  const failed = notifications.filter((n: any) => n.status === "FAILED").length;
  const pending = notifications.filter(
    (n: any) => n.status === "PENDING",
  ).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {meta?.total ?? notifications.length} total
            {failed > 0 && (
              <span className="text-red-500 ml-2">· {failed} failed</span>
            )}
            {pending > 0 && (
              <span className="text-amber-600 dark:text-amber-400 ml-2">
                · {pending} pending
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Failed banner */}
      {failed > 0 && (
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/40 rounded-xl">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
          <p className="text-sm text-red-800 dark:text-red-300 flex-1">
            {failed} notification{failed > 1 ? "s" : ""} failed to send. Use the
            retry button to attempt re-delivery.
          </p>
          <button
            onClick={() => setStatus("FAILED")}
            className="text-xs font-medium text-red-700 dark:text-red-400 hover:underline whitespace-nowrap"
          >
            View failed
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center bg-muted rounded-xl p-1 gap-0.5">
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

        <div className="flex items-center bg-muted rounded-xl p-1 gap-0.5">
          {CHANNEL_TABS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => {
                setChannel(value);
                setPage(1);
              }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                channel === value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {value === "EMAIL" && <Mail className="w-3 h-3" />}
              {value === "SMS" && <MessageSquare className="w-3 h-3" />}
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-4 animate-pulse"
              >
                <div className="w-9 h-9 rounded-xl bg-muted shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 bg-muted rounded" />
                  <div className="h-3 w-32 bg-muted/60 rounded" />
                </div>
                <div className="w-16 h-6 bg-muted rounded-full" />
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center">
              <Bell className="w-7 h-7 text-muted-foreground/40" />
            </div>
            <p className="text-sm text-muted-foreground">
              No notifications found
            </p>
          </div>
        ) : (
          <>
            {/* Column headers */}
            <div className="hidden sm:grid grid-cols-12 gap-3 px-4 py-2.5 bg-muted/30 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wide">
              <span className="col-span-4">Recipient</span>
              <span className="col-span-2">Type</span>
              <span className="col-span-2">Channel</span>
              <span className="col-span-2">Status</span>
              <span className="col-span-2 text-right">Scheduled / Sent</span>
            </div>

            <div className="divide-y divide-border">
              {notifications.map((n: any) => {
                const StatusIcon = STATUS_ICON[n.status] ?? Clock;
                const ChannelIcon = CHANNEL_ICON[n.channel] ?? Mail;
                const isFailed = n.status === "FAILED";
                const isPending = n.status === "PENDING";

                return (
                  <div
                    key={n.id}
                    className="grid grid-cols-12 gap-3 items-center px-4 py-3.5 hover:bg-muted/10 transition-colors"
                  >
                    {/* Recipient */}
                    <div className="col-span-12 sm:col-span-4 flex items-center gap-3">
                      <div
                        className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                          STATUS_STYLES[n.status] ??
                            "bg-muted text-muted-foreground",
                        )}
                      >
                        <StatusIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {n.client?.fullName ?? "—"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {n.channel === "EMAIL"
                            ? n.client?.email
                            : n.client?.phoneNumber}
                        </p>
                        {n.appointmentId && (
                          <button
                            onClick={() =>
                              router.push(`/appointments/${n.appointmentId}`)
                            }
                            className="text-[10px] text-primary hover:underline flex items-center gap-0.5 mt-0.5"
                          >
                            View appt <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Type */}
                    <div className="hidden sm:block col-span-2">
                      <p className="text-xs font-medium text-foreground">
                        {n.type?.label ?? n.type?.name ?? "—"}
                      </p>
                    </div>

                    {/* Channel */}
                    <div className="hidden sm:flex col-span-2 items-center gap-1.5">
                      <ChannelIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="text-xs text-muted-foreground">
                        {n.channel}
                      </span>
                    </div>

                    {/* Status */}
                    <div className="hidden sm:flex col-span-2 items-center gap-2">
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full font-medium",
                          STATUS_STYLES[n.status] ??
                            "bg-muted text-muted-foreground",
                        )}
                      >
                        {n.status}
                      </span>
                      {n.retryCount > 0 && (
                        <span className="text-[10px] text-muted-foreground">
                          ×{n.retryCount}
                        </span>
                      )}
                    </div>

                    {/* Date + actions */}
                    <div className="hidden sm:flex col-span-2 items-center justify-end gap-2">
                      <div className="text-right">
                        {n.sentAt ? (
                          <p className="text-xs text-green-600 dark:text-green-400">
                            Sent {formatDate(n.sentAt)}
                          </p>
                        ) : n.scheduledAt ? (
                          <p className="text-xs text-muted-foreground">
                            Due {formatDate(n.scheduledAt)}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {(isFailed || isPending) && (
                          <button
                            onClick={() => retry.mutate(n.id)}
                            disabled={retry.isPending}
                            className="p-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 text-muted-foreground hover:text-green-600 dark:hover:text-green-400 transition-colors disabled:opacity-50"
                            title="Retry"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {isPending && (
                          <button
                            onClick={() => {
                              if (confirm("Cancel this notification?"))
                                cancel.mutate(n.id);
                            }}
                            className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Mobile: fail reason */}
                    {isFailed && n.failReason && (
                      <div className="col-span-12 sm:hidden ml-12">
                        <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/10 rounded-lg px-2.5 py-1.5">
                          {n.failReason}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Fail reason expansion for desktop */}
            {notifications.some(
              (n: any) => n.status === "FAILED" && n.failReason,
            ) && (
              <div className="hidden sm:block border-t border-border bg-red-50/50 dark:bg-red-900/5 divide-y divide-border/60">
                {notifications
                  .filter((n: any) => n.status === "FAILED" && n.failReason)
                  .map((n: any) => (
                    <div
                      key={`err-${n.id}`}
                      className="flex items-center gap-3 px-4 py-2.5"
                    >
                      <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">
                          {n.client?.fullName}
                        </span>
                        {" — "}
                        <span className="text-red-600 dark:text-red-400">
                          {n.failReason}
                        </span>
                      </p>
                      <button
                        onClick={() => retry.mutate(n.id)}
                        disabled={retry.isPending}
                        className="ml-auto flex items-center gap-1 text-xs text-green-600 dark:text-green-400 hover:underline disabled:opacity-50"
                      >
                        <RefreshCw className="w-3 h-3" /> Retry
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </>
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
