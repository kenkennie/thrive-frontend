"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Appointment } from "@/lib/api/appointments";
import { useMonthAppointments } from "@/features/appointments/hooks/useAppointments";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const STATUS_DOT: Record<string, string> = {
  PENDING: "bg-yellow-400",
  CONFIRMED: "bg-blue-400",
  ARRIVED: "bg-indigo-400",
  IN_PROGRESS: "bg-purple-400",
  COMPLETED: "bg-green-400",
  CANCELLED: "bg-red-400",
  NO_SHOW: "bg-gray-400",
};

interface Props {
  appointments: Appointment[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onMonthChange: (year: number, month: number) => void;
}

export function MonthlyCalendar({
  appointments,
  selectedDate,
  onSelectDate,
  onMonthChange,
}: Props) {
  const today = new Date();
  const [cur, setCur] = useState(() => {
    const d = selectedDate ? new Date(selectedDate) : today;
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const { year, month } = cur;

  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());

  // ADD this query (replaces using `appointments` for the calendar):
  const { data: monthAppointments = [], isLoading: loadingMonth } =
    useMonthAppointments(calYear, calMonth);

  // UPDATE onMonthChange handler passed to MonthlyCalendar:
  const handleMonthChange = (year: number, month: number) => {
    setCalYear(year);
    setCalMonth(month);
  };

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  const apptByDate = appointments.reduce<Record<string, Appointment[]>>(
    (acc, a) => {
      const key = a.date.split("T")[0];
      if (!acc[key]) acc[key] = [];
      acc[key].push(a);
      return acc;
    },
    {},
  );

  const navigate = (delta: number) => {
    const next = new Date(year, month + delta, 1);
    const y = next.getFullYear(),
      m = next.getMonth();
    setCur({ year: y, month: m });
    onMonthChange(y, m);
  };

  const monthLabel = new Date(year, month, 1).toLocaleDateString("en-KE", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-foreground">
            {monthLabel}
          </h3>
          <button
            onClick={() => {
              const y = today.getFullYear(),
                m = today.getMonth();
              setCur({ year: y, month: m });
              onMonthChange(y, m);
              onSelectDate(today.toISOString().split("T")[0]);
            }}
            className="text-xs px-2 py-0.5 rounded-md border border-border hover:bg-muted transition-colors text-muted-foreground"
          >
            Today
          </button>
        </div>
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
            className="py-2 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wide"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar cells */}
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          if (!day) {
            return (
              <div
                key={`empty-${i}`}
                className="h-20 border-b border-r border-border/50 bg-muted/10"
              />
            );
          }

          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayAppts = apptByDate[dateStr] ?? [];
          const isToday = dateStr === today.toISOString().split("T")[0];
          const isSelected = dateStr === selectedDate;
          const isWeekend = [0, 6].includes(
            new Date(year, month, day).getDay(),
          );

          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate(dateStr)}
              className={cn(
                "h-20 p-1.5 text-left border-b border-r border-border/50 transition-colors group",
                "hover:bg-muted/40 relative",
                isSelected && "bg-primary/5 border-primary/30",
                isWeekend && !isSelected && "bg-muted/20",
              )}
            >
              {/* Day number */}
              <span
                className={cn(
                  "flex items-center justify-center w-6 h-6 text-xs font-medium rounded-full mb-1",
                  isToday && "text-brand-navy font-bold",
                  isSelected && !isToday && "text-primary font-bold",
                  !isToday && !isSelected && "text-foreground",
                )}
                style={
                  isToday ? { backgroundColor: "var(--brand-gold)" } : undefined
                }
              >
                {day}
              </span>

              {/* Appointment dots */}
              <div className="space-y-0.5">
                {dayAppts.slice(0, 3).map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center gap-1 overflow-hidden"
                  >
                    <div
                      className={cn(
                        "w-1.5 h-1.5 rounded-full shrink-0",
                        STATUS_DOT[a.status.name] ?? "bg-gray-400",
                      )}
                    />
                    <span className="text-[9px] text-muted-foreground truncate leading-tight">
                      {a.client.fullName.split(" ")[0]}
                    </span>
                  </div>
                ))}
                {dayAppts.length > 3 && (
                  <p className="text-[9px] text-muted-foreground">
                    +{dayAppts.length - 3} more
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="px-4 py-2.5 border-t border-border flex flex-wrap gap-3">
        {Object.entries(STATUS_DOT).map(([status, dot]) => (
          <span
            key={status}
            className="flex items-center gap-1.5 text-[10px] text-muted-foreground"
          >
            <span className={cn("w-2 h-2 rounded-full", dot)} />
            {status.replace("_", " ")}
          </span>
        ))}
      </div>
    </div>
  );
}
