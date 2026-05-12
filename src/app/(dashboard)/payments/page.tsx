// src/app/(dashboard)/payments/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePaymentList } from "@/features/financial/hooks/useFinancial";
import { Pagination } from "@/components/ui/Pagination";
import { PdfButton } from "@/features/financial/components/PdfButton";
import financialApi from "@/lib/api/financial";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import {
  Search,
  X,
  CreditCard,
  ChevronRight,
  TrendingUp,
  Smartphone,
  Banknote,
  Building2,
  FileCheck,
  ShieldCheck,
  HelpCircle,
} from "lucide-react";

const LIMIT = 20;

const METHOD_FILTERS = [
  { value: "", label: "All methods" },
  { value: "CASH", label: "Cash" },
  { value: "MPESA", label: "M-Pesa" },
  { value: "CARD", label: "Card" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "INSURANCE", label: "Insurance" },
  { value: "OTHER", label: "Other" },
];

const METHOD_ICON: Record<string, React.ElementType> = {
  CASH: Banknote,
  MPESA: Smartphone,
  CARD: CreditCard,
  BANK_TRANSFER: Building2,
  CHEQUE: FileCheck,
  INSURANCE: ShieldCheck,
  OTHER: HelpCircle,
};

const METHOD_COLOUR: Record<string, string> = {
  CASH: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  MPESA:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  CARD: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  BANK_TRANSFER:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  CHEQUE:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  INSURANCE:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  OTHER: "bg-muted text-muted-foreground",
};

function MethodBadge({ method }: { method: string }) {
  const Icon = METHOD_ICON[method] ?? HelpCircle;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium",
        METHOD_COLOUR[method] ?? METHOD_COLOUR.OTHER,
      )}
    >
      <Icon className="w-3 h-3" />
      {method.replace("_", " ")}
    </span>
  );
}

