"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuoteList } from "@/features/financial/hooks/useFinancial";
import { QuoteStatusBadge } from "@/features/financial/components/StatusBadge";
import { Pagination } from "@/components/ui/Pagination";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { Search, X, FileText, ChevronRight, Plus, Clock } from "lucide-react";

const LIMIT = 20;

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "DRAFT", label: "Draft" },
  { value: "SENT", label: "Sent" },
  { value: "ACCEPTED", label: "Accepted" },
  { value: "DECLINED", label: "Declined" },
  { value: "EXPIRED", label: "Expired" },
  { value: "CONVERTED", label: "Converted" },
];

export default function QuotesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuoteList({
    search: search || undefined,
    status: status || undefined,
    page,
    limit: LIMIT,
  });

  const quotes = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Quotes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {meta?.total ?? quotes.length} quotes
          </p>
        </div>
        <button
          onClick={() => router.push("/quotes/new")}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium shadow-sm transition-all hover:shadow-md"
          style={{
            backgroundColor: "var(--brand-gold)",
            color: "var(--brand-navy)",
          }}
        >
          <Plus className="w-4 h-4" /> New Quote
        </button>
      </div>

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
            placeholder="Quote number or client…"
            className="h-9 pl-8 pr-3 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 w-56"
          />
          {search && (
            <button
              onClick={() => {
                setSearch("");
                setPage(1);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center bg-muted rounded-xl p-1 gap-0.5 overflow-x-auto">
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
      </div>

      {/* List */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-4 animate-pulse"
              >
                <div className="w-9 h-9 rounded-xl bg-muted shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-44 bg-muted rounded" />
                  <div className="h-3 w-32 bg-muted/60 rounded" />
                </div>
                <div className="w-20 h-6 bg-muted rounded-full" />
                <div className="w-20 h-4 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : quotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center">
              <FileText className="w-7 h-7 text-muted-foreground/40" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                No quotes found
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {search || status
                  ? "Try adjusting your filters"
                  : "Create your first quote"}
              </p>
            </div>
            {!search && !status && (
              <button
                onClick={() => router.push("/quotes/new")}
                className="text-xs font-medium hover:underline"
                style={{ color: "var(--brand-gold)" }}
              >
                <Plus className="w-3.5 h-3.5 inline mr-1" />
                Create quote
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="hidden sm:grid grid-cols-12 gap-3 px-4 py-2.5 bg-muted/30 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wide">
              <span className="col-span-4">Quote / Client</span>
              <span className="col-span-2">Date</span>
              <span className="col-span-2">Status</span>
              <span className="col-span-2 text-right">Amount</span>
              <span className="col-span-2 text-right">Expires</span>
            </div>
            <div className="divide-y divide-border">
              {quotes.map((q: any) => {
                const isExpiringSoon =
                  q.expiresAt &&
                  q.status === "SENT" &&
                  new Date(q.expiresAt) < new Date(Date.now() + 3 * 86_400_000);
                return (
                  <button
                    key={q.id}
                    onClick={() => router.push(`/quotes/${q.id}`)}
                    className="w-full grid grid-cols-12 gap-3 items-center px-4 py-3.5 text-left hover:bg-muted/20 transition-colors group"
                  >
                    <div className="col-span-12 sm:col-span-4 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-muted/60 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground font-mono truncate">
                          {q.quoteNumber}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {q.client?.fullName}
                        </p>
                      </div>
                    </div>
                    <div className="hidden sm:block col-span-2">
                      <p className="text-xs text-muted-foreground">
                        {formatDate(q.createdAt)}
                      </p>
                      {q.sentAt && (
                        <p className="text-xs text-muted-foreground">
                          Sent {formatDate(q.sentAt)}
                        </p>
                      )}
                    </div>
                    <div className="hidden sm:flex col-span-2 items-center">
                      <QuoteStatusBadge status={q.status} />
                    </div>
                    <div className="hidden sm:block col-span-2 text-right">
                      <p className="text-sm font-semibold text-foreground">
                        {formatCurrency(q.totalAmount, q.currency)}
                      </p>
                    </div>
                    <div className="hidden sm:flex col-span-2 items-center justify-end gap-2">
                      {q.expiresAt && (
                        <span
                          className={cn(
                            "text-xs flex items-center gap-1",
                            isExpiringSoon
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-muted-foreground",
                          )}
                        >
                          {isExpiringSoon && <Clock className="w-3 h-3" />}
                          {formatDate(q.expiresAt)}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
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
