// src/app/(dashboard)/appointments/[id]/page.tsx
"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useAppointment,
  useUpdateAppointment,
  useCancelAppointment,
} from "@/features/appointments/hooks/useAppointments";
import { AppointmentDetail } from "@/features/appointments/components/AppointmentDetail";
import { AppointmentForm } from "@/features/appointments/components/AppointmentForm";
import { StatusActions } from "@/features/appointments/components/StatusActions";
import { StatusBadge } from "@/features/appointments/components/StatusBadge";
import { usePermission } from "@/hooks/usePermission";
import { extractArray } from "@/lib/api/response";
import { formatDate, formatTime, formatCurrency, cn } from "@/lib/utils";
import api from "@/lib/api/client";
import { toast } from "sonner";
import {
  ArrowLeft,
  Edit2,
  X,
  Loader2,
  FileText,
  Receipt,
  Download,
  Trash2,
  Clock,
  AlertCircle,
  ChevronRight,
  CreditCard,
} from "lucide-react";
import Link from "next/link";

interface Props {
  params: Promise<{ id: string }>;
}

// ── Status history ─────────────────────────────────────────────────────────────

function StatusHistoryItem({ entry }: { entry: any }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-2 h-2 rounded-full bg-border mt-1.5 shrink-0 ring-2 ring-background" />
      <div className="flex-1 min-w-0 pb-4 border-l border-border/50 pl-4 -ml-[17px]">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-foreground">
            {entry.toStatus?.label ?? entry.status}
          </span>
          {entry.actor && (
            <span className="text-xs text-muted-foreground">
              by {entry.actor.fullName}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatDate(entry.createdAt, "long")} ·{" "}
          {new Date(entry.createdAt).toLocaleTimeString("en-KE", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
        {entry.reason && (
          <p className="text-xs text-muted-foreground mt-1 italic">
            "{entry.reason}"
          </p>
        )}
      </div>
    </div>
  );
}

// ── Financial section ──────────────────────────────────────────────────────────

function FinancialSection({
  appointmentId,
  invoice,
}: {
  appointmentId: string;
  invoice?: any;
}) {
  const qc = useQueryClient();
  const canGenerate = usePermission("invoices:generate");
  const canQuote = usePermission("quotes:create");

  const generateInvoice = useMutation({
    mutationFn: () => api.post(`/invoices/from-appointment/${appointmentId}`),
    onSuccess: () => {
      toast.success("Invoice generated");
      qc.invalidateQueries({
        queryKey: ["appointments", "detail", appointmentId],
      });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  const generateQuote = useMutation({
    mutationFn: () => api.post(`/quotes/from-appointment/${appointmentId}`),
    onSuccess: () => {
      toast.success("Quote created");
      qc.invalidateQueries({
        queryKey: ["appointments", "detail", appointmentId],
      });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  const STATUS_STYLE: Record<string, string> = {
    PAID: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    DRAFT: "bg-muted text-muted-foreground",
    ISSUED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    PARTIALLY_PAID:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    VOID: "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500",
  };

  if (invoice) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3.5 border border-border rounded-xl">
          <div className="flex items-center gap-3">
            <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground">
                  {invoice.invoiceNumber}
                </p>
                <span
                  className={cn(
                    "text-xs px-2 py-0.5 rounded-full font-medium",
                    STATUS_STYLE[invoice.status] ?? "",
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
                    · {formatCurrency(invoice.amountDue, invoice.currency)} due
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                window.open(
                  `${process.env.NEXT_PUBLIC_API_URL}/api/v1/pdf/invoice/${invoice.id}`,
                  "_blank",
                )
              }
              className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              title="Download PDF"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <Link href={`/invoices/${invoice.id}`}>
              <ChevronRight className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {canGenerate && (
        <button
          onClick={() => generateInvoice.mutate()}
          disabled={generateInvoice.isPending}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
          style={{
            backgroundColor: "var(--brand-gold)",
            color: "var(--brand-navy)",
          }}
        >
          {generateInvoice.isPending && (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          )}
          <FileText className="w-3.5 h-3.5" /> Generate Invoice
        </button>
      )}
      {canQuote && (
        <button
          onClick={() => generateQuote.mutate()}
          disabled={generateQuote.isPending}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium border border-border hover:bg-muted disabled:opacity-50 transition-colors"
        >
          {generateQuote.isPending && (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          )}
          <Receipt className="w-3.5 h-3.5" /> Create Quote
        </button>
      )}
    </div>
  );
}

// ── Amount breakdown — from service definitions, not invoice ──────────────────

function ServiceBreakdown({
  appointmentServices,
  currency = "KES",
}: {
  appointmentServices: any[];
  currency?: string;
}) {
  // Calculate from service/variant data as booked — NOT from invoice
  // This reflects what was agreed at booking time
  const subtotal = appointmentServices.reduce(
    (s, a) => s + (a.totalPrice ?? 0),
    0,
  );

  // Consultation fee — if primary service has one and it's not waived
  const consultationFee = appointmentServices.reduce((s, a) => {
    const fee = a.service?.consultationFee ?? 0;
    const model = a.service?.consultationFeeModel;
    // Only add if STANDALONE (always charged)
    if (model === "STANDALONE") return s + fee;
    return s;
  }, 0);

  // Tax — per service if not isTaxExempt
  // vatRate comes from each service or falls back to 0 (invoice applies clinic rate)
  const taxableAmount = appointmentServices
    .filter((a) => !a.service?.isTaxExempt)
    .reduce((s, a) => s + (a.totalPrice ?? 0), 0);

  // We show the breakdown as-booked; actual VAT is applied at invoice level
  const hasConsultationFee = consultationFee > 0;
  const hasTaxable = taxableAmount > 0;

  return (
    <div className="space-y-1.5">
      {/* Line items */}
      {appointmentServices.map((as: any, i: number) => (
        <div
          key={i}
          className="flex items-start justify-between gap-3 py-2 border-b border-border/40 last:border-0"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">
              {as.service?.name ?? "Service"}
              {as.variant && (
                <span className="text-muted-foreground font-normal">
                  {" "}
                  — {as.variant.name}
                </span>
              )}
            </p>
            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
              {as.durationMin && (
                <span className="text-xs text-muted-foreground">
                  {as.durationMin} min
                </span>
              )}
              {as.quantity > 1 && (
                <span className="text-xs text-muted-foreground">
                  ×{as.quantity}
                </span>
              )}
              {as.unitPrice && as.quantity > 1 && (
                <span className="text-xs text-muted-foreground">
                  {formatCurrency(as.unitPrice, currency)} each
                </span>
              )}
              {as.service?.isTaxExempt === false && (
                <span className="text-xs text-blue-600 dark:text-blue-400">
                  Taxable
                </span>
              )}
            </div>
          </div>
          <span className="text-sm font-semibold text-foreground shrink-0">
            {formatCurrency(as.totalPrice ?? 0, currency)}
          </span>
        </div>
      ))}

      {/* Consultation fee line */}
      {hasConsultationFee && (
        <div className="flex items-center justify-between py-2 border-b border-border/40">
          <div>
            <p className="text-sm text-foreground">Consultation fee</p>
            <p className="text-xs text-muted-foreground">
              Always charged (standalone)
            </p>
          </div>
          <span className="text-sm font-semibold text-foreground">
            {formatCurrency(consultationFee, currency)}
          </span>
        </div>
      )}

      {/* Subtotal */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-sm text-muted-foreground">Subtotal</span>
        <span className="text-sm font-medium text-foreground">
          {formatCurrency(subtotal, currency)}
        </span>
      </div>

      {/* VAT note */}
      {hasTaxable && (
        <p className="text-xs text-muted-foreground">
          VAT applies to {formatCurrency(taxableAmount, currency)} of taxable
          services — calculated at invoice stage.
        </p>
      )}

      {/* Total */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <span className="text-sm font-bold text-foreground">
          Estimated total
        </span>
        <span
          className="text-sm font-bold"
          style={{ color: "var(--brand-gold)" }}
        >
          {formatCurrency(subtotal, currency)}
        </span>
      </div>

      <p className="text-xs text-muted-foreground">
        Final total including VAT and any adjustments will be on the invoice.
      </p>
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
  const cancelAppt = useCancelAppointment();

  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "details" | "breakdown" | "documents" | "history"
  >("details");

  const canEdit = usePermission("appointments:update");
  const canCancel = usePermission("appointments:cancel");

  const { data: historyData } = useQuery({
    queryKey: ["appointments", "history", id],
    queryFn: () => api.get(`/appointments/${id}/status-history`),
    enabled: !!id,
    select: (res) => extractArray(res),
  });
  const history = historyData ?? [];

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

  const invoiceLocked = appt?.invoice && appt.invoice.status !== "DRAFT";
  const isTerminal =
    appt?.status?.isCompleted ||
    appt?.status?.isCancelled ||
    appt?.status?.isNoShow;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Appointments
      </button>

      {/* Header */}
      <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-bold text-foreground">
                {appt.client.fullName}
              </h1>
              <StatusBadge status={appt.status} />
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {formatDate(appt.date, "long")} · {formatTime(appt.startTime)} —{" "}
              {formatTime(appt.endTime)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Dr. {appt.doctor.fullName}
              {(appt as any).source && ` · via ${(appt as any).source.label}`}
            </p>

            {/* Timestamps */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
              {(appt as any).arrivedAt && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Arrived{" "}
                  {new Date((appt as any).arrivedAt).toLocaleTimeString(
                    "en-KE",
                    { hour: "2-digit", minute: "2-digit" },
                  )}
                </span>
              )}
              {(appt as any).checkedInAt && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Checked in{" "}
                  {new Date((appt as any).checkedInAt).toLocaleTimeString(
                    "en-KE",
                    { hour: "2-digit", minute: "2-digit" },
                  )}
                </span>
              )}
              {(appt as any).completedAt && (
                <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Completed{" "}
                  {new Date((appt as any).completedAt).toLocaleTimeString(
                    "en-KE",
                    { hour: "2-digit", minute: "2-digit" },
                  )}
                </span>
              )}
              {(appt as any).cancelledAt && (
                <span className="text-xs text-destructive flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Cancelled{" "}
                  {new Date((appt as any).cancelledAt).toLocaleTimeString(
                    "en-KE",
                    { hour: "2-digit", minute: "2-digit" },
                  )}
                </span>
              )}
              {(appt as any).noShowAt && (
                <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> No-show at{" "}
                  {new Date((appt as any).noShowAt).toLocaleTimeString(
                    "en-KE",
                    { hour: "2-digit", minute: "2-digit" },
                  )}
                </span>
              )}
              {(appt as any).cancelReason && (
                <span className="text-xs text-muted-foreground italic">
                  Reason: {(appt as any).cancelReason}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {canEdit && !editing && !isTerminal && !invoiceLocked && (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border hover:bg-muted transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit
              </button>
            )}
            {invoiceLocked && !isTerminal && (
              <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800/40">
                Invoice locked
              </span>
            )}
          </div>
        </div>

        {/* Status actions */}
        {!isTerminal && <StatusActions appointment={appt} />}
      </div>

      {/* Edit form */}
      {editing && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-muted/30">
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

      {/* Main tabs */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="flex border-b border-border overflow-x-auto">
          {(["details", "breakdown", "documents", "history"] as const).map(
            (tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "flex-1 min-w-fit px-4 py-3 text-sm font-medium capitalize whitespace-nowrap transition-colors border-b-2 -mb-px",
                  activeTab === tab
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {tab === "breakdown" ? "Amount" : tab}
              </button>
            ),
          )}
        </div>

        <div className="p-5 space-y-4">
          {/* Details — use AppointmentDetail component */}
          {activeTab === "details" && <AppointmentDetail appointment={appt} />}

          {/* Amount breakdown — from service definitions, not invoice */}
          {activeTab === "breakdown" && (
            <ServiceBreakdown
              appointmentServices={appt.appointmentServices}
              currency={(appt as any).invoice?.currency ?? "KES"}
            />
          )}

          {/* Documents */}
          {activeTab === "documents" && (
            <FinancialSection
              appointmentId={id}
              invoice={appt.invoice}
            />
          )}

          {/* History */}
          {activeTab === "history" && (
            <div>
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-24 gap-2">
                  <Clock className="w-8 h-8 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">
                    No status history yet
                  </p>
                </div>
              ) : (
                <div className="space-y-0 ml-2">
                  {history.map((entry: any, i: number) => (
                    <StatusHistoryItem
                      key={i}
                      entry={entry}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