export default function PaymentsPage() {
  const router = useRouter();
  const [method, setMethod] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading } = usePaymentList({
    method: method || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    page,
    limit: LIMIT,
  });

  const payments = data?.data ?? [];
  const meta = data?.meta;

  // Summary from current page — full aggregation comes from backend revenue summary
  const totalKes = payments.reduce(
    (s: number, p: any) => s + Number(p.amountKes ?? p.amount ?? 0),
    0,
  );

  const activeFilters = [method, dateFrom, dateTo].filter(Boolean).length;
  const clearFilters = () => {
    setMethod("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Payments</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {meta?.total ?? payments.length} transactions
            {meta && ` · `}
            {meta && (
              <span className="font-medium text-foreground">
                {formatCurrency(totalKes, "KES")} on this page
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={cn(
            "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium border transition-all",
            showFilters || activeFilters > 0
              ? "border-primary/50 text-primary bg-primary/5"
              : "border-border text-muted-foreground hover:bg-muted",
          )}
        >
          Filters
          {activeFilters > 0 && (
            <span
              className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center"
              style={{
                backgroundColor: "var(--brand-gold)",
                color: "var(--brand-navy)",
              }}
            >
              {activeFilters}
            </span>
          )}
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-muted/20 rounded-xl border border-border p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Payment method
              </label>
              <select
                value={method}
                onChange={(e) => {
                  setMethod(e.target.value);
                  setPage(1);
                }}
                className="w-full h-9 px-2.5 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none cursor-pointer"
              >
                {METHOD_FILTERS.map((m) => (
                  <option
                    key={m.value}
                    value={m.value}
                  >
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                From date
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
                className="w-full h-9 px-2.5 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                To date
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
                className="w-full h-9 px-2.5 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none"
              />
            </div>
          </div>
          {activeFilters > 0 && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Clear filters
            </button>
          )}
        </div>
      )}

      {/* Method quick-filter pills */}
      <div className="flex flex-wrap gap-2">
        {METHOD_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => {
              setMethod(value);
              setPage(1);
            }}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
              method === value
                ? "border-transparent text-brand-navy shadow-sm"
                : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground",
            )}
            style={
              method === value
                ? { backgroundColor: "var(--brand-gold)" }
                : undefined
            }
          >
            {label}
          </button>
        ))}
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
                  <div className="h-4 w-44 bg-muted rounded" />
                  <div className="h-3 w-32 bg-muted/60 rounded" />
                </div>
                <div className="w-20 h-5 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center">
              <CreditCard className="w-7 h-7 text-muted-foreground/40" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                No payments found
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {activeFilters > 0
                  ? "Try adjusting your filters"
                  : "Payments recorded against invoices will appear here"}
              </p>
            </div>
            {activeFilters > 0 && (
              <button
                onClick={clearFilters}
                className="text-xs hover:underline"
                style={{ color: "var(--brand-gold)" }}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Column headers */}
            <div className="hidden sm:grid grid-cols-12 gap-3 px-4 py-2.5 bg-muted/30 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wide">
              <span className="col-span-4">Client / Invoice</span>
              <span className="col-span-2">Method</span>
              <span className="col-span-2">Date</span>
              <span className="col-span-2 text-right">Amount</span>
              <span className="col-span-2 text-right">KES equiv.</span>
            </div>

            <div className="divide-y divide-border">
              {payments.map((p: any) => {
                const Icon = METHOD_ICON[p.method] ?? HelpCircle;
                return (
                  <div
                    key={p.id}
                    className="grid grid-cols-12 gap-3 items-center px-4 py-3.5 hover:bg-muted/20 transition-colors group"
                  >
                    {/* Client + invoice */}
                    <div className="col-span-12 sm:col-span-4 flex items-center gap-3">
                      <div
                        className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                          METHOD_COLOUR[p.method] ?? METHOD_COLOUR.OTHER,
                        )}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {p.invoice?.client?.fullName ?? "—"}
                        </p>
                        <button
                          onClick={() =>
                            router.push(`/invoices/${p.invoiceId}`)
                          }
                          className="text-xs text-primary hover:underline font-mono truncate block text-left"
                        >
                          {p.invoice?.invoiceNumber}
                        </button>
                      </div>
                    </div>

                    {/* Method */}
                    <div className="hidden sm:flex col-span-2 items-center gap-2">
                      <MethodBadge method={p.method} />
                      {p.reference && (
                        <span
                          className="text-[10px] text-muted-foreground font-mono truncate max-w-[60px]"
                          title={p.reference}
                        >
                          {p.reference}
                        </span>
                      )}
                    </div>

                    {/* Date */}
                    <div className="hidden sm:block col-span-2">
                      <p className="text-xs text-foreground">
                        {formatDate(p.paidAt)}
                      </p>
                      {p.recordedBy && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {p.recordedBy.fullName}
                        </p>
                      )}
                    </div>

                    {/* Amount */}
                    <div className="hidden sm:block col-span-2 text-right">
                      <p className="text-sm font-semibold text-foreground">
                        {formatCurrency(p.amount, p.currency)}
                      </p>
                    </div>

                    {/* KES equiv */}
                    <div className="hidden sm:flex col-span-2 items-center justify-end gap-2">
                      {p.currency !== "KES" ? (
                        <div className="text-right">
                          <p className="text-xs font-medium text-muted-foreground">
                            {formatCurrency(p.amountKes, "KES")}
                          </p>
                          {p.exchangeRateUsed && (
                            <p className="text-[10px] text-muted-foreground">
                              @{Number(p.exchangeRateUsed).toFixed(2)}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                      <PdfButton
                        url={financialApi.downloadReceiptPdf(p.id)}
                        label=""
                        variant="ghost"
                        className="p-1.5"
                      />
                    </div>

                    {/* Mobile fallback */}
                    <div className="sm:hidden col-span-12 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MethodBadge method={p.method} />
                        <span className="text-xs text-muted-foreground">
                          {formatDate(p.paidAt)}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-foreground">
                        {formatCurrency(p.amount, p.currency)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
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
