"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useAppointment,
  useCancelAppointment,
  useUpdateAppointment,
} from "@/features/appointments/hooks/useAppointments";
import { AppointmentForm } from "@/features/appointments/components/Appointmentform";
import { StatusActions } from "@/features/appointments/components/StatusActions";
import { StatusBadge } from "@/features/appointments/components/StatusBadge";
import { usePermission } from "@/hooks/usePermission";
import { extractArray, extractItem } from "@/lib/api/response";
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
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

interface Props {
  params: Promise<{ id: string }>;
}

// ── Status history item ───────────────────────────────────────────────────────

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

// ── Invoice / Quote section ───────────────────────────────────────────────────

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
  const canViewInvoice = usePermission("invoices:view");

  const generateInvoice = useMutation({
    mutationFn: () => api.post(`/invoices/from-appointment/${appointmentId}`),
    onSuccess: () => {
      toast.success("Invoice generated");
      qc.invalidateQueries({
        queryKey: ["appointments", "detail", appointmentId],
      });
    },
    onError: (e: any) =>
      toast.error(e?.message ?? "Failed to generate invoice"),
  });

  const generateQuote = useMutation({
    mutationFn: () => api.post(`/quotes/from-appointment/${appointmentId}`),
    onSuccess: () => {
      toast.success("Quote created");
      qc.invalidateQueries({
        queryKey: ["appointments", "detail", appointmentId],
      });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to create quote"),
  });

  const downloadPdf = (type: "invoice" | "quote", id: string) => {
    window.open(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/pdf/${type}/${id}`,
      "_blank",
    );
  };

  const STATUS_STYLE: Record<string, string> = {
    PAID: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    DRAFT: "bg-muted text-muted-foreground",
    ISSUED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    PARTIALLY_PAID:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    VOID: "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500",
  };

  return (
    <div className="space-y-3">
      {invoice ? (
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
              onClick={() => downloadPdf("invoice", invoice.id)}
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
      ) : (
        <div className="flex items-center gap-2 flex-wrap">
          {canGenerate && (
            <button
              onClick={() => generateInvoice.mutate()}
              disabled={generateInvoice.isPending}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
              style={{
                backgroundColor: "var(--brand-gold)",
                color: "var(--brand-navy)",
              }}
            >
              {generateInvoice.isPending && (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              )}
              <FileText className="w-3.5 h-3.5" />
              Generate Invoice
            </button>
          )}
          {canQuote && (
            <button
              onClick={() => generateQuote.mutate()}
              disabled={generateQuote.isPending}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium border border-border hover:bg-muted transition-all disabled:opacity-50"
            >
              {generateQuote.isPending && (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              )}
              <Receipt className="w-3.5 h-3.5" />
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
  const cancelAppt = useCancelAppointment();
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "details" | "documents" | "history"
  >("details");

  const canEdit = usePermission("appointments:update");
  const canCancel = usePermission("appointments:cancel");
  const canDelete = usePermission("appointments:cancel"); // same guard for delete

  // Status history
  const { data: historyData } = useQuery({
    queryKey: ["appointments", "history", id],
    queryFn: () => api.get(`/appointments/${id}/status-history`),
    enabled: !!id,
    select: (res) => extractArray(res),
  });
  const history = historyData ?? [];

  const invoiceLocked = appt?.invoice && appt.invoice.status !== "DRAFT";
  const isTerminal =
    appt?.status.isCompleted ||
    appt?.status.isCancelled ||
    appt?.status.isNoShow;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!appt) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-muted-foreground">Appointment not found</p>
        <button
          onClick={() => router.back()}
          className="text-sm hover:underline"
          style={{ color: "var(--brand-gold)" }}
        >
          Go back
        </button>
      </div>
    );
  }

  const totalAmount = appt.appointmentServices.reduce(
    (s, a) => s + a.totalPrice,
    0,
  );

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Appointments
      </button>

      {/* Header card */}
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
              {appt.source && ` · via ${appt.source.label}`}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {canEdit && !editing && !isTerminal && !invoiceLocked && (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border hover:bg-muted transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit
              </button>
            )}
            {invoiceLocked && !isTerminal && (
              <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800/40">
                Invoice locked
              </span>
            )}
          </div>
        </div>

        {/* Status transitions */}
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
              className="p-1 rounded-md hover:bg-muted transition-colors text-muted-foreground"
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

      {/* Tabs */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="flex border-b border-border">
          {(["details", "documents", "history"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 py-3 text-sm font-medium capitalize transition-colors border-b-2 -mb-px",
                activeTab === tab
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-5 space-y-4">
          {/* Details tab */}
          {activeTab === "details" && (
            <div className="space-y-4">
              {/* Client */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Client
                </p>
                <Link
                  href={`/clients/${appt.client.id}`}
                  className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-muted/30 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
                      style={{
                        backgroundColor: "var(--brand-gold)",
                        color: "var(--brand-navy)",
                      }}
                    >
                      {appt.client.fullName
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {appt.client.fullName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {appt.client.phoneNumber}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </Link>
                {appt.client.noShowCount > 0 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {appt.client.noShowCount} previous no-show
                    {appt.client.noShowCount > 1 ? "s" : ""}
                  </p>
                )}
              </div>

              {/* Services */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Services
                </p>
                <div className="space-y-2">
                  {appt.appointmentServices.map((s, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {s.service.name}
                          {s.variant && (
                            <span className="text-muted-foreground font-normal">
                              {" "}
                              — {s.variant.name}
                            </span>
                          )}
                        </p>
                        {s.durationMin && (
                          <p className="text-xs text-muted-foreground">
                            {s.durationMin} min
                          </p>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-foreground">
                        {formatCurrency(s.totalPrice)}
                      </span>
                    </div>
                  ))}
                  {appt.appointmentServices.length > 1 && (
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-sm font-bold text-foreground">
                        Total
                      </span>
                      <span
                        className="text-sm font-bold"
                        style={{ color: "var(--brand-gold)" }}
                      >
                        {formatCurrency(totalAmount)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              {(appt.clientNotes || appt.internalNotes) && (
                <div className="space-y-2">
                  {appt.clientNotes && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        Client note
                      </p>
                      <p className="text-sm text-foreground bg-muted/40 rounded-lg p-2.5">
                        {appt.clientNotes}
                      </p>
                    </div>
                  )}
                  {appt.internalNotes && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        Internal note
                      </p>
                      <p className="text-sm text-foreground bg-amber-50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-800/30 rounded-lg p-2.5">
                        {appt.internalNotes}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Treatment plan */}
              {appt.treatmentPlan && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Treatment Plan
                  </p>
                  <Link
                    href={`/clinical/treatment-plans/${appt.treatmentPlan.id}`}
                    className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-muted/30 transition-colors group"
                  >
                    <p className="text-sm font-medium text-foreground">
                      {appt.treatmentPlan.title}
                    </p>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </Link>
                </div>
              )}

              {/* Danger zone */}
              {canCancel && !isTerminal && (
                <div className="pt-2 border-t border-border">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Danger Zone
                  </p>
                  <button
                    onClick={() => {
                      if (confirm("Cancel this appointment?")) {
                        cancelAppt.mutate({ id } as any, {
                          onSuccess: () => router.push("/appointments"),
                        });
                      }
                    }}
                    disabled={cancelAppt.isPending}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm text-destructive border border-destructive/30 hover:bg-destructive/5 transition-colors disabled:opacity-50"
                  >
                    {cancelAppt.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                    Cancel appointment
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Documents tab */}
          {activeTab === "documents" && (
            <FinancialSection
              appointmentId={id}
              invoice={appt.invoice}
            />
          )}

          {/* History tab */}
          {activeTab === "history" && (
            <div className="space-y-0">
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
