"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useInvoice,
  useIssueInvoice,
  useVoidInvoice,
  useApplyDiscount,
  useCreateCreditNote,
  useCreateDebitNote,
  useRefundPayment,
} from "@/features/financial/hooks/useFinancial";
import { RecordPaymentForm } from "@/features/financial/components/RecordPaymentForm";
import { InvoiceStatusBadge } from "@/features/financial/components/StatusBadge";
import { PdfButton } from "@/features/financial/components/PdfButton";
import financialApi from "@/lib/api/financial";
import { usePermission } from "@/hooks/usePermission";
import { formatCurrency, formatDate, formatTime, cn } from "@/lib/utils";
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
} from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

// ── Discount form ─────────────────────────────────────────────────────────────

function DiscountForm({
  invoiceId,
  onDone,
}: {
  invoiceId: string;
  onDone: () => void;
}) {
  const apply = useApplyDiscount();
  const [type, setType] = useState<"PERCENT" | "FIXED">("PERCENT");
  const [value, setValue] = useState("");

  return (
    <div className="flex items-end gap-2 p-4 border border-border rounded-xl bg-muted/10">
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Type
        </label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as any)}
          className="h-9 px-2 text-sm rounded-lg border border-input bg-background focus:outline-none cursor-pointer"
        >
          <option value="PERCENT">% Percent</option>
          <option value="FIXED">KES Fixed</option>
        </select>
      </div>
      <div className="space-y-1.5 flex-1">
        <label className="text-xs font-medium text-muted-foreground">
          Value
        </label>
        <input
          type="number"
          min={0}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={type === "PERCENT" ? "0–100" : "0.00"}
          className="w-full h-9 px-3 text-sm rounded-lg border border-input bg-background focus:outline-none"
        />
      </div>
      <button
        onClick={() => {
          apply.mutate({ id: invoiceId, type, value: parseFloat(value) });
          onDone();
        }}
        disabled={apply.isPending || !value}
        className="h-9 px-4 rounded-lg text-xs font-medium disabled:opacity-50"
        style={{
          backgroundColor: "var(--brand-gold)",
          color: "var(--brand-navy)",
        }}
      >
        {apply.isPending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          "Apply"
        )}
      </button>
      <button
        onClick={onDone}
        className="h-9 px-2 text-muted-foreground hover:text-foreground"
      >
        <X className="w-4 h-4" />
      </button>
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
      <p className="text-sm font-medium text-foreground">Issue Credit Note</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            Amount
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full h-9 px-3 text-sm rounded-lg border border-input bg-background focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            Reason
          </label>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full h-9 px-3 text-sm rounded-lg border border-input bg-background focus:outline-none"
            placeholder="Reason for credit"
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
          className="px-4 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50"
          style={{
            backgroundColor: "var(--brand-gold)",
            color: "var(--brand-navy)",
          }}
        >
          {create.isPending ? (
            <Loader2 className="w-3 h-3 animate-spin inline mr-1" />
          ) : null}
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

// ─────────────────────────────────────────────────────────────────────────────

