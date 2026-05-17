// src/app/(dashboard)/invoices/[id]/page.tsx
"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useInvoice,
  useIssueInvoice,
  useVoidInvoice,
  useUpdateInvoice,
  useCreateCreditNote,
  useCreateDebitNote,
  useRefundPayment,
  useApplyCreditNote,
  useVoidCreditNote,
  useMarkDebitNotePaid,
  useVoidDebitNote,
} from "@/features/financial/hooks/useFinancial";
import { InvoiceForm } from "@/features/financial/components/InvoiceForm";
import { RecordPaymentForm } from "@/features/financial/components/RecordPaymentForm";
import { InvoiceStatusBadge } from "@/features/financial/components/StatusBadge";
import { PdfButton } from "@/features/financial/components/PdfButton";
import financialApi from "@/lib/api/financial";
import { usePermission } from "@/hooks/usePermission";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  ArrowLeft,
  Send,
  XCircle,
  Loader2,
  Plus,
  Minus,
  Download,
  CreditCard,
  RotateCcw,
  AlertTriangle,
  X,
  Edit2,
  FileText,
  Receipt,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  BadgeMinus,
  Check,
} from "lucide-react";
import Link from "next/link";

interface Props {
  params: Promise<{ id: string }>;
}

// ── Stat chip ─────────────────────────────────────────────────────────────────

