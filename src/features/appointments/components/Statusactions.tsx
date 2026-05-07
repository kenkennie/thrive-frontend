"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  useArriveAppointment,
  useCheckInAppointment,
  useCompleteAppointment,
  useNoShowAppointment,
  useCancelAppointment,
  useStartAppointment,
  useConfirmAppointment,
} from "@/hooks/useAppointment";
import type { Appointment } from "@/lib/api/appointments";
import {
  CheckCircle2,
  UserCheck,
  PlayCircle,
  XCircle,
  AlertTriangle,
  Clock,
  CheckCheck,
  Loader2,
} from "lucide-react";
import { usePermission } from "@/stores/permissions.store";

interface Props {
  appointment: Appointment;
  onDone?: () => void;
  compact?: boolean;
}

interface ActionBtn {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  isPending: boolean;
  variant: "gold" | "green" | "red" | "outline";
  permission: string;
}

export function StatusActions({ appointment, onDone, compact }: Props) {
  const { status } = appointment;
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const confirm = useConfirmAppointment();
  const arrive = useArriveAppointment();
  const checkIn = useCheckInAppointment();
  const start = useStartAppointment();
  const complete = useCompleteAppointment();
  const noShow = useNoShowAppointment();
  const cancel = useCancelAppointment();

  const canConfirm = usePermission("appointments:confirm");
  const canCheckIn = usePermission("appointments:check_in");
  const canStart = usePermission("appointments:start");
  const canComplete = usePermission("appointments:complete");
  const canNoShow = usePermission("appointments:no_show");
  const canCancel = usePermission("appointments:cancel");

  const act = async (fn: () => Promise<any>) => {
    await fn();
    onDone?.();
  };

  const name = status.name;

  const actions: ActionBtn[] = [];

  if (name === "PENDING") {
    actions.push({
      label: "Confirm",
      icon: <CheckCircle2 className="w-4 h-4" />,
      onClick: () => act(() => confirm.mutateAsync(appointment.id) as any),
      isPending: confirm.isPending,
      variant: "gold",
      permission: "appointments:confirm",
    });
  }

  if (name === "CONFIRMED") {
    actions.push({
      label: "Mark Arrived",
      icon: <UserCheck className="w-4 h-4" />,
      onClick: () => act(() => arrive.mutateAsync(appointment.id) as any),
      isPending: arrive.isPending,
      variant: "gold",
      permission: "appointments:check_in",
    });
  }

  if (name === "ARRIVED") {
    actions.push({
      label: "Check In",
      icon: <CheckCircle2 className="w-4 h-4" />,
      onClick: () => act(() => checkIn.mutateAsync(appointment.id) as any),
      isPending: checkIn.isPending,
      variant: "green",
      permission: "appointments:check_in",
    });
  }

  if (name === "CHECKED_IN") {
    actions.push({
      label: "Start Session",
      icon: <PlayCircle className="w-4 h-4" />,
      onClick: () => act(() => start.mutateAsync(appointment.id) as any),
      isPending: start.isPending,
      variant: "green",
      permission: "appointments:start",
    });
  }

  if (name === "IN_PROGRESS") {
    actions.push({
      label: "Complete",
      icon: <CheckCheck className="w-4 h-4" />,
      onClick: () => act(() => complete.mutateAsync(appointment.id) as any),
      isPending: complete.isPending,
      variant: "green",
      permission: "appointments:complete",
    });
  }

  if (!status.isCompleted && !status.isCancelled && !status.isNoShow) {
    actions.push({
      label: "No-show",
      icon: <Clock className="w-4 h-4" />,
      onClick: () => act(() => noShow.mutateAsync(appointment.id) as any),
      isPending: noShow.isPending,
      variant: "outline",
      permission: "appointments:no_show",
    });
    actions.push({
      label: "Cancel",
      icon: <XCircle className="w-4 h-4" />,
      onClick: () => setShowCancel(true),
      isPending: cancel.isPending,
      variant: "red",
      permission: "appointments:cancel",
    });
  }

  const permMap: Record<string, boolean> = {
    "appointments:confirm": canConfirm,
    "appointments:check_in": canCheckIn,
    "appointments:start": canStart,
    "appointments:complete": canComplete,
    "appointments:no_show": canNoShow,
    "appointments:cancel": canCancel,
  };

  const visible = actions.filter((a) => permMap[a.permission]);
  if (visible.length === 0) return null;

  const VARIANT_CLASS: Record<string, string> = {
    gold: "text-brand-navy font-medium",
    green: "bg-green-600 text-white hover:bg-green-700",
    red: "bg-destructive text-white hover:bg-destructive/90",
    outline: "border border-border text-muted-foreground hover:bg-muted",
  };

  return (
    <div className="space-y-3">
      <div className={cn("flex flex-wrap gap-2", compact && "gap-1.5")}>
        {visible.map((btn) => (
          <button
            key={btn.label}
            onClick={btn.onClick}
            disabled={btn.isPending}
            className={cn(
              "flex items-center gap-1.5 rounded-lg transition-all disabled:opacity-50",
              compact ? "px-2.5 py-1.5 text-xs" : "px-3.5 py-2 text-sm",
              btn.variant === "gold"
                ? "font-medium"
                : VARIANT_CLASS[btn.variant],
            )}
            style={
              btn.variant === "gold"
                ? {
                    backgroundColor: "var(--brand-gold)",
                    color: "var(--brand-navy)",
                  }
                : undefined
            }
          >
            {btn.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              btn.icon
            )}
            {btn.label}
          </button>
        ))}
      </div>

      {/* Cancel dialog */}
      {showCancel && (
        <div className="border border-border rounded-xl p-4 space-y-3 bg-card">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">Cancel appointment?</span>
          </div>
          <textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Reason for cancellation (optional)"
            rows={2}
            className="w-full text-sm px-3 py-2 rounded-lg border border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
          <div className="flex gap-2">
            <button
              onClick={() => {
                cancel.mutate({ id: appointment.id, reason: cancelReason });
                setShowCancel(false);
                onDone?.();
              }}
              disabled={cancel.isPending}
              className="px-3 py-1.5 rounded-lg text-sm bg-destructive text-white hover:bg-destructive/90 flex items-center gap-1.5 disabled:opacity-50"
            >
              {cancel.isPending && (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              )}
              Confirm cancel
            </button>
            <button
              onClick={() => setShowCancel(false)}
              className="px-3 py-1.5 rounded-lg text-sm border border-border hover:bg-muted"
            >
              Keep appointment
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