export default function InvoiceDetailPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();

  const { data: inv, isLoading } = useInvoice(id);
  const issueInv = useIssueInvoice();
  const voidInv = useVoidInvoice();
  const refundPay = useRefundPayment();

  const canRecord = usePermission("payments:record");
  const canIssue = usePermission("invoices:generate");
  const canVoid = usePermission("invoices:void");
  const canCredit = usePermission("credit_notes:create");

  const [showPayment, setShowPayment] = useState(false);
  const [showDiscount, setShowDiscount] = useState(false);
  const [showCredit, setShowCredit] = useState(false);
  const [voidReason, setVoidReason] = useState("");
  const [showVoid, setShowVoid] = useState(false);

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

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Invoices
      </button>

      {/* Header */}
      <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-bold font-mono text-foreground">
                {inv.invoiceNumber}
              </h1>
              <InvoiceStatusBadge status={inv.status} />
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {inv.client?.fullName} · {formatDate(inv.createdAt)}
              {inv.dueDate && ` · Due ${formatDate(inv.dueDate)}`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <PdfButton
              url={financialApi.downloadInvoicePdf(id)}
              label="PDF"
            />
            {!isVoid && !isPaid && canIssue && isDraft && (
              <button
                onClick={() => issueInv.mutate(id)}
                disabled={issueInv.isPending}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium disabled:opacity-60"
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
            {!isVoid && canVoid && !isPaid && (
              <button
                onClick={() => setShowVoid(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-destructive border border-destructive/30 hover:bg-destructive/5 transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" />
                Void
              </button>
            )}
          </div>
        </div>

        {/* Amounts */}
        <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border/60">
          {[
            {
              label: "Subtotal",
              value: formatCurrency(inv.subtotal, inv.currency),
            },
            {
              label: "VAT",
              value: formatCurrency(inv.vatAmount, inv.currency),
            },
            {
              label: "Discount",
              value: formatCurrency(inv.discountAmount ?? 0, inv.currency),
            },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="bg-muted/30 rounded-xl p-3"
            >
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-sm font-semibold text-foreground">{value}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-1">
          <div>
            <p className="text-2xl font-bold text-foreground">
              {formatCurrency(inv.totalAmount, inv.currency)}
            </p>
            {inv.amountDue > 0 && !isVoid && (
              <p className="text-sm text-amber-600 dark:text-amber-400 mt-0.5">
                {formatCurrency(inv.amountDue, inv.currency)} outstanding
              </p>
            )}
            {isPaid && (
              <p className="text-sm text-green-600 dark:text-green-400 mt-0.5">
                Paid in full
              </p>
            )}
          </div>

          {/* Actions on issued invoice */}
          {!isVoid && (
            <div className="flex flex-wrap gap-2">
              {isDraft && canRecord && (
                <button
                  onClick={() => setShowDiscount(!showDiscount)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-2.5 py-1.5 transition-colors"
                >
                  <Minus className="w-3 h-3" /> Discount
                </button>
              )}
              {isIssued && canRecord && (
                <button
                  onClick={() => setShowPayment(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium"
                  style={{
                    backgroundColor: "var(--brand-gold)",
                    color: "var(--brand-navy)",
                  }}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  Record payment
                </button>
              )}
              {(isIssued || isPaid) && canCredit && (
                <button
                  onClick={() => setShowCredit(!showCredit)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-2.5 py-1.5 transition-colors"
                >
                  <Plus className="w-3 h-3" /> Credit note
                </button>
              )}
            </div>
          )}
        </div>

        {/* Void form */}
        {showVoid && (
          <div className="space-y-3 p-4 border border-destructive/30 rounded-xl bg-destructive/5">
            <p className="text-sm font-medium text-destructive flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" /> Void this invoice?
            </p>
            <input
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              placeholder="Reason for voiding"
              className="w-full h-9 px-3 text-sm rounded-lg border border-input bg-background focus:outline-none"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  voidInv.mutate({ id, reason: voidReason });
                  setShowVoid(false);
                }}
                disabled={voidInv.isPending}
                className="px-4 py-1.5 rounded-lg text-xs bg-destructive text-white hover:bg-destructive/90 disabled:opacity-50"
              >
                Confirm void
              </button>
              <button
                onClick={() => setShowVoid(false)}
                className="px-4 py-1.5 rounded-lg text-xs border border-border hover:bg-muted transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Discount form */}
        {showDiscount && (
          <DiscountForm
            invoiceId={id}
            onDone={() => setShowDiscount(false)}
          />
        )}
        {showCredit && (
          <CreditNoteForm
            invoiceId={id}
            onDone={() => setShowCredit(false)}
          />
        )}
      </div>

      {/* Record payment drawer */}
      {showPayment && (
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">
              Record Payment
            </h2>
            <button
              onClick={() => setShowPayment(false)}
              className="p-1 rounded-md hover:bg-muted text-muted-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <RecordPaymentForm
            invoiceId={id}
            amountDue={inv.amountDue}
            currency={inv.currency}
            onDone={() => setShowPayment(false)}
          />
        </div>
      )}

      {/* Line items */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border bg-muted/20">
          <p className="text-sm font-semibold text-foreground">Line Items</p>
        </div>
        <div className="divide-y divide-border/60">
          {(inv.lineItems ?? []).map((item: any) => (
            <div
              key={item.id}
              className="flex items-center gap-3 px-5 py-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {item.description}
                </p>
                {item.service && (
                  <p className="text-xs text-muted-foreground">
                    {item.service.name}
                    {item.variant ? ` — ${item.variant.name}` : ""}
                  </p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-foreground">
                  {formatCurrency(item.totalPrice, inv.currency)}
                </p>
                {item.quantity > 1 && (
                  <p className="text-xs text-muted-foreground">
                    {item.quantity} ×{" "}
                    {formatCurrency(item.unitPrice, inv.currency)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payments */}
      {(inv.payments ?? []).length > 0 && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border bg-muted/20">
            <p className="text-sm font-semibold text-foreground">Payments</p>
          </div>
          <div className="divide-y divide-border/60">
            {inv.payments.map((p: any) => (
              <div
                key={p.id}
                className="flex items-center gap-3 px-5 py-3"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {formatCurrency(p.amount, p.currency)}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {p.method.replace("_", " ")}
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
                <div className="flex items-center gap-2 shrink-0">
                  <PdfButton
                    url={financialApi.downloadReceiptPdf(p.id)}
                    label="Receipt"
                    variant="ghost"
                  />
                  {canRecord && (
                    <button
                      onClick={() => {
                        if (confirm("Refund this payment?"))
                          refundPay.mutate({ id: p.id });
                      }}
                      className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
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

      {/* Client statement */}
      {inv.client && (
        <div className="flex justify-end">
          <PdfButton
            url={financialApi.downloadStatementPdf(inv.client.id)}
            label="Client statement"
            variant="ghost"
          />
        </div>
      )}
    </div>
  );
}