function StatChip({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="bg-muted/30 rounded-xl p-3.5 space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className="text-base font-bold text-foreground"
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

// ── Credit note form ──────────────────────────────────────────────────────────

function CreditNoteForm({
  invoiceId,
  onDone,
}: {
  invoiceId: string;
  onDone: () => void;
}) {
  const create = useCreateCreditNote();
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  return (
    <div className="space-y-3 p-4 border border-border rounded-xl bg-muted/10">
      <p className="text-sm font-semibold text-foreground">Issue Credit Note</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            Amount
          </label>
          <input
            type="number"
            min={0}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full h-9 px-3 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            Reason
          </label>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Service not delivered"
            className="w-full h-9 px-3 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => {
            create.mutate({ invoiceId, amount: parseFloat(amount), reason });
            onDone();
          }}
          disabled={create.isPending || !amount || !reason}
          className="flex items-center gap-1 px-4 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50 transition-all"
          style={{
            backgroundColor: "var(--brand-gold)",
            color: "var(--brand-navy)",
          }}
        >
          {create.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
          Issue credit note
        </button>
        <button
          onClick={onDone}
          className="px-4 py-1.5 rounded-lg text-xs border border-border hover:bg-muted transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Debit note form ───────────────────────────────────────────────────────────

function DebitNoteForm({
  invoiceId,
  onDone,
}: {
  invoiceId: string;
  onDone: () => void;
}) {
  const create = useCreateDebitNote();
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  return (
    <div className="space-y-3 p-4 border border-border rounded-xl bg-muted/10">
      <p className="text-sm font-semibold text-foreground">Issue Debit Note</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            Amount
          </label>
          <input
            type="number"
            min={0}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full h-9 px-3 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            Reason
          </label>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Additional treatment"
            className="w-full h-9 px-3 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => {
            create.mutate({ invoiceId, amount: parseFloat(amount), reason });
            onDone();
          }}
          disabled={create.isPending || !amount || !reason}
          className="flex items-center gap-1 px-4 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50 transition-all"
          style={{
            backgroundColor: "var(--brand-gold)",
            color: "var(--brand-navy)",
          }}
        >
          {create.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
          Issue debit note
        </button>
        <button
          onClick={onDone}
          className="px-4 py-1.5 rounded-lg text-xs border border-border hover:bg-muted transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function InvoiceDetailPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();

  const { data: inv, isLoading } = useInvoice(id);
  const issueInv = useIssueInvoice();
  const voidInv = useVoidInvoice();
  const updateInv = useUpdateInvoice(id);
  const refundPay = useRefundPayment();
  const applyCredit = useApplyCreditNote();
  const voidCredit = useVoidCreditNote();
  const markDebit = useMarkDebitNotePaid();
  const voidDebit = useVoidDebitNote();

  const canRecord = usePermission("payments:record");
  const canIssue = usePermission("invoices:generate");
  const canVoid = usePermission("invoices:void");
  const canEdit = usePermission("invoices:update");
  const canCredit = usePermission("credit_notes:create");
  const canDebit = usePermission("debit_notes:create");

  const [activePanel, setActivePanel] = useState<
    "none" | "edit" | "payment" | "credit" | "debit" | "void"
  >("none");
  const [voidReason, setVoidReason] = useState("");

  const closePanel = () => setActivePanel("none");

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  if (!inv)
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Invoice not found</p>
      </div>
    );

  const isDraft = inv.status === "DRAFT";
  const isIssued = ["ISSUED", "PARTIALLY_PAID", "OVERDUE"].includes(inv.status);
  const isPaid = inv.status === "PAID";
  const isVoid = inv.status === "VOID";
  const canRecordPayment = isIssued && canRecord;
  const canEditNow = isDraft && canEdit;

  return (
    <div className="max-full mx-auto space-y-5">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Invoices
      </button>

      {/* ── Header card ── */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {/* Status stripe */}
        <div
          className={cn("h-1.5 w-full", {
            "bg-muted": isDraft,
            "bg-blue-500": isIssued,
            "bg-green-500": isPaid,
            "bg-red-400": isVoid,
          })}
        />

        <div className="p-6 space-y-5">
          {/* Invoice number + client + actions */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-bold font-mono text-foreground">
                  {inv.invoiceNumber}
                </h1>
                <InvoiceStatusBadge status={inv.status} />
              </div>
              <div className="mt-1.5 space-y-0.5">
                <p className="text-sm font-medium text-foreground">
                  {inv.client?.fullName}
                </p>
                <p className="text-xs text-muted-foreground">
                  Created {formatDate(inv.createdAt)}
                  {inv.issuedAt && ` · Issued ${formatDate(inv.issuedAt)}`}
                  {inv.dueDate && ` · Due ${formatDate(inv.dueDate)}`}
                </p>
                {inv.appointment && (
                  <Link
                    href={`/appointments/${inv.appointment.id}`}
                    className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Appointment {formatDate(inv.appointment.date)}
                  </Link>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 shrink-0">
              <PdfButton
                url={financialApi.downloadInvoicePdf(id)}
                label="PDF"
              />
              {canEditNow && activePanel !== "edit" && (
                <button
                  onClick={() => setActivePanel("edit")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border hover:bg-muted transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </button>
              )}
              {isDraft && canIssue && (
                <button
                  onClick={() => issueInv.mutate(id)}
                  disabled={issueInv.isPending}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium disabled:opacity-60 transition-all"
                  style={{
                    backgroundColor: "var(--brand-gold)",
                    color: "var(--brand-navy)",
                  }}
                >
                  {issueInv.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  Issue
                </button>
              )}
              {canRecordPayment && (
                <button
                  onClick={() =>
                    setActivePanel(
                      activePanel === "payment" ? "none" : "payment",
                    )
                  }
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all"
                  style={{
                    backgroundColor: "var(--brand-gold)",
                    color: "var(--brand-navy)",
                  }}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  Record payment
                </button>
              )}
              {!isVoid && !isPaid && canVoid && (
                <button
                  onClick={() =>
                    setActivePanel(activePanel === "void" ? "none" : "void")
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-destructive border border-destructive/30 hover:bg-destructive/5 transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" /> Void
                </button>
              )}
            </div>
          </div>

          {/* Amount stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatChip
              label="Subtotal"
              value={formatCurrency(inv.subtotal, inv.currency)}
            />
            <StatChip
              label="Discount"
              value={formatCurrency(inv.discountAmount ?? 0, inv.currency)}
              sub={
                inv.discountType
                  ? `${inv.discountType === "PERCENTAGE" ? `${inv.discountValue}%` : "Fixed"}`
                  : undefined
              }
            />
            <StatChip
              label="VAT"
              value={formatCurrency(inv.vatAmount ?? 0, inv.currency)}
              sub={inv.vatRate ? `${inv.vatRate}%` : undefined}
            />
            <StatChip
              label={
                isPaid
                  ? "Total (Paid)"
                  : isVoid
                    ? "Total (Voided)"
                    : "Total due"
              }
              value={formatCurrency(inv.totalAmount, inv.currency)}
              accent={
                isPaid ? "var(--brand-gold)" : isVoid ? undefined : undefined
              }
            />
          </div>

          {/* Outstanding */}
          {!isPaid && !isVoid && inv.amountDue > 0 && (
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/40">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  Outstanding balance
                </span>
              </div>
              <span className="text-base font-bold text-amber-700 dark:text-amber-400">
                {formatCurrency(inv.amountDue, inv.currency)}
              </span>
            </div>
          )}
          {isPaid && (
            <div className="flex items-center gap-2 p-3.5 rounded-xl bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/40">
              <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
              <span className="text-sm font-medium text-green-800 dark:text-green-300">
                Paid in full
              </span>
            </div>
          )}

          {/* ── Panels ── */}
          {activePanel === "edit" && (
            <div className="border border-border rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/20">
                <h3 className="text-sm font-semibold text-foreground">
                  Edit Invoice
                </h3>
                <button
                  onClick={closePanel}
                  className="p-1 rounded-md hover:bg-muted text-muted-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4">
                <InvoiceForm
                  invoice={inv}
                  isLoading={updateInv.isPending}
                  onCancel={closePanel}
                  onSubmit={async (data) => {
                    await updateInv.mutateAsync(data as any);
                    closePanel();
                  }}
                />
              </div>
            </div>
          )}

          {activePanel === "payment" && (
            <div className="border border-border rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/20">
                <h3 className="text-sm font-semibold text-foreground">
                  Record Payment
                </h3>
                <button
                  onClick={closePanel}
                  className="p-1 rounded-md hover:bg-muted text-muted-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4">
                <RecordPaymentForm
                  invoiceId={id}
                  amountDue={inv.amountDue}
                  currency={inv.currency}
                  onDone={closePanel}
                />
              </div>
            </div>
          )}

          {activePanel === "void" && (
            <div className="space-y-3 p-4 border border-destructive/30 rounded-xl bg-destructive/5">
              <p className="text-sm font-medium text-destructive flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> Void this invoice? This
                cannot be undone.
              </p>
              <input
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                placeholder="Reason for voiding (required)"
                className="w-full h-9 px-3 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (voidReason.trim()) {
                      voidInv.mutate({ id, reason: voidReason });
                      closePanel();
                    } else toast.error("Enter a reason");
                  }}
                  disabled={voidInv.isPending}
                  className="flex items-center gap-1 px-4 py-1.5 rounded-lg text-xs font-medium bg-destructive text-white hover:bg-destructive/90 disabled:opacity-50 transition-colors"
                >
                  {voidInv.isPending && (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  )}
                  Confirm void
                </button>
                <button
                  onClick={closePanel}
                  className="px-4 py-1.5 rounded-lg text-xs border border-border hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {activePanel === "credit" && (
            <CreditNoteForm invoiceId={id} onDone={closePanel} />
          )}

          {activePanel === "debit" && (
            <DebitNoteForm invoiceId={id} onDone={closePanel} />
          )}

          {/* Secondary actions */}
          {!isVoid && (isIssued || isPaid) && (
            <div className="flex flex-wrap gap-2 pt-1 border-t border-border/60">
              {canCredit && (
                <button
                  onClick={() =>
                    setActivePanel(activePanel === "credit" ? "none" : "credit")
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                >
                  <BadgeMinus className="w-3.5 h-3.5" /> Credit note
                </button>
              )}
              {canDebit && (
                <button
                  onClick={() =>
                    setActivePanel(activePanel === "debit" ? "none" : "debit")
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                >
                  <Plus className="w-3.5 h-3.5" /> Debit note
                </button>
              )}
              {inv.client && (
                <PdfButton
                  url={financialApi.downloadStatementPdf(inv.client.id)}
                  label="Client statement"
                  variant="ghost"
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Line items ── */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-muted/20">
          <p className="text-sm font-semibold text-foreground">Line Items</p>
          <span className="text-xs text-muted-foreground">
            {inv.lineItems?.length ?? 0} items
          </span>
        </div>

        {/* Header */}
        <div className="hidden sm:grid grid-cols-12 gap-3 px-5 py-2.5 border-b border-border/60 bg-muted/10 text-xs font-medium text-muted-foreground uppercase tracking-wide">
          <span className="col-span-6">Description</span>
          <span className="col-span-2 text-center">Qty</span>
          <span className="col-span-2 text-right">Unit price</span>
          <span className="col-span-2 text-right">Total</span>
        </div>

        <div className="divide-y divide-border/60">
          {(inv.lineItems ?? []).map((item: any, i: number) => (
            <div
              key={item.id ?? i}
              className="grid grid-cols-12 gap-3 items-center px-5 py-3.5"
            >
              <div className="col-span-12 sm:col-span-6">
                <p className="text-sm font-medium text-foreground">
                  {item.description}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  {!item.taxable && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      VAT exempt
                    </span>
                  )}
                  {item.taxable && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      Taxable
                    </span>
                  )}
                </div>
              </div>
              <div className="hidden sm:flex col-span-2 justify-center">
                <span className="text-sm text-muted-foreground">
                  {item.quantity}
                </span>
              </div>
              <div className="hidden sm:flex col-span-2 justify-end">
                <span className="text-sm text-muted-foreground">
                  {formatCurrency(item.unitPrice, inv.currency)}
                </span>
              </div>
              <div className="col-span-12 sm:col-span-2 flex justify-end">
                <span className="text-sm font-semibold text-foreground">
                  {formatCurrency(item.totalPrice, inv.currency)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Totals footer */}
        <div className="px-5 py-4 border-t border-border bg-muted/10 space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Subtotal</span>
            <span>{formatCurrency(inv.subtotal, inv.currency)}</span>
          </div>
          {(inv.discountAmount ?? 0) > 0 && (
            <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
              <span>Discount</span>
              <span>−{formatCurrency(inv.discountAmount, inv.currency)}</span>
            </div>
          )}
          {(inv.vatAmount ?? 0) > 0 && (
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>VAT ({inv.vatRate}%)</span>
              <span>{formatCurrency(inv.vatAmount, inv.currency)}</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-2 border-t border-border">
            <span className="text-base font-bold text-foreground">Total</span>
            <span
              className="text-xl font-bold"
              style={{ color: "var(--brand-gold)" }}
            >
              {formatCurrency(inv.totalAmount, inv.currency)}
            </span>
          </div>
        </div>
      </div>

      {/* ── Payments ── */}
      {(inv.payments ?? []).length > 0 && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-muted/20">
            <p className="text-sm font-semibold text-foreground">Payments</p>
            <span className="text-xs font-medium text-green-600 dark:text-green-400">
              {formatCurrency(inv.amountPaid, inv.currency)} received
            </span>
          </div>
          <div className="divide-y divide-border/60">
            {inv.payments.map((p: any) => (
              <div key={p.id} className="flex items-center gap-3 px-5 py-3.5">
                <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-foreground">
                      {formatCurrency(p.amount, p.currency)}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {p.method?.replace("_", " ")}
                    </span>
                    {p.reference && (
                      <span className="text-xs text-muted-foreground font-mono">
                        {p.reference}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDate(p.paidAt)} · {p.recordedBy?.fullName}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <PdfButton
                    url={financialApi.downloadReceiptPdf(p.id)}
                    label="Receipt"
                    variant="ghost"
                  />
                  {canRecord && (
                    <button
                      onClick={() => {
                        if (
                          confirm(
                            "Refund this payment? This action cannot be undone.",
                          )
                        )
                          refundPay.mutate({ id: p.id });
                      }}
                      className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      title="Refund payment"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Credit notes ── */}
      {(inv.creditNotes ?? []).length > 0 && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border bg-muted/20">
            <p className="text-sm font-semibold text-foreground">
              Credit Notes
            </p>
          </div>
          <div className="divide-y divide-border/60">
            {inv.creditNotes.map((credit_note: any) => (
              <div
                key={credit_note.id}
                className="flex items-center justify-between px-5 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-foreground font-mono">
                    {credit_note.creditNoteNumber}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(credit_note.issuedAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      credit_note.status === "APPLIED"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {credit_note.status}
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {formatCurrency(credit_note.amount, inv.currency)}
                  </span>
                  <PdfButton
                    url={financialApi.downloadCreditNotePdf(credit_note.id)}
                    label="PDF"
                    variant="ghost"
                  />
                  {credit_note.status === "ISSUED" && (
                    <>
                      <button
                        onClick={() =>
                          applyCredit.mutate({
                            id: credit_note.id,
                            targetInvoiceId: id,
                          })
                        }
                        disabled={applyCredit.isPending}
                        className="p-1.5 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/20 text-muted-foreground hover:text-green-600 transition-colors"
                        title="Apply to this invoice"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          const reason = prompt(
                            "Reason for voiding this credit note:",
                          );
                          if (reason)
                            voidCredit.mutate({ id: credit_note.id, reason });
                        }}
                        disabled={voidCredit.isPending}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        title="Void credit note"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Debit notes ── */}
      {(inv.debitNotes ?? []).length > 0 && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border bg-muted/20">
            <p className="text-sm font-semibold text-foreground">Debit Notes</p>
          </div>
          <div className="divide-y divide-border/60">
            {inv.debitNotes.map((dn: any) => (
              <div
                key={dn.id}
                className="flex items-center justify-between px-5 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-foreground font-mono">
                    {dn.debitNoteNumber}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(dn.issuedAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      dn.status === "PAID"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {dn.status}
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {formatCurrency(dn.amount, inv.currency)}
                  </span>
                  {dn.status === "ISSUED" && (
                    <>
                      <button
                        onClick={() => markDebit.mutate({ id: dn.id })}
                        disabled={markDebit.isPending}
                        className="p-1.5 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/20 text-muted-foreground hover:text-green-600 transition-colors"
                        title="Mark as paid"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          const reason = prompt(
                            "Reason for voiding this debit note:",
                          );
                          if (reason) voidDebit.mutate({ id: dn.id, reason });
                        }}
                        disabled={voidDebit.isPending}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        title="Void debit note"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {inv.notes && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Notes
          </p>
          <p className="text-sm text-foreground whitespace-pre-wrap">
            {inv.notes}
          </p>
        </div>
      )}
    </div>
  );
}
