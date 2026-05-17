"use client";

import { formatDate, formatTime, cn } from "@/lib/utils";
import {
  ClipboardList,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { useState } from "react";
import { useClientHistory } from "../hooks/useClients";

export function TreatmentHistory({ clientId }: { clientId: string }) {
  const { data: sessions, isLoading } = useClientHistory(clientId);
  const [expanded, setExpanded] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-muted/50 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!sessions?.length) {
    return (
      <div className="flex flex-col items-center justify-center h-32 gap-2 border border-dashed border-border rounded-xl">
        <ClipboardList className="w-8 h-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          No treatment history yet
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sessions.map((session) => {
        const isOpen = expanded === session.id;
        const isCompleted = session.status === "COMPLETED";
        const primaryService =
          session.appointment.appointmentServices?.[0]?.service?.name ??
          "Session";

        return (
          <div
            key={session.id}
            className="border border-border rounded-xl overflow-hidden"
          >
            <button
              onClick={() => setExpanded(isOpen ? null : session.id)}
              className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors"
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                  isCompleted
                    ? "bg-green-100 dark:bg-green-900/30"
                    : "bg-muted",
                )}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                ) : (
                  <Clock className="w-4 h-4 text-muted-foreground" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-foreground">
                    {primaryService}
                  </p>
                  {session.sessionNumber && (
                    <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      Session {session.sessionNumber}
                    </span>
                  )}
                  {session.treatmentPlan && (
                    <span className="text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                      {session.treatmentPlan.title}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDate(session.appointment.date)} ·{" "}
                  {session.doctor.fullName}
                </p>
              </div>

              {isOpen ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              )}
            </button>

            {isOpen && (
              <div className="px-4 pb-4 pt-0 border-t border-border/60 space-y-3">
                {session.treatmentPerformed && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Treatment performed
                    </p>
                    <p className="text-sm text-foreground">
                      {session.treatmentPerformed}
                    </p>
                  </div>
                )}
                {session.productsUsed && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Products used
                    </p>
                    <p className="text-sm text-foreground">
                      {session.productsUsed}
                    </p>
                  </div>
                )}
                {session.aftercareInstructions && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Aftercare
                    </p>
                    <p className="text-sm text-foreground bg-muted/50 rounded-lg p-2.5">
                      {session.aftercareInstructions}
                    </p>
                  </div>
                )}
                {session.followUpRequired && (
                  <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                    <Clock className="w-3.5 h-3.5" />
                    Follow-up required
                    {session.followUpDate &&
                      ` · ${formatDate(session.followUpDate)}`}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
