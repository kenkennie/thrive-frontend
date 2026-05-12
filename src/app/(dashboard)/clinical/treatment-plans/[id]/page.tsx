"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import {
  usePlan,
  usePlanProgress,
  useUpdatePlan,
  usePausePlan,
  useResumePlan,
  useCompletePlan,
  useCancelPlan,
  useMarkMissed,
  useCompleteSession,
  useRecordDeposit,
} from "@/features/clinical/hooks/useClinical";
import { TreatmentPlanForm } from "@/features/clinical/components/TreatmentPlanForm";
import { SessionNoteForm } from "@/features/clinical/components/SessionNoteForm";
import { usePermission } from "@/hooks/usePermission";
import { formatDate, formatCurrency, cn } from "@/lib/utils";
import {
  ArrowLeft,
  Edit2,
  Pause,
  Play,
  CheckCircle2,
  XCircle,
  Loader2,
  X,
  CreditCard,
  Calendar,
  ChevronRight,
  AlertTriangle,
  Clock,
  CheckCheck,
  AlertCircle,
  Plus,
} from "lucide-react";
import Link from "next/link";

interface Props {
  params: Promise<{ id: string }>;
}

const SESSION_STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-muted text-muted-foreground",
  COMPLETED:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  MISSED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const SESSION_STATUS_ICON: Record<string, React.ElementType> = {
  PENDING: Clock,
  COMPLETED: CheckCircle2,
  MISSED: AlertCircle,
};

const PLAN_STATUS_STYLES: Record<string, string> = {
  ACTIVE:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  PAUSED:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  COMPLETED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  CANCELLED: "bg-muted text-muted-foreground",
};

