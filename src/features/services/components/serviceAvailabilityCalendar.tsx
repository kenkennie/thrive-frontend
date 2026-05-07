"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Clock, User } from "lucide-react";
import {
  useServiceAvailability,
  useServiceDoctors,
} from "../hooks/useServices";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

interface SlotInfo {
  date: string;
  slots: string[];
  available: boolean;
  count: number;
}

export function ServiceAvailabilityCalendar({
  serviceId,
}: {
  serviceId: string;
}) {
  const today = new Date();
  const [cur, setCur] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  });
  const [doctorId, setDoctorId] = useState("");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { data: doctors } = useServiceDoctors(serviceId);
  const doctorList = Array.isArray(doctors) ? doctors : [];

  const { data: avail, isLoading } = useServiceAvailability(
    serviceId,
    cur.month + 1,
    cur.year,
    doctorId || undefined,
  );
  const slots: SlotInfo[] = Array.isArray(avail) ? avail : [];

  const slotMap = new Map(slots.map((s) => [s.date, s]));

  const firstDay = new Date(cur.year, cur.month, 1).getDay();
  const daysInMonth = new Date(cur.year, cur.month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const navigate = (d: number) => {
    const next = new Date(cur.year, cur.month + d, 1);
    setCur({ year: next.getFullYear(), month: next.getMonth() });
    setSelectedDate(null);
  };

  const selectedSlot = selectedDate ? slotMap.get(selectedDate) : null;

  return (
    <div className="space-y-4">
      {/* Doctor filter */}
      {doctorList.length > 0 && (
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-muted-foreground shrink-0" />
          <select
            value={doctorId}
            onChange={(e) => setDoctorId(e.target.value)}
            className="h-9 px-2.5 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none cursor-pointer"
          >
            <option value="">All doctors</option>
            {doctorList.map((d: any) => (
              <option
                key={d.id}
                value={d.id}
              >
                {d.fullName}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex gap-4">
        {/* Calendar */}
        <div className="flex-1 bg-card rounded-2xl border border-border overflow-hidden">
          {/* Nav */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-foreground">
              {MONTHS[cur.month]} {cur.year}
            </span>
            <button
              onClick={() => navigate(1)}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-border">
            {DAYS.map((d) => (
              <div
                key={d}
                className="py-2 text-center text-[11px] font-semibold text-muted-foreground uppercase"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Cells */}
          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              if (!day)
                return (
                  <div
                    key={`e-${i}`}
                    className="h-16 border-b border-r border-border/50 bg-muted/5"
                  />
                );

              const dateStr = `${cur.year}-${String(cur.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const info = slotMap.get(dateStr);
              const isPast =
                new Date(dateStr) < new Date(today.toISOString().split("T")[0]);
              const isToday = dateStr === today.toISOString().split("T")[0];
              const isSel = selectedDate === dateStr;

              return (
                <button
                  key={dateStr}
                  onClick={() =>
                    info && !isPast && setSelectedDate(isSel ? null : dateStr)
                  }
                  disabled={!info || isPast || !info.available}
                  className={cn(
                    "h-16 p-1.5 text-left border-b border-r border-border/50 transition-colors relative",
                    isSel && "ring-2 ring-inset ring-primary z-10",
                    !isPast &&
                      info?.available &&
                      !isSel &&
                      "hover:bg-muted/30 cursor-pointer",
                    (isPast || !info?.available) && "cursor-default",
                  )}
                >
                  <span
                    className={cn(
                      "flex items-center justify-center w-6 h-6 text-xs font-medium rounded-full",
                      isToday && "font-bold text-brand-navy",
                      isSel && !isToday && "text-primary font-bold",
                      isPast && "text-muted-foreground/50",
                      !isPast && !isToday && !isSel && "text-foreground",
                    )}
                    style={
                      isToday
                        ? { backgroundColor: "var(--brand-gold)" }
                        : undefined
                    }
                  >
                    {day}
                  </span>

                  {info && !isPast && (
                    <div className="mt-0.5">
                      {info.available ? (
                        <span className="text-[9px] text-green-600 dark:text-green-400 font-medium">
                          {info.count} slot{info.count !== 1 ? "s" : ""}
                        </span>
                      ) : (
                        <span className="text-[9px] text-muted-foreground">
                          Full
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="px-4 py-2 border-t border-border flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Available
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-muted" />
              Full / unavailable
            </span>
          </div>
        </div>

        {/* Slot detail */}
        {selectedDate && selectedSlot && (
          <div className="w-56 shrink-0 bg-card rounded-2xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-muted/20">
              <p className="text-sm font-semibold text-foreground">
                {new Date(selectedDate).toLocaleDateString("en-KE", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {selectedSlot.count} available slots
              </p>
            </div>
            <div className="p-3 space-y-1.5 max-h-64 overflow-y-auto">
              {(selectedSlot.slots ?? []).map((time: string) => (
                <div
                  key={time}
                  className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800/40"
                >
                  <Clock className="w-3.5 h-3.5 text-green-600 dark:text-green-400 shrink-0" />
                  <span className="text-sm font-medium text-foreground">
                    {time}
                  </span>
                </div>
              ))}
              {(!selectedSlot.slots || selectedSlot.slots.length === 0) && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No time slots loaded
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
