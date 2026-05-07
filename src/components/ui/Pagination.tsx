"use client";

import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  // Build page numbers to show: always show first, last, current ± 1, with ellipsis
  const pages: (number | "ellipsis")[] = [];
  const range = new Set(
    [1, totalPages, page - 1, page, page + 1].filter(
      (n) => n >= 1 && n <= totalPages,
    ),
  );
  const sorted = Array.from(range).sort((a, b) => a - b);

  sorted.forEach((n, i) => {
    if (i > 0 && n - sorted[i - 1] > 1) pages.push("ellipsis");
    pages.push(n);
  });

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 flex-wrap",
        className,
      )}
    >
      <p className="text-xs text-muted-foreground shrink-0">
        Showing{" "}
        <span className="font-medium text-foreground">
          {from}–{to}
        </span>{" "}
        of <span className="font-medium text-foreground">{total}</span>
      </p>

      <div className="flex items-center gap-1">
        {/* First */}
        <button
          onClick={() => onPageChange(1)}
          disabled={page === 1}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground disabled:opacity-40 disabled:cursor-not-allowed"
          title="First page"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </button>

        {/* Prev */}
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Page numbers */}
        {pages.map((p, i) =>
          p === "ellipsis" ? (
            <span
              key={`el-${i}`}
              className="px-1 text-xs text-muted-foreground"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className={cn(
                "min-w-[28px] h-7 px-1.5 rounded-lg text-xs font-medium transition-colors",
                page === p
                  ? "text-brand-navy font-semibold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
              style={
                page === p
                  ? { backgroundColor: "var(--brand-gold)" }
                  : undefined
              }
            >
              {p}
            </button>
          ),
        )}

        {/* Next */}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {/* Last */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={page === totalPages}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground disabled:opacity-40 disabled:cursor-not-allowed"
          title="Last page"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
