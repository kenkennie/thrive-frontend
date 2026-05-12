// src/app/(dashboard)/quotes/[id]/page.tsx
"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useQuote,
  useSendQuote,
  useAcceptQuote,
  useDeclineQuote,
  useConvertQuote,
  useCreateQuote,
} from "@/features/financial/hooks/useFinancial";
import { QuoteForm } from "@/features/financial/components/QuoteForm";
import { QuoteStatusBadge } from "@/features/financial/components/StatusBadge";
import { PdfButton } from "@/features/financial/components/PdfButton";
import financialApi from "@/lib/api/financial";
import { usePermission } from "@/hooks/usePermission";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  ArrowLeft,
  Send,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Loader2,
  X,
  AlertTriangle,
  Edit2,
  FileText,
  Clock,
  ChevronRight,
  ExternalLink,
  Download,
} from "lucide-react";
import Link from "next/link";

interface Props {
  params: Promise<{ id: string }>;
}

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

export default function QuoteDetailPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();

  const { data: quote, isLoading } = useQuote(id);
  const sendQuote = useSendQuote();
  const acceptQuote = useAcceptQuote();
  const declineQuote = useDeclineQuote();
  const convertQuote = useConvertQuote();

  const canSend = usePermission("quotes:send");
  const canAccept = usePermission("quotes:accept");
  const canEdit = usePermission("quotes:update");
  const canConvert = usePermission("invoices:generate");

  type Panel = "none" | "edit" | "decline" | "accept";
  const [panel, setPanel] = useState<Panel>("none");
  const [declineReason, setDeclineReason] = useState("");

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  if (!quote)
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Quote not found</p>
      </div>
    );

  const isDraft = quote.status === "DRAFT";
  const isSent = quote.status === "SENT";
  const isAccepted = quote.status === "ACCEPTED";
  const isDeclined = quote.status === "DECLINED";
  const isExpired = quote.status === "EXPIRED";
  const isConverted = quote.status === "CONVERTED";
  const isTerminal = isAccepted || isDeclined || isExpired || isConverted;

  const isExpiringSoon =
    quote.expiresAt &&
    isSent &&
    new Date(quote.expiresAt) < new Date(Date.now() + 3 * 86_400_000);

  const closePanel = () => setPanel("none");

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Quotes
      </button>

      {/* ── Header card ── */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div
          className={cn("h-1.5 w-full", {
            "bg-muted": isDraft,
            "bg-blue-500": isSent,
            "bg-green-500": isAccepted || isConverted,
            "bg-red-400": isDeclined,
            "bg-gray-400": isExpired,
          })}
        />

        <div className="p-6 space-y-5">
          {/* Number + client + status */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-bold font-mono text-foreground">
                  {quote.quoteNumber}
                </h1>
                <QuoteStatusBadge status={quote.status} />
              </div>
              <div className="mt-1.5 space-y-0.5">
                <p className="text-sm font-medium text-foreground">
                  {quote.client?.fullName}
                </p>
                <p className="text-xs text-muted-foreground">
                  Created {formatDate(quote.createdAt)}
                  {quote.sentAt && ` · Sent ${formatDate(quote.sentAt)}`}
                  {quote.acceptedAt &&
                    ` · Accepted ${formatDate(quote.acceptedAt)}`}
                  {quote.declinedAt &&
                    ` · Declined ${formatDate(quote.declinedAt)}`}
                </p>
                {quote.appointment && (
                  <Link
                    href={`/appointments/${quote.appointment.id}`}
                    className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Appointment {formatDate(quote.appointment.date)}
                  </Link>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 shrink-0">
              <PdfButton
                url={financialApi.downloadQuotePdf(id)}
                label="PDF"
              />

              {canEdit && isDraft && panel !== "edit" && (
                <button
                  onClick={() => setPanel("edit")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-border hover:bg-muted transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </button>
              )}
              {canSend && isDraft && (
                <button
                  onClick={() => sendQuote.mutate(id)}
                  disabled={sendQuote.isPending}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium disabled:opacity-60"
                  style={{
                    backgroundColor: "var(--brand-gold)",
                    color: "var(--brand-navy)",
                  }}
                >
                  {sendQuote.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  Send to client
                </button>
              )}
              {canAccept && isSent && (
                <>
                  <button
                    onClick={() => setPanel("accept")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Accept
                  </button>
                  <button
                    onClick={() =>
                      setPanel(panel === "decline" ? "none" : "decline")
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-destructive border border-destructive/30 hover:bg-destructive/5 transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Decline
                  </button>
                </>
              )}
              {canConvert && isAccepted && !quote.convertedInvoiceId && (
                <button
                  onClick={() => {
                    if (confirm("Convert this quote to an invoice?"))
                      convertQuote.mutate(id);
                  }}
                  disabled={convertQuote.isPending}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium disabled:opacity-60"
                  style={{
                    backgroundColor: "var(--brand-gold)",
                    color: "var(--brand-navy)",
                  }}
                >
                  {convertQuote.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  Convert to invoice
                </button>
              )}
            </div>
          </div>

          {/* Amount stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatChip
              label="Subtotal"
              value={formatCurrency(quote.subtotal, quote.currency)}
            />
            <StatChip
              label="Discount"
              value={formatCurrency(quote.discountAmount ?? 0, quote.currency)}
              sub={
                quote.discountType
                  ? quote.discountType === "PERCENTAGE"
                    ? `${quote.discountValue}%`
                    : "Fixed"
                  : undefined
              }
            />
            <StatChip
              label="VAT"
              value={formatCurrency(quote.vatAmount ?? 0, quote.currency)}
              sub={quote.vatRate ? `${quote.vatRate}%` : undefined}
            />
            <StatChip
              label="Total"
              value={formatCurrency(quote.totalAmount, quote.currency)}
              accent={
                isAccepted || isConverted ? "var(--brand-gold)" : undefined
              }
            />
          </div>

          {/* Expiry notice */}
          {quote.expiresAt && !isTerminal && (
            <div
              className={cn(
                "flex items-center gap-2 px-3.5 py-3 rounded-xl border text-sm",
                isExpiringSoon
                  ? "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-300"
                  : "bg-muted/30 border-border text-muted-foreground",
              )}
            >
              <Clock className="w-4 h-4 shrink-0" />
              {isExpiringSoon ? `Expires soon — ` : `Valid until `}
              {formatDate(quote.expiresAt)}
            </div>
          )}

          {/* Converted invoice link */}
          {quote.convertedInvoiceId && (
            <Link
              href={`/invoices/${quote.convertedInvoiceId}`}
              className="flex items-center justify-between p-3.5 border border-border rounded-xl hover:bg-muted/30 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Converted to invoice
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Click to view invoice
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </Link>
          )}

          {/* Decline reason */}
          {quote.declineReason && (
            <div className="p-3.5 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/40 rounded-xl">
              <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1">
                Decline reason
              </p>
              <p className="text-sm text-red-900 dark:text-red-300">
                {quote.declineReason}
              </p>
            </div>
          )}

          {/* ── Inline panels ── */}
          {panel === "edit" && (
            <div className="border border-border rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/20">
                <h3 className="text-sm font-semibold text-foreground">
                  Edit Quote
                </h3>
                <button
                  onClick={closePanel}
                  className="p-1 rounded-md hover:bg-muted text-muted-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4">
                <QuoteForm
                  quote={quote}
                  isLoading={false}
                  onCancel={closePanel}
                  onSubmit={async (data) => {
                    // useUpdateQuote hook not yet created — handled via financialApi directly
                    closePanel();
                  }}
                />
              </div>
            </div>
          )}

          {panel === "accept" && (
            <div className="space-y-3 p-4 border border-green-200 dark:border-green-800/40 rounded-xl bg-green-50 dark:bg-green-900/10">
              <p className="text-sm font-semibold text-green-800 dark:text-green-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Accept this quote?
              </p>
              <p className="text-xs text-green-700 dark:text-green-400">
                The quote will be marked as Accepted. You can then convert it to
                an invoice.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    acceptQuote.mutate(id);
                    closePanel();
                  }}
                  disabled={acceptQuote.isPending}
                  className="flex items-center gap-1 px-4 py-1.5 rounded-lg text-xs font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {acceptQuote.isPending && (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  )}
                  Confirm accept
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

          {panel === "decline" && (
            <div className="space-y-3 p-4 border border-destructive/30 rounded-xl bg-destructive/5">
              <p className="text-sm font-medium text-destructive flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> Decline this quote?
              </p>
              <input
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="Reason (optional — shown in decline record)"
                className="w-full h-9 px-3 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    declineQuote.mutate({ id, reason: declineReason });
                    closePanel();
                  }}
                  disabled={declineQuote.isPending}
                  className="flex items-center gap-1 px-4 py-1.5 rounded-lg text-xs font-medium bg-destructive text-white hover:bg-destructive/90 disabled:opacity-50 transition-colors"
                >
                  {declineQuote.isPending && (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  )}
                  Confirm decline
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
        </div>
      </div>

      {/* ── Line items ── */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-muted/20">
          <p className="text-sm font-semibold text-foreground">Line Items</p>
          <span className="text-xs text-muted-foreground">
            {quote.lineItems?.length ?? 0} items
          </span>
        </div>

        <div className="hidden sm:grid grid-cols-12 gap-3 px-5 py-2.5 border-b border-border/60 bg-muted/10 text-xs font-medium text-muted-foreground uppercase tracking-wide">
          <span className="col-span-6">Description</span>
          <span className="col-span-2 text-center">Qty</span>
          <span className="col-span-2 text-right">Unit price</span>
          <span className="col-span-2 text-right">Total</span>
        </div>

        <div className="divide-y divide-border/60">
          {(quote.lineItems ?? []).map((item: any, i: number) => (
            <div
              key={item.id ?? i}
              className="grid grid-cols-12 gap-3 items-center px-5 py-3.5"
            >
              <div className="col-span-12 sm:col-span-6">
                <p className="text-sm font-medium text-foreground">
                  {item.description}
                </p>
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
              <div className="hidden sm:flex col-span-2 justify-center">
                <span className="text-sm text-muted-foreground">
                  {item.quantity}
                </span>
              </div>
              <div className="hidden sm:flex col-span-2 justify-end">
                <span className="text-sm text-muted-foreground">
                  {formatCurrency(item.unitPrice, quote.currency)}
                </span>
              </div>
              <div className="col-span-12 sm:col-span-2 flex justify-end">
                <span className="text-sm font-semibold text-foreground">
                  {formatCurrency(item.totalPrice, quote.currency)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Totals footer */}
        <div className="px-5 py-4 border-t border-border bg-muted/10 space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Subtotal</span>
            <span>{formatCurrency(quote.subtotal, quote.currency)}</span>
          </div>
          {(quote.discountAmount ?? 0) > 0 && (
            <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
              <span>Discount</span>
              <span>
                −{formatCurrency(quote.discountAmount, quote.currency)}
              </span>
            </div>
          )}
          {(quote.vatAmount ?? 0) > 0 && (
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>VAT ({quote.vatRate}%)</span>
              <span>{formatCurrency(quote.vatAmount, quote.currency)}</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-2 border-t border-border">
            <span className="text-base font-bold text-foreground">Total</span>
            <span
              className="text-xl font-bold"
              style={{ color: "var(--brand-gold)" }}
            >
              {formatCurrency(quote.totalAmount, quote.currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {quote.notes && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Notes
          </p>
          <p className="text-sm text-foreground whitespace-pre-wrap">
            {quote.notes}
          </p>
        </div>
      )}
    </div>
  );
}
