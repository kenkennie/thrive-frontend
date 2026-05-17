"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useAppointment,
  useUpdateAppointment,
  useCancelAppointment,
} from "@/features/appointments/hooks/useAppointments";
import { AppointmentForm } from "@/features/appointments/components/AppointmentForm";
import { usePermission } from "@/hooks/usePermission";
import { extractArray } from "@/lib/api/response";
import { formatDate, formatTime, formatCurrency, cn } from "@/lib/utils";
import api from "@/lib/api/client";
import { toast } from "sonner";
import Link from "next/link";
import {
  ArrowLeft,
  Edit2,
  X,
  Loader2,
  FileText,
  Receipt,
  Download,
  Clock,
  AlertCircle,
  ChevronRight,
  CreditCard,
  CheckCircle2,
  XCircle,
  UserCheck,
  Play,
  Ban,
  AlertTriangle,
  Stethoscope,
  Phone,
  Mail,
  Calendar,
  Activity,
  FileCheck,
  MessageSquare,
} from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

// ── Status config ──────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string }> =
  {
    PENDING: {
      bg: "bg-slate-100 dark:bg-slate-800/60",
      text: "text-slate-600 dark:text-slate-300",
      dot: "bg-slate-400",
    },
    CONFIRMED: {
      bg: "bg-blue-50 dark:bg-blue-900/30",
      text: "text-blue-700 dark:text-blue-300",
      dot: "bg-blue-500",
    },
    ARRIVED: {
      bg: "bg-violet-50 dark:bg-violet-900/30",
      text: "text-violet-700 dark:text-violet-300",
      dot: "bg-violet-500",
    },
    CHECKED_IN: {
      bg: "bg-amber-50 dark:bg-amber-900/30",
      text: "text-amber-700 dark:text-amber-300",
      dot: "bg-amber-500",
    },
    IN_PROGRESS: {
      bg: "bg-indigo-50 dark:bg-indigo-900/30",
      text: "text-indigo-700 dark:text-indigo-300",
      dot: "bg-indigo-500",
    },
    COMPLETED: {
      bg: "bg-emerald-50 dark:bg-emerald-900/30",
      text: "text-emerald-700 dark:text-emerald-300",
      dot: "bg-emerald-500",
    },
    CANCELLED: {
      bg: "bg-red-50 dark:bg-red-900/20",
      text: "text-red-600 dark:text-red-400",
      dot: "bg-red-500",
    },
    NO_SHOW: {
      bg: "bg-orange-50 dark:bg-orange-900/20",
      text: "text-orange-600 dark:text-orange-400",
      dot: "bg-orange-500",
    },
  };

const ALLOWED: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["ARRIVED", "NO_SHOW", "CANCELLED"],
  ARRIVED: ["CHECKED_IN", "NO_SHOW", "CANCELLED"],
  CHECKED_IN: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
};

const ACTION_META: Record<
  string,
  { label: string; icon: React.ElementType; style: string }
> = {
  CONFIRMED: {
    label: "Confirm",
    icon: CheckCircle2,
    style: "bg-blue-600 hover:bg-blue-700 text-white",
  },
  ARRIVED: {
    label: "Mark Arrived",
    icon: UserCheck,
    style: "bg-violet-600 hover:bg-violet-700 text-white",
  },
  CHECKED_IN: {
    label: "Check In",
    icon: FileCheck,
    style: "bg-amber-600 hover:bg-amber-700 text-white",
  },
  IN_PROGRESS: {
    label: "Start Session",
    icon: Play,
    style: "bg-indigo-600 hover:bg-indigo-700 text-white",
  },
  COMPLETED: {
    label: "Complete",
    icon: CheckCircle2,
    style: "bg-emerald-600 hover:bg-emerald-700 text-white",
  },
  NO_SHOW: {
    label: "No Show",
    icon: AlertTriangle,
    style: "bg-orange-500 hover:bg-orange-600 text-white",
  },
  CANCELLED: {
    label: "Cancel",
    icon: XCircle,
    style: "bg-red-500 hover:bg-red-600 text-white",
  },
};

// ── Status badge ───────────────────────────────────────────────────────────────

function StatusPill({ name, label }: { name: string; label: string }) {
  const cfg = STATUS_CONFIG[name] ?? STATUS_CONFIG.PENDING;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold",
        cfg.bg,
        cfg.text,
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
      {label}
    </span>
  );
}

