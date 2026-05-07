"use client";

import { use } from "react";
import { useAppointment } from "@/features/appointments/hooks/useAppointments";
import { AppointmentDetail } from "@/features/appointments/components/AppointmentDetail";
import { StatusActions } from "@/features/appointments/components/Statusactions";
import { Loader2 } from "lucide-react";
import { formatDate, formatTime } from "@/lib/utils";

interface Props {
  params: Promise<{ id: string }>;
}

export default function AppointmentDetailPage({ params }: Props) {
  const { id } = use(params);
  const { data, isLoading } = useAppointment(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2">
        <p className="text-muted-foreground">Appointment not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header card */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              {data.client.fullName}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {formatDate(data.date, "long")} &nbsp;·&nbsp;{" "}
              {formatTime(data.startTime)} — {formatTime(data.endTime)}
            </p>
          </div>
        </div>

        <StatusActions appointment={data} />
      </div>

      {/* Full detail */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <AppointmentDetail appointment={data} />
      </div>
    </div>
  );
}
