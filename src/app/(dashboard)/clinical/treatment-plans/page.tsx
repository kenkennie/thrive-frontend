"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  usePlanList,
  useCreatePlan,
} from "@/features/clinical/hooks/useClinical";
import { TreatmentPlanForm } from "@/features/clinical/components/TreatmentPlanForm";
import { Pagination } from "@/components/ui/Pagination";
import { formatDate, formatCurrency, cn } from "@/lib/utils";
import {
  Plus,
  FileText,
  X,
  ChevronRight,
  CheckCircle2,
  Pause,
  XCircle,
  Clock,
} from "lucide-react";

const LIMIT = 20;

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "ACTIVE", label: "Active" },
  { value: "PAUSED", label: "Paused" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const STATUS_STYLES: Record<string, string> = {
  ACTIVE:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  PAUSED:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  COMPLETED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  CANCELLED: "bg-muted text-muted-foreground",
};

const STATUS_ICON: Record<string, React.ElementType> = {
  ACTIVE: Clock,
  PAUSED: Pause,
  COMPLETED: CheckCircle2,
  CANCELLED: XCircle,
};

export default function TreatmentPlansPage() {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);

  const create = useCreatePlan();

  const { data, isLoading } = usePlanList({
    status: status || undefined,
    page,
    limit: LIMIT,
  });

  const plans = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Treatment Plans</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {meta?.total ?? plans.length} plans
          </p>
        </div>
        <button
          onClick={() => setShowCreate((v) => !v)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium shadow-sm transition-all hover:shadow-md"
          style={{
            backgroundColor: "var(--brand-gold)",
            color: "var(--brand-navy)",
          }}
        >
          {showCreate ? (
            <X className="w-4 h-4" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          {showCreate ? "Cancel" : "New Plan"}
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-muted/20">
            <h2 className="text-sm font-semibold text-foreground">
              New Treatment Plan
            </h2>
          </div>
          <div className="p-6">
            <TreatmentPlanForm
              isLoading={create.isPending}
              onCancel={() => setShowCreate(false)}
              onSubmit={async (data) => {
                const res = await create.mutateAsync(data as any);
                const id =
                  (res as any)?.data?.data?.id ?? (res as any)?.data?.id;
                setShowCreate(false);
                if (id) router.push(`/clinical/treatment-plans/${id}`);
              }}
            />
          </div>
        </div>
      )}

      {/* Status tabs */}
      <div className="flex items-center bg-muted rounded-xl p-1 gap-0.5 w-fit">
        {STATUS_TABS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => {
              setStatus(value);
              setPage(1);
            }}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              status === value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-4 animate-pulse"
              >
                <div className="w-10 h-10 rounded-xl bg-muted shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-52 bg-muted rounded" />
                  <div className="h-3 w-36 bg-muted/60 rounded" />
                </div>
                <div className="w-24 h-5 bg-muted rounded-full" />
              </div>
            ))}
          </div>
        ) : plans.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center">
              <FileText className="w-7 h-7 text-muted-foreground/40" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                No treatment plans
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Create a plan to track multi-session treatments
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {plans.map((plan: any) => {
              const Icon = STATUS_ICON[plan.status] ?? Clock;
              const pct =
                plan.totalSessions > 0
                  ? Math.round(
                      (plan.completedSessions / plan.totalSessions) * 100,
                    )
                  : 0;
              return (
                <button
                  key={plan.id}
                  onClick={() =>
                    router.push(`/clinical/treatment-plans/${plan.id}`)
                  }
                  className="w-full flex items-center gap-4 px-4 py-4 text-left hover:bg-muted/20 transition-colors group"
                >
                  {/* Icon */}
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                      STATUS_STYLES[plan.status] ??
                        "bg-muted text-muted-foreground",
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {plan.title}
                      </p>
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full font-medium",
                          STATUS_STYLES[plan.status],
                        )}
                      >
                        {plan.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {plan.client.fullName} · Dr. {plan.doctor.fullName} ·
                      Started {formatDate(plan.startedAt ?? plan.createdAt)}
                    </p>

                    {/* Progress bar */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-32">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: "var(--brand-gold)",
                          }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {plan.completedSessions}/{plan.totalSessions} sessions
                      </span>
                    </div>
                  </div>

                  {/* Payment */}
                  <div className="text-right shrink-0 hidden sm:block">
                    {plan.totalPrice && (
                      <p className="text-sm font-semibold text-foreground">
                        {formatCurrency(plan.totalPrice, "KES")}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {plan.paymentModel.replace("_", " ")}
                    </p>
                  </div>

                  <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </button>
              );
            })}
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