// ── Action buttons ─────────────────────────────────────────────────────────────

function StatusActionBar({ appt, onDone }: { appt: any; onDone?: () => void }) {
  const qc = useQueryClient();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelNote, setCancelNote] = useState("");
  const [completeOpen, setCompleteOpen] = useState(false);
  const [completeNote, setCompleteNote] = useState("");
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const canConfirm = usePermission("appointments:confirm");
  const canCheckIn = usePermission("appointments:check_in");
  const canStart = usePermission("appointments:start");
  const canComplete = usePermission("appointments:complete");
  const canNoShow = usePermission("appointments:no_show");
  const canCancel = usePermission("appointments:cancel");

  const permMap: Record<string, boolean> = {
    CONFIRMED: canConfirm,
    ARRIVED: canCheckIn,
    CHECKED_IN: canCheckIn,
    IN_PROGRESS: canStart,
    COMPLETED: canComplete,
    NO_SHOW: canNoShow,
    CANCELLED: canCancel,
  };

  const transition = useMutation({
    mutationFn: ({ status, note }: { status: string; note?: string }) =>
      appt.status.name === "PENDING" && status === "CANCELLED"
        ? api.post(`/appointments/${appt.id}/cancel`, { reason: note ?? "" })
        : status === "CANCELLED"
          ? api.post(`/appointments/${appt.id}/cancel`, { reason: note ?? "" })
          : api.post(`/appointments/${appt.id}/transition`, {
              statusName: status,
              note,
            }),
    onSuccess: () => {
      toast.success("Status updated");
      qc.invalidateQueries({ queryKey: ["appointments", "detail", appt.id] });
      qc.invalidateQueries({ queryKey: ["appointments", "history", appt.id] });
      setCancelOpen(false);
      setCompleteOpen(false);
      onDone?.();
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  const allowed = ALLOWED[appt.status.name] ?? [];
  const visibleActions = allowed.filter((a) => permMap[a] !== false);

  if (visibleActions.length === 0) return null;

  const handleAction = (action: string) => {
    if (action === "CANCELLED") {
      setCancelOpen(true);
      setCompleteOpen(false);
      return;
    }
    if (action === "COMPLETED") {
      setCompleteOpen(true);
      setCancelOpen(false);
      return;
    }
    transition.mutate({ status: action });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {visibleActions.map((action) => {
          const meta = ACTION_META[action];
          if (!meta) return null;
          const Icon = meta.icon;
          const isCancelAction = action === "CANCELLED";
          return (
            <button
              key={action}
              onClick={() => handleAction(action)}
              disabled={transition.isPending}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-50",
                isCancelAction
                  ? "border border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  : meta.style,
              )}
            >
              {transition.isPending && pendingAction === action ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Icon className="w-3.5 h-3.5" />
              )}
              {meta.label}
            </button>
          );
        })}
      </div>

      {/* Complete note panel */}
      {completeOpen && (
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-900/10 p-4 space-y-3">
          <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> Complete appointment
          </p>
          <textarea
            value={completeNote}
            onChange={(e) => setCompleteNote(e.target.value)}
            rows={2}
            placeholder="Completion note (optional) — e.g. treatment went well, follow-up recommended…"
            className="w-full px-3 py-2.5 text-sm rounded-lg border border-emerald-200 dark:border-emerald-700 bg-white dark:bg-emerald-900/20 text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
          />
          <div className="flex gap-2">
            <button
              onClick={() => {
                setPendingAction("COMPLETED");
                transition.mutate({
                  status: "COMPLETED",
                  note: completeNote || undefined,
                });
              }}
              disabled={transition.isPending}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 transition-colors"
            >
              {transition.isPending && (
                <Loader2 className="w-3 h-3 animate-spin" />
              )}
              Confirm complete
            </button>
            <button
              onClick={() => setCompleteOpen(false)}
              className="px-4 py-1.5 rounded-lg text-xs border border-border hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Cancel note panel */}
      {cancelOpen && (
        <div className="rounded-xl border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-900/10 p-4 space-y-3">
          <p className="text-sm font-semibold text-red-700 dark:text-red-400 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" /> Cancel appointment
          </p>
          <textarea
            value={cancelNote}
            onChange={(e) => setCancelNote(e.target.value)}
            rows={2}
            placeholder="Reason for cancellation (required)…"
            className="w-full px-3 py-2.5 text-sm rounded-lg border border-red-200 dark:border-red-700 bg-white dark:bg-red-900/20 text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-red-400/30"
          />
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (!cancelNote.trim()) {
                  toast.error("Cancellation reason is required");
                  return;
                }
                setPendingAction("CANCELLED");
                transition.mutate({ status: "CANCELLED", note: cancelNote });
              }}
              disabled={transition.isPending || !cancelNote.trim()}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 transition-colors"
            >
              {transition.isPending && (
                <Loader2 className="w-3 h-3 animate-spin" />
              )}
              Confirm cancel
            </button>
            <button
              onClick={() => setCancelOpen(false)}
              className="px-4 py-1.5 rounded-lg text-xs border border-border hover:bg-muted transition-colors"
            >
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Timeline row ───────────────────────────────────────────────────────────────

function TimelineRow({
  label,
  time,
  colour,
}: {
  label: string;
  time?: string | null;
  colour: string;
}) {
  if (!time) return null;
  return (
    <div className="flex items-center gap-3">
      <div className={cn("w-2 h-2 rounded-full shrink-0", colour)} />
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-medium text-foreground ml-auto">
        {new Date(time).toLocaleTimeString("en-KE", {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>
    </div>
  );
}

// ── Info row ───────────────────────────────────────────────────────────────────

function InfoRow({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  href?: string;
}) {
  const inner = (
    <div
      className={cn(
        "flex items-center gap-3 py-2.5 px-3 rounded-xl",
        href && "hover:bg-muted/50 transition-colors group",
      )}
    >
      <div className="w-7 h-7 rounded-lg bg-muted/60 flex items-center justify-center shrink-0">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </p>
        <p className="text-sm font-medium text-foreground truncate">{value}</p>
      </div>
      {href && (
        <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      )}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

// ── Financial mini-card ────────────────────────────────────────────────────────

function FinancialSection({
  appointmentId,
  invoice,
  quote,
}: {
  appointmentId: string;
  invoice?: any;
  quote?: any;
}) {
  const qc = useQueryClient();
  const canInvoice = usePermission("invoices:generate");
  const canQuote = usePermission("quotes:create");

  const genInvoice = useMutation({
    mutationFn: () => api.post(`/invoices/from-appointment/${appointmentId}`),
    onSuccess: () => {
      toast.success("Invoice generated");
      qc.invalidateQueries({
        queryKey: ["appointments", "detail", appointmentId],
      });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
  const genQuote = useMutation({
    mutationFn: () => api.post(`/quotes/from-appointment/${appointmentId}`),
    onSuccess: () => {
      toast.success("Quote created");
      qc.invalidateQueries({
        queryKey: ["appointments", "detail", appointmentId],
      });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  const INVOICE_STATUS_CLS: Record<string, string> = {
    PAID: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    DRAFT: "bg-muted text-muted-foreground",
    ISSUED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    PARTIALLY_PAID:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    VOID: "bg-gray-200 text-gray-500 dark:bg-gray-800 dark:text-gray-500",
  };

  return (
    <div className="space-y-2">
      {invoice && (
        <Link href={`/invoices/${invoice.id}`}>
          <div className="flex items-center justify-between p-3.5 border border-border rounded-xl hover:bg-muted/30 transition-colors group">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center">
                <FileText className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground font-mono">
                    {invoice.invoiceNumber}
                  </p>
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-full font-semibold",
                      INVOICE_STATUS_CLS[invoice.status],
                    )}
                  >
                    {invoice.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(invoice.totalAmount, invoice.currency)}
                  {invoice.amountDue > 0 && (
                    <span className="text-amber-600 dark:text-amber-400">
                      {" "}
                      · {formatCurrency(
                        invoice.amountDue,
                        invoice.currency,
                      )}{" "}
                      due
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  window.open(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/pdf/invoice/${invoice.id}`,
                    "_blank",
                  );
                }}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </Link>
      )}
      {quote && (
        <Link href={`/quotes/${quote.id}`}>
          <div className="flex items-center justify-between p-3.5 border border-border rounded-xl hover:bg-muted/30 transition-colors group">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center">
                <Receipt className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground font-mono">
                  {quote.quoteNumber}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(quote.totalAmount, "KES")} · {quote.status}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </Link>
      )}
      {!invoice && !quote && (canInvoice || canQuote) && (
        <div className="flex gap-2 flex-wrap">
          {canInvoice && (
            <button
              onClick={() => genInvoice.mutate()}
              disabled={genInvoice.isPending}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold disabled:opacity-50 transition-all"
              style={{
                backgroundColor: "var(--brand-gold)",
                color: "var(--brand-navy)",
              }}
            >
              {genInvoice.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileText className="w-3.5 h-3.5" />
              )}
              Generate Invoice
            </button>
          )}
          {canQuote && (
            <button
              onClick={() => genQuote.mutate()}
              disabled={genQuote.isPending}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border border-border hover:bg-muted disabled:opacity-50 transition-all"
            >
              {genQuote.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Receipt className="w-3.5 h-3.5" />
              )}
              Create Quote
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function AppointmentDetailPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const qc = useQueryClient();

  const { data: appt, isLoading } = useAppointment(id);
  const updateAppt = useUpdateAppointment(id);

  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "overview" | "amount" | "documents" | "history"
  >("overview");

  const canEdit = usePermission("appointments:update");

  const { data: historyData } = useQuery({
    queryKey: ["appointments", "history", id],
    queryFn: () => api.get(`/appointments/${id}/status-history`),
    enabled: !!id,
    select: (res) => extractArray(res),
  });
  const history: any[] = historyData ?? [];

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  if (!appt)
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Appointment not found</p>
      </div>
    );

  const isTerminal =
    appt.status?.isCompleted ||
    appt.status?.isCancelled ||
    appt.status?.isNoShow;
  const invoiceLocked = appt.invoice && appt.invoice.status !== "DRAFT";
  const totalDuration = (appt.appointmentServices as any[]).reduce(
    (s, a) => s + (a.durationMin ?? a.service?.durationMin ?? 0),
    0,
  );
  const subtotal = (appt.appointmentServices as any[]).reduce(
    (s, a) => s + (Number(a.totalPrice) ?? 0),
    0,
  );

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Appointments
      </button>

      {/* ── Hero card ── */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {/* Status stripe */}
        <div
          className={cn("h-1 w-full", {
            "bg-slate-300 dark:bg-slate-600": appt.status.name === "PENDING",
            "bg-blue-500": appt.status.name === "CONFIRMED",
            "bg-violet-500": appt.status.name === "ARRIVED",
            "bg-amber-500": appt.status.name === "CHECKED_IN",
            "bg-indigo-500": appt.status.name === "IN_PROGRESS",
            "bg-emerald-500": appt.status.name === "COMPLETED",
            "bg-red-500": appt.status.name === "CANCELLED",
            "bg-orange-500": appt.status.name === "NO_SHOW",
          })}
        />

        <div className="p-5 space-y-4">
          {/* Top row */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-bold text-foreground">
                  {appt.client.fullName}
                </h1>
                <StatusPill
                  name={appt.status.name}
                  label={appt.status.label}
                />
              </div>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(appt.date, "long")}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {formatTime(appt.startTime)} — {formatTime(appt.endTime)}
                  {totalDuration > 0 && (
                    <span className="text-xs ml-1">({totalDuration} min)</span>
                  )}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Dr. {appt.doctor.fullName}
                {(appt as any).source && ` · via ${(appt as any).source.label}`}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {canEdit && !isTerminal && !invoiceLocked && (
                <button
                  onClick={() => setEditing(!editing)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border hover:bg-muted transition-colors"
                >
                  {editing ? (
                    <X className="w-3.5 h-3.5" />
                  ) : (
                    <Edit2 className="w-3.5 h-3.5" />
                  )}
                  {editing ? "Cancel edit" : "Edit"}
                </button>
              )}
              {invoiceLocked && !isTerminal && (
                <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800/40">
                  Invoice locked
                </span>
              )}
            </div>
          </div>

          {/* Status timestamps */}
          {(appt as any).arrivedAt ||
          (appt as any).checkedInAt ||
          (appt as any).completedAt ||
          (appt as any).cancelledAt ||
          (appt as any).noShowAt ? (
            <div className="bg-muted/30 rounded-xl px-3 py-2.5 space-y-1.5">
              <TimelineRow
                label="Arrived"
                time={(appt as any).arrivedAt}
                colour="bg-violet-500"
              />
              <TimelineRow
                label="Checked in"
                time={(appt as any).checkedInAt}
                colour="bg-amber-500"
              />
              <TimelineRow
                label="Completed"
                time={(appt as any).completedAt}
                colour="bg-emerald-500"
              />
              <TimelineRow
                label="Cancelled"
                time={(appt as any).cancelledAt}
                colour="bg-red-500"
              />
              <TimelineRow
                label="No-show"
                time={(appt as any).noShowAt}
                colour="bg-orange-500"
              />
            </div>
          ) : null}

          {(appt as any).cancelReason && (
            <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/40 rounded-xl">
              <Ban className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 dark:text-red-400">
                <span className="font-semibold">Cancelled:</span>{" "}
                {(appt as any).cancelReason}
              </p>
            </div>
          )}

          {/* Actions */}
          {!isTerminal && <StatusActionBar appt={appt} />}

          {/* Session note shortcut — IN_PROGRESS or COMPLETED */}
          {(appt.status.name === "IN_PROGRESS" ||
            appt.status.name === "COMPLETED") && (
            <Link href={`/appointments/${id}/session`}>
              <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-dashed border-border hover:border-primary/40 hover:bg-muted/30 transition-all group">
                <Stethoscope className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors flex-1">
                  {appt.status.name === "COMPLETED"
                    ? "View session note"
                    : "Write clinical session note"}
                </p>
                <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* ── Edit form ── */}
      {editing && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-muted/20">
            <h3 className="text-sm font-semibold text-foreground">
              Edit Appointment
            </h3>
            <button
              onClick={() => setEditing(false)}
              className="p-1 rounded-md hover:bg-muted text-muted-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-5">
            <AppointmentForm
              appointment={appt}
              isLoading={updateAppt.isPending}
              onCancel={() => setEditing(false)}
              onSubmit={async (data) => {
                await updateAppt.mutateAsync(data as any);
                setEditing(false);
              }}
            />
          </div>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="flex border-b border-border overflow-x-auto">
          {(
            [
              { id: "overview", label: "Overview" },
              { id: "amount", label: "Amount" },
              { id: "documents", label: "Documents" },
              { id: "history", label: "History" },
            ] as const
          ).map(({ id: tabId, label }) => (
            <button
              key={tabId}
              onClick={() => setActiveTab(tabId)}
              className={cn(
                "flex-1 min-w-fit px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px",
                activeTab === tabId
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="p-5 space-y-3">
          {/* ── Overview ── */}
          {activeTab === "overview" && (
            <div className="space-y-1">
              {/* Client */}
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1 pb-1">
                Client
              </p>
              <InfoRow
                icon={Phone}
                label="Phone"
                value={appt.client.phoneNumber}
                href={`tel:${appt.client.phoneNumber}`}
              />
              {appt.client.email && (
                <InfoRow
                  icon={Mail}
                  label="Email"
                  value={appt.client.email}
                  href={`mailto:${appt.client.email}`}
                />
              )}
              <InfoRow
                icon={Activity}
                label="Lifetime no-shows"
                value={String(appt.client.noShowCount ?? 0)}
              />
              <div className="pt-1">
                <Link
                  href={`/clients/${appt.client.id}`}
                  className="flex items-center gap-1.5 text-xs font-medium hover:underline px-3"
                  style={{ color: "var(--brand-gold)" }}
                >
                  View client profile <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Services */}
              <div className="pt-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1 pb-2">
                  Services booked
                </p>
                <div className="divide-y divide-border/50 border border-border rounded-xl overflow-hidden">
                  {(appt.appointmentServices as any[]).map((as, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between px-3.5 py-2.5"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {as.service.name}
                          {as.variant && (
                            <span className="text-muted-foreground font-normal">
                              {" "}
                              — {as.variant.name}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {as.durationMin} min
                          {as.quantity > 1 ? ` · ×${as.quantity}` : ""}
                          {!(as.service as any)?.isTaxExempt && (
                            <span className="ml-2 text-blue-500">VAT</span>
                          )}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-foreground">
                        {formatCurrency(as.totalPrice ?? 0)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {((appt as any).clientNotes || (appt as any).internalNotes) && (
                <div className="pt-3 space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1">
                    Notes
                  </p>
                  {(appt as any).clientNotes && (
                    <div className="px-3.5 py-2.5 bg-muted/30 rounded-xl">
                      <p className="text-[10px] font-medium text-muted-foreground mb-1">
                        Client note
                      </p>
                      <p className="text-sm text-foreground">
                        {(appt as any).clientNotes}
                      </p>
                    </div>
                  )}
                  {(appt as any).internalNotes && (
                    <div className="px-3.5 py-2.5 bg-amber-50 dark:bg-amber-900/10 border border-amber-200/60 dark:border-amber-800/30 rounded-xl">
                      <p className="text-[10px] font-medium text-amber-700 dark:text-amber-400 mb-1">
                        Internal note
                      </p>
                      <p className="text-sm text-foreground">
                        {(appt as any).internalNotes}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Treatment plan link */}
              {(appt as any).treatmentPlan && (
                <div className="pt-3">
                  <InfoRow
                    icon={FileText}
                    label="Treatment plan"
                    value={(appt as any).treatmentPlan.title}
                    href={`/clinical/treatment-plans/${(appt as any).treatmentPlan.id}`}
                  />
                </div>
              )}
            </div>
          )}

          {/* ── Amount ── */}
          {activeTab === "amount" && (
            <div className="space-y-1.5">
              <div className="divide-y divide-border/50 border border-border rounded-xl overflow-hidden">
                {(appt.appointmentServices as any[]).map((as, i) => (
                  <div
                    key={i}
                    className="flex items-start justify-between px-3.5 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {as.service.name}
                        {as.variant && (
                          <span className="text-muted-foreground font-normal">
                            {" "}
                            — {as.variant.name}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {as.quantity > 1
                          ? `×${as.quantity} @ ${formatCurrency(as.unitPrice)}`
                          : `${as.durationMin} min`}
                        {!(as.service as any)?.isTaxExempt && (
                          <span className="ml-2 text-blue-500 text-[10px]">
                            Taxable
                          </span>
                        )}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                      {formatCurrency(as.totalPrice ?? 0)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="px-3.5 py-3 bg-muted/20 rounded-xl space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium text-foreground">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-border">
                  <span className="text-sm font-bold text-foreground">
                    Estimated total
                  </span>
                  <span
                    className="text-base font-bold"
                    style={{ color: "var(--brand-gold)" }}
                  >
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  VAT and adjustments applied at invoice stage.
                </p>
              </div>
            </div>
          )}

          {/* ── Documents ── */}
          {activeTab === "documents" && (
            <FinancialSection
              appointmentId={id}
              invoice={appt.invoice}
              quote={(appt as any).quote}
            />
          )}

          {/* ── History ── */}
          {activeTab === "history" && (
            <div>
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-24 gap-2">
                  <Clock className="w-8 h-8 text-muted-foreground/20" />
                  <p className="text-sm text-muted-foreground">
                    No status history yet
                  </p>
                </div>
              ) : (
                <div className="relative pl-4">
                  <div className="absolute left-4 top-2 bottom-2 w-px bg-border" />
                  <div className="space-y-0">
                    {history.map((entry: any, i: number) => {
                      const cfg =
                        STATUS_CONFIG[entry.toStatus?.name ?? ""] ??
                        STATUS_CONFIG.PENDING;
                      return (
                        <div
                          key={i}
                          className="relative flex items-start gap-4 pb-5 last:pb-0"
                        >
                          <div
                            className={cn(
                              "absolute -left-[5px] w-2.5 h-2.5 rounded-full border-2 border-background mt-1 shrink-0",
                              cfg.dot,
                            )}
                          />
                          <div className="ml-3 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-foreground">
                                {entry.toStatus?.label ?? "—"}
                              </span>
                              {entry.changedBy && (
                                <span className="text-xs text-muted-foreground">
                                  by {entry.changedBy.fullName}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {formatDate(entry.createdAt)} ·{" "}
                              {new Date(entry.createdAt).toLocaleTimeString(
                                "en-KE",
                                { hour: "2-digit", minute: "2-digit" },
                              )}
                            </p>
                            {entry.note && (
                              <p className="text-xs text-muted-foreground mt-1 italic bg-muted/30 px-2 py-1 rounded-lg">
                                "{entry.note}"
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
