"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useInvoiceList } from "@/features/financial/hooks/useFinancial";
import { InvoiceStatusBadge } from "@/features/financial/components/StatusBadge";
import { Pagination } from "@/components/ui/Pagination";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { Search, X, FileText, ChevronRight } from "lucide-react";

const LIMIT = 20;

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "DRAFT", label: "Draft" },
  { value: "ISSUED", label: "Issued" },
  { value: "PARTIALLY_PAID", label: "Partial" },
  { value: "PAID", label: "Paid" },
  { value: "OVERDUE", label: "Overdue" },
  { value: "VOID", label: "Void" },
];

export default function InvoicesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useInvoiceList({
    search: search || undefined,
    status: status || undefined,
    page,
    limit: LIMIT,
  });
  const invoices = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search invoice or client…"
            className="h-9 pl-8 pr-3 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 w-56"
          />
          {search && (
            <button
              onClick={() => {
                setSearch("");
                setPage(1);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center bg-muted rounded-lg p-1">
          {STATUS_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => {
                setStatus(value);
                setPage(1);
              }}
              className={cn(
                "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                status === value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <span className="text-xs text-muted-foreground">
          {meta?.total ?? invoices.length} invoices
        </span>
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
                <div className="w-8 h-8 rounded-lg bg-muted shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 bg-muted rounded" />
                  <div className="h-3 w-28 bg-muted/60 rounded" />
                </div>
                <div className="w-20 h-6 bg-muted rounded-full" />
                <div className="w-16 h-4 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2">
            <FileText className="w-10 h-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No invoices found</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {invoices.map((inv: any) => (
              <button
                key={inv.id}
                onClick={() => router.push(`/invoices/${inv.id}`)}
                className="w-full flex items-center gap-4 px-4 py-3.5 text-left hover:bg-muted/20 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground font-mono">
                      {inv.invoiceNumber}
                    </span>
                    <InvoiceStatusBadge status={inv.status} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {inv.client?.fullName} · {formatDate(inv.createdAt)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-foreground">
                    {formatCurrency(inv.totalAmount, inv.currency)}
                  </p>
                  {inv.amountDue > 0 && inv.status !== "DRAFT" && (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      {formatCurrency(inv.amountDue, inv.currency)} due
                    </p>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </button>
            ))}
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
