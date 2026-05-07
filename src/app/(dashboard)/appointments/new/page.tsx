"use client";

import { useRouter } from "next/navigation";
import { AppointmentForm } from "@/features/appointments/components/Appointmentform";
import { useCreateAppointment } from "@/features/appointments/hooks/useAppointments";
import { ArrowLeft } from "lucide-react";

export default function NewAppointmentPage() {
  const router = useRouter();
  const createAppt = useCreateAppointment();

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Appointments
      </button>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-muted/30">
          <h1 className="text-base font-semibold text-foreground">
            New Appointment
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Book a new appointment for a client
          </p>
        </div>
        <div className="p-6">
          <AppointmentForm
            isLoading={createAppt.isPending}
            onCancel={() => router.back()}
            onSubmit={async (data) => {
              const res = await createAppt.mutateAsync(data as any);
              const id = (res as any)?.data?.data?.id ?? (res as any)?.data?.id;
              router.push(id ? `/appointments/${id}` : "/appointments");
            }}
          />
        </div>
      </div>
    </div>
  );
}
