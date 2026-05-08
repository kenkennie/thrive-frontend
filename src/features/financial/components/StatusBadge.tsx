import { cn } from "@/lib/utils";

const INVOICE_STATUS: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  ISSUED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  PARTIALLY_PAID:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  PAID: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  VOID: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500",
  OVERDUE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const QUOTE_STATUS: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  SENT: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  ACCEPTED:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  DECLINED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  EXPIRED: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500",
  CONVERTED:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

export function InvoiceStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        INVOICE_STATUS[status] ?? "bg-muted text-muted-foreground",
      )}
    >
      {status}
    </span>
  );
}

export function QuoteStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        QUOTE_STATUS[status] ?? "bg-muted text-muted-foreground",
      )}
    >
      {status}
    </span>
  );
}