export default function TreatmentPlanDetailPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();

  const { data: plan, isLoading } = usePlan(id);
  const { data: progress } = usePlanProgress(id);

  const updatePlan = useUpdatePlan(id);
  const pausePlan = usePausePlan();
  const resumePlan = useResumePlan();
  const completePlan = useCompletePlan();
  const cancelPlan = useCancelPlan();
  const recordDeposit = useRecordDeposit(id);

  const canManage = usePermission("treatment_plans:update");
  const isDoctor = usePermission("sessions:create");

  type Panel = "none" | "edit" | "pause" | "cancel" | "deposit" | string; // string for session-{id}
  const [panel, setPanel] = useState<Panel>("none");
  const [pauseReason, setPauseReason] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [depositDate, setDepositDate] = useState("");

  const markMissed = useMarkMissed(id);
  const completeSession = useCompleteSession(id);

  const [completingSessionId, setCompletingSessionId] = useState<string | null>(
    null,
  );

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  if (!plan)
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Treatment plan not found</p>
      </div>
    );

  const prog = progress?.progress;
  const financial = progress?.financial;
  const pct =
    prog?.progressPercent ??
    (plan.totalSessions > 0
      ? Math.round((plan.completedSessions / plan.totalSessions) * 100)
      : 0);
  const isActive = plan.status === "ACTIVE";
  const isPaused = plan.status === "PAUSED";
  const isTerminal = ["COMPLETED", "CANCELLED"].includes(plan.status);

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Treatment Plans
      </button>

      {/* ── Header ── */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div
          className="h-1.5 w-full"
          style={{ backgroundColor: "var(--brand-gold)" }}
        />
        <div className="p-6 space-y-4">
          {/* Title + status */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-bold text-foreground">
                  {plan.title}
                </h1>
                <span
                  className={cn(
                    "text-xs px-2.5 py-1 rounded-full font-medium",
                    PLAN_STATUS_STYLES[plan.status],
                  )}
                >
                  {plan.status}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {plan.client.fullName} · Dr. {plan.doctor.fullName}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Started {formatDate(plan.startedAt ?? plan.createdAt)}
                {plan.sessionFrequencyDays &&
                  ` · Every ${plan.sessionFrequencyDays} days`}
                {plan.paymentModel &&
                  ` · ${plan.paymentModel.replace("_", " ")}`}
              </p>
            </div>

            {/* Actions */}
            {canManage && !isTerminal && (
              <div className="flex flex-wrap gap-2 shrink-0">
                <button
                  onClick={() => setPanel(panel === "edit" ? "none" : "edit")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-border hover:bg-muted transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </button>
                {isActive && (
                  <button
                    onClick={() =>
                      setPanel(panel === "pause" ? "none" : "pause")
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-amber-300 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors"
                  >
                    <Pause className="w-3.5 h-3.5" /> Pause
                  </button>
                )}
                {isPaused && (
                  <button
                    onClick={() => resumePlan.mutate(id)}
                    disabled={resumePlan.isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 hover:bg-green-200 transition-colors disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5" /> Resume
                  </button>
                )}
                {(isActive || isPaused) && (
                  <>
                    <button
                      onClick={() => completePlan.mutate(id)}
                      disabled={completePlan.isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-200 transition-colors disabled:opacity-50"
                    >
                      {completePlan.isPending ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <CheckCheck className="w-3.5 h-3.5" />
                      )}
                      Complete
                    </button>
                    <button
                      onClick={() =>
                        setPanel(panel === "cancel" ? "none" : "cancel")
                      }
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-destructive border border-destructive/30 hover:bg-destructive/5 transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Cancel
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {plan.completedSessions} of {plan.totalSessions} sessions
                completed
              </span>
              <span className="font-semibold text-foreground">{pct}%</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  backgroundColor: "var(--brand-gold)",
                }}
              />
            </div>
            {prog?.nextSuggestedDate && (
              <p className="text-xs text-muted-foreground">
                Next session suggested: {formatDate(prog.nextSuggestedDate)}
              </p>
            )}
          </div>

          {/* Financial summary */}
          {financial && (
            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border/60">
              {[
                {
                  label: "Total invoiced",
                  value: formatCurrency(financial.totalInvoiced, "KES"),
                },
                {
                  label: "Collected",
                  value: formatCurrency(financial.totalPaid, "KES"),
                },
                {
                  label: "Outstanding",
                  value: formatCurrency(financial.totalOutstanding, "KES"),
                },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="bg-muted/30 rounded-xl p-3"
                >
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-sm font-bold text-foreground">{value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Deposit */}
          {plan.paymentModel === "DEPOSIT" && (
            <div
              className={cn(
                "flex items-center justify-between p-3.5 rounded-xl border",
                plan.depositPaid
                  ? "border-green-200 bg-green-50 dark:border-green-800/40 dark:bg-green-900/10"
                  : "border-amber-200 bg-amber-50 dark:border-amber-800/40 dark:bg-amber-900/10",
              )}
            >
              <div className="flex items-center gap-2">
                <CreditCard
                  className={cn(
                    "w-4 h-4 shrink-0",
                    plan.depositPaid
                      ? "text-green-600 dark:text-green-400"
                      : "text-amber-600 dark:text-amber-400",
                  )}
                />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Deposit{" "}
                    {plan.depositAmount
                      ? formatCurrency(plan.depositAmount, "KES")
                      : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {plan.depositPaid
                      ? `Paid ${plan.depositPaidAt ? formatDate(plan.depositPaidAt) : ""}`
                      : "Not yet paid"}
                  </p>
                </div>
              </div>
              {!plan.depositPaid && canManage && (
                <button
                  onClick={() =>
                    setPanel(panel === "deposit" ? "none" : "deposit")
                  }
                  className="text-xs px-3 py-1.5 rounded-lg font-medium border border-amber-300 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-colors"
                >
                  Mark paid
                </button>
              )}
            </div>
          )}

          {/* Panels */}
          {panel === "edit" && (
            <div className="border border-border rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/20">
                <h3 className="text-sm font-semibold text-foreground">
                  Edit Plan
                </h3>
                <button
                  onClick={() => setPanel("none")}
                  className="p-1 rounded-md hover:bg-muted text-muted-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4">
                <TreatmentPlanForm
                  plan={plan}
                  isLoading={updatePlan.isPending}
                  onCancel={() => setPanel("none")}
                  onSubmit={async (data) => {
                    await updatePlan.mutateAsync(data as any);
                    setPanel("none");
                  }}
                />
              </div>
            </div>
          )}

          {panel === "pause" && (
            <div className="space-y-3 p-4 border border-amber-200 dark:border-amber-800/40 rounded-xl bg-amber-50 dark:bg-amber-900/10">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                <Pause className="w-4 h-4" /> Pause this plan?
              </p>
              <input
                value={pauseReason}
                onChange={(e) => setPauseReason(e.target.value)}
                placeholder="Reason for pausing (e.g. client travel, waiting for skin to heal)"
                className="w-full h-9 px-3 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    pausePlan.mutate({ id, reason: pauseReason });
                    setPanel("none");
                  }}
                  disabled={pausePlan.isPending || !pauseReason.trim()}
                  className="flex items-center gap-1 px-4 py-1.5 rounded-lg text-xs font-medium bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 transition-colors"
                >
                  {pausePlan.isPending && (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  )}
                  Pause plan
                </button>
                <button
                  onClick={() => setPanel("none")}
                  className="px-4 py-1.5 rounded-lg text-xs border border-border hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {panel === "cancel" && (
            <div className="space-y-3 p-4 border border-destructive/30 rounded-xl bg-destructive/5">
              <p className="text-sm font-medium text-destructive flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> Cancel this plan? This
                cannot be undone.
              </p>
              <input
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Reason for cancellation"
                className="w-full h-9 px-3 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    cancelPlan.mutate({ id, reason: cancelReason });
                    setPanel("none");
                  }}
                  disabled={cancelPlan.isPending || !cancelReason.trim()}
                  className="flex items-center gap-1 px-4 py-1.5 rounded-lg text-xs font-medium bg-destructive text-white hover:bg-destructive/90 disabled:opacity-50 transition-colors"
                >
                  {cancelPlan.isPending && (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  )}
                  Confirm cancel
                </button>
                <button
                  onClick={() => setPanel("none")}
                  className="px-4 py-1.5 rounded-lg text-xs border border-border hover:bg-muted transition-colors"
                >
                  Back
                </button>
              </div>
            </div>
          )}

          {panel === "deposit" && (
            <div className="space-y-3 p-4 border border-border rounded-xl bg-muted/10">
              <p className="text-sm font-semibold text-foreground">
                Record deposit payment
              </p>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Date received
                </label>
                <input
                  type="date"
                  value={depositDate}
                  onChange={(e) => setDepositDate(e.target.value)}
                  className="w-full h-9 px-3 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring/30 max-w-xs"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    recordDeposit.mutate({ paidAt: depositDate || undefined });
                    setPanel("none");
                  }}
                  disabled={recordDeposit.isPending}
                  className="flex items-center gap-1 px-4 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50"
                  style={{
                    backgroundColor: "var(--brand-gold)",
                    color: "var(--brand-navy)",
                  }}
                >
                  {recordDeposit.isPending && (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  )}
                  Mark deposit paid
                </button>
                <button
                  onClick={() => setPanel("none")}
                  className="px-4 py-1.5 rounded-lg text-xs border border-border hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Description + Notes */}
          {plan.description && (
            <p className="text-sm text-muted-foreground border-t border-border/60 pt-3">
              {plan.description}
            </p>
          )}
          {plan.pauseReason && plan.status === "PAUSED" && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/40 rounded-xl">
              <Pause className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 dark:text-amber-300">
                Pause reason: {plan.pauseReason}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Sessions ── */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border bg-muted/20 flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">Sessions</p>
          <span className="text-xs text-muted-foreground">
            {plan.completedSessions}/{plan.totalSessions} completed
          </span>
        </div>

        {!plan.sessions || plan.sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2">
            <Calendar className="w-8 h-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              No sessions linked yet
            </p>
            <p className="text-xs text-muted-foreground">
              Book appointments and link them to this plan
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {plan.sessions.map((session: any) => {
              const Icon = SESSION_STATUS_ICON[session.status] ?? Clock;
              const isSessionPanel = panel === `session-${session.id}`;

              return (
                <div
                  key={session.id}
                  className="px-5 py-4 space-y-3"
                >
                  <div className="flex items-center gap-3">
                    {/* Session number badge */}
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-foreground shrink-0">
                      {session.sessionNumber ?? "?"}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={cn(
                            "text-xs px-2 py-0.5 rounded-full font-medium",
                            SESSION_STATUS_STYLES[session.status],
                          )}
                        >
                          <span className="flex items-center gap-1">
                            <Icon className="w-3 h-3" />
                            {session.status}
                          </span>
                        </span>
                        {session.appointment && (
                          <span className="text-xs text-muted-foreground">
                            {formatDate(session.appointment.date)}{" "}
                            {session.appointment.startTime}
                          </span>
                        )}
                      </div>
                      {session.appointment?.appointmentServices?.[0] && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {
                            session.appointment.appointmentServices[0].service
                              .name
                          }
                        </p>
                      )}
                      {session.followUpRequired && session.followUpDate && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-0.5">
                          <AlertCircle className="w-3 h-3" /> Follow-up due{" "}
                          {formatDate(session.followUpDate)}
                        </p>
                      )}
                    </div>

                    {/* Session actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {session.appointment && (
                        <Link
                          href={`/appointments/${session.appointment.id}`}
                          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      )}
                      {isActive && session.status === "PENDING" && isDoctor && (
                        <>
                          <button
                            onClick={() =>
                              setPanel(
                                isSessionPanel
                                  ? "none"
                                  : `session-${session.id}`,
                              )
                            }
                            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-medium border border-border hover:bg-muted transition-colors"
                          >
                            <Plus className="w-3 h-3" /> Notes
                          </button>
                          <button
                            onClick={() => {
                              if (confirm("Mark session as missed?"))
                                markMissed.mutate(session.id);
                            }}
                            disabled={markMissed.isPending}
                            className="text-xs px-2.5 py-1.5 rounded-lg text-muted-foreground border border-border hover:bg-destructive/5 hover:text-destructive hover:border-destructive/30 transition-colors disabled:opacity-50"
                          >
                            Missed
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Complete session form */}
                  {isSessionPanel && (
                    <div className="ml-11 border border-border rounded-xl overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/20">
                        <h3 className="text-sm font-semibold text-foreground">
                          Session {session.sessionNumber} Notes
                        </h3>
                        <button
                          onClick={() => setPanel("none")}
                          className="p-1 rounded-md hover:bg-muted text-muted-foreground"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="p-4">
                        <SessionNoteForm
                          isPerSession={plan.paymentModel === "PER_SESSION"}
                          isLoading={completeSession.isPending}
                          onCancel={() => setPanel("none")}
                          onSubmit={async (data) => {
                            await completeSession.mutateAsync({
                              sessionId: session.id,
                              dto: {
                                ...data,
                                appointmentId: session.appointment?.id,
                              },
                            });
                            setPanel("none");
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Linked invoices ── */}
      {plan.invoices && plan.invoices.length > 0 && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border bg-muted/20">
            <p className="text-sm font-semibold text-foreground">Invoices</p>
          </div>
          <div className="divide-y divide-border/60">
            {plan.invoices.map((inv: any) => (
              <Link
                key={inv.id}
                href={`/invoices/${inv.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-muted/20 transition-colors group"
              >
                <div>
                  <p className="text-sm font-medium text-foreground font-mono">
                    {inv.invoiceNumber}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(inv.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">
                      {formatCurrency(inv.totalAmount, "KES")}
                    </p>
                    {inv.amountDue > 0 && (
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        {formatCurrency(inv.amountDue, "KES")} due
                      </p>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {plan.notes && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Clinical Notes
          </p>
          <p className="text-sm text-foreground whitespace-pre-wrap">
            {plan.notes}
          </p>
        </div>
      )}
    </div>
  );
}
