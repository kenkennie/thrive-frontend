"use client";

import { useState } from "react";
import { cn, formatTime } from "@/lib/utils";

import type { Appointment } from "@/lib/api/appointments";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { AppointmentCard } from "./Appointmentcard";
import { AppointmentDetail } from "./AppointmentDetail";
import { useDailySchedule } from "../hooks/useAppointments";

// Generate hours 07:00 → 20:00
const HOURS = Array.from({ length: 14 }, (_, i) => {
  const h = (i + 7).toString().padStart(2, "0");
  return `${h}:00`;
});

function parseMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

interface Props {
  date: string;
  doctorId?: string;
}

export function DailySchedule({ date, doctorId }: Props) {
  const { data, isLoading } = useDailySchedule(date, doctorId);
  const [selected, setSelected] = useState<Appointment | null>(null);

  const appointments = data?.appointments ?? [];

  // Position each appointment on the timeline
  // Timeline: 07:00 = 0px, each hour = 80px
  const BASE_MIN = 7 * 60; // 7am
  const PX_PER_MIN = 80 / 60;

  function topPx(startTime: string): number {
    return Math.max(0, (parseMinutes(startTime) - BASE_MIN) * PX_PER_MIN);
  }

  function heightPx(startTime: string, endTime: string): number {
    const dur = parseMinutes(endTime) - parseMinutes(startTime);
    return Math.max(36, dur * PX_PER_MIN);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const totalH = HOURS.length * 80;

  return (
    <div className="flex gap-4 h-full">
      {/* Timeline */}
      <div className="flex-1 overflow-y-auto rounded-xl border border-border bg-card">
        <div className="flex">
          {/* Hour labels */}
          <div className="w-14 shrink-0 border-r border-border">
            {HOURS.map((h) => (
              <div
                key={h}
                className="h-20 flex items-start pt-1 px-2"
              >
                <span className="text-[10px] text-muted-foreground font-medium">
                  {h}
                </span>
              </div>
            ))}
          </div>

          {/* Appointment grid */}
          <div
            className="flex-1 relative"
            style={{ height: totalH }}
          >
            {/* Hour gridlines */}
            {HOURS.map((_, i) => (
              <div
                key={i}
                className="absolute left-0 right-0 border-t border-border/50"
                style={{ top: i * 80 }}
              />
            ))}

            {/* Half-hour dashed lines */}
            {HOURS.map((_, i) => (
              <div
                key={`half-${i}`}
                className="absolute left-0 right-0 border-t border-dashed border-border/30"
                style={{ top: i * 80 + 40 }}
              />
            ))}

            {/* Current time indicator */}
            <CurrentTimeLine
              baseMin={BASE_MIN}
              pxPerMin={PX_PER_MIN}
            />

            {/* Appointments */}
            {appointments.map((appt) => {
              const top = topPx(appt.startTime);
              const height = heightPx(appt.startTime, appt.endTime);
              const isSelected = selected?.id === appt.id;

              return (
                <div
                  key={appt.id}
                  onClick={() => setSelected(isSelected ? null : appt)}
                  className={cn(
                    "absolute left-1 right-1 rounded-lg overflow-hidden cursor-pointer transition-all",
                    isSelected
                      ? "ring-2 ring-primary shadow-lg z-10"
                      : "hover:shadow-md z-1",
                  )}
                  style={{ top, height }}
                >
                  <AppointmentCard
                    appointment={appt}
                    compact={height < 60}
                  />
                </div>
              );
            })}

            {appointments.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  No appointments scheduled
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="w-80 shrink-0 rounded-xl border border-border bg-card overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
            <span className="text-sm font-semibold text-foreground">
              Appointment
            </span>
            <button
              onClick={() => setSelected(null)}
              className="p-1 rounded-md hover:bg-muted transition-colors text-muted-foreground"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <AppointmentDetail
              appointment={selected}
              onClose={() => setSelected(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function CurrentTimeLine({
  baseMin,
  pxPerMin,
}: {
  baseMin: number;
  pxPerMin: number;
}) {
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const top = (minutes - baseMin) * pxPerMin;

  if (top < 0 || top > 14 * 80) return null;

  return (
    <div
      className="absolute left-0 right-0 z-20 pointer-events-none"
      style={{ top }}
    >
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
        <div className="flex-1 h-px bg-red-500" />
      </div>
    </div>
  );
}
