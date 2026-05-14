"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import {
  useAppointmentSession,
  useCreateSessionNote,
} from "@/features/clinical/hooks/useClinical";
import { useAppointment } from "@/features/appointments/hooks/useAppointments";
import { SessionNoteForm } from "@/features/clinical/components/SessionNoteForm";
import { formatDate, formatTime, cn } from "@/lib/utils";
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

interface Props {
  params: Promise<{ id: string }>;
}

export default function AppointmentSessionPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();

  const { data: appt, isLoading: loadingAppt } = useAppointment(id);
  const {
    data: session,
    isLoading: loadingSession,
    error: sessionError,
  } = useAppointmentSession(id);
  const createNote = useCreateSessionNote();

  const isLoading = loadingAppt || loadingSession;

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );

  const service = appt?.appointmentServices?.[0];
  const hasSession = !!session;

  // Writable if appointment is IN_PROGRESS or COMPLETED
  const writableStatuses = ["IN_PROGRESS", "COMPLETED"];
  const canWrite = appt && writableStatuses.includes(appt.status?.name ?? "");

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Appointment
      </button>

      {/* Appointment context */}
      {appt && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-lg font-bold text-foreground">
                {appt.client.fullName}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {formatDate(appt.date, "long")} · {formatTime(appt.startTime)} —{" "}
                {formatTime(appt.endTime)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Dr. {appt.doctor.fullName}
                {service &&
                  ` · ${service.service.name}${service.variant ? ` — ${service.variant.name}` : ""}`}
              </p>
            </div>
            <Link
              href={`/appointments/${id}`}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              View appt <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Status guard */}
          {!canWrite && (
            <div
              className={cn(
                "mt-4 flex items-center gap-2 px-3.5 py-3 rounded-xl border text-sm",
                appt.status?.name === "CANCELLED" ||
                  appt.status?.name === "NO_SHOW"
                  ? "bg-muted/30 border-border text-muted-foreground"
                  : "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-300",
              )}
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              {appt.status?.name === "CANCELLED" ||
              appt.status?.name === "NO_SHOW"
                ? "Session notes cannot be added to cancelled or no-show appointments."
                : `Appointment must be In Progress or Completed to write clinical notes. Current status: ${appt.status?.label}.`}
            </div>
          )}
        </div>
      )}

      {/* Existing session — read only summary + link to full page */}
      {hasSession && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-muted/20">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
              <p className="text-sm font-semibold text-foreground">
                Session note recorded
              </p>
            </div>
            <Link
              href={`/clinical/sessions/${session!.id}`}
              className="text-xs font-medium hover:underline flex items-center gap-1"
              style={{ color: "var(--brand-gold)" }}
            >
              View full note <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="p-5 space-y-3">
            {session!.treatmentPerformed && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Treatment performed
                </p>
                <p className="text-sm text-foreground line-clamp-3">
                  {session!.treatmentPerformed}
                </p>
              </div>
            )}
            {session!.aftercareInstructions && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Aftercare
                </p>
                <p className="text-sm text-foreground line-clamp-2">
                  {session!.aftercareInstructions}
                </p>
              </div>
            )}
            {session!.followUpRequired && (
              <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                <AlertCircle className="w-3.5 h-3.5" />
                Follow-up required
                {session!.followUpDate
                  ? ` · ${formatDate(session!.followUpDate)}`
                  : ""}
              </div>
            )}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1 border-t border-border/60">
              <Clock className="w-3.5 h-3.5" />
              Recorded {formatDate(session!.createdAt)} by Dr.{" "}
              {session!.doctor.fullName}
            </div>
          </div>
        </div>
      )}

      {/* Create new session note form */}
      {!hasSession && canWrite && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-muted/20">
            <h2 className="text-sm font-semibold text-foreground">
              Write Session Note
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Record clinical notes, treatment details, and aftercare
              instructions for this appointment
            </p>
          </div>
          <div className="p-5">
            <SessionNoteForm
              isLoading={createNote.isPending}
              onCancel={() => router.back()}
              onSubmit={async (data) => {
                const res = await createNote.mutateAsync({
                  appointmentId: id,
                  dto: data,
                });
                const sessionId =
                  (res as any)?.data?.data?.id ?? (res as any)?.data?.id;
                if (sessionId) router.push(`/clinical/sessions/${sessionId}`);
                else router.back();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
