// src/features/staff/components/WorkingSchedule.tsx
"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import scheduleApi, { WorkingDay, BlockedSlot } from "@/lib/api/schedule";
import { extractArray, extractItem } from "@/lib/api/response";
import { formatDate, cn } from "@/lib/utils";
import {
  Clock,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  CalendarOff,
  Save,
  Calendar,
} from "lucide-react";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const DEFAULT_HOURS = { startTime: "08:00", endTime: "17:00" };

const inp = cn(
  "h-9 px-2.5 text-sm rounded-lg border border-input bg-background text-foreground",
  "focus:outline-none focus:ring-2 focus:ring-ring/30 transition-shadow",
);

// ── Working Schedule ──────────────────────────────────────────────────────────

function WeekSchedule({ userId }: { userId: string }) {
  const qc = useQueryClient();

  const { data: raw, isLoading } = useQuery({
    queryKey: ["staff", userId, "schedule"],
    queryFn: () => scheduleApi.getSchedule(userId),
    select: (res) => extractArray(res) as WorkingDay[],
  });

  // Local state — editable copy
  const [days, setDays] = useState<WorkingDay[]>([]);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (raw && raw.length > 0) {
      // Sort by dayOfWeek and ensure all 7 days present
      const filled = Array.from({ length: 7 }, (_, i) => {
        const existing = raw.find((d) => d.dayOfWeek === i);
        return existing ?? { dayOfWeek: i, isWorking: false, ...DEFAULT_HOURS };
      });
      setDays(filled);
      setDirty(false);
    } else {
      // Seed defaults — Mon–Fri working
      setDays(
        Array.from({ length: 7 }, (_, i) => ({
          dayOfWeek: i,
          isWorking: i >= 1 && i <= 5,
          startTime: "08:00",
          endTime: "17:00",
        })),
      );
    }
  }, [raw]);

  const save = useMutation({
    mutationFn: () => scheduleApi.updateSchedule(userId, days),
    onSuccess: () => {
      toast.success("Working schedule saved");
      qc.invalidateQueries({ queryKey: ["staff", userId, "schedule"] });
      setDirty(false);
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to save"),
  });

  const update = (i: number, patch: Partial<WorkingDay>) => {
    setDays((prev) =>
      prev.map((d, idx) => (idx === i ? { ...d, ...patch } : d)),
    );
    setDirty(true);
  };

  if (isLoading)
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );

  return (
    <div className="space-y-4">
      {/* Day rows */}
      <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
        {days.map((day, i) => (
          <div
            key={i}
            className={cn(
              "flex items-center gap-4 px-4 py-3",
              !day.isWorking && "bg-muted/20",
            )}
          >
            {/* Toggle */}
            <button
              type="button"
              onClick={() => update(i, { isWorking: !day.isWorking })}
              className={cn(
                "flex items-center justify-center w-10 h-6 rounded-full transition-all shrink-0",
                day.isWorking
                  ? "bg-green-500"
                  : "bg-muted border border-border",
              )}
            >
              <span
                className={cn(
                  "w-4 h-4 rounded-full bg-white shadow-sm transition-transform",
                  day.isWorking ? "translate-x-2" : "-translate-x-1",
                )}
              />
            </button>

            {/* Day name */}
            <span
              className={cn(
                "w-24 text-sm font-medium shrink-0",
                day.isWorking ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {DAYS[i]}
            </span>

            {/* Time range */}
            {day.isWorking ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="time"
                  value={day.startTime}
                  onChange={(e) => update(i, { startTime: e.target.value })}
                  className={inp}
                />
                <span className="text-xs text-muted-foreground">to</span>
                <input
                  type="time"
                  value={day.endTime}
                  onChange={(e) => update(i, { endTime: e.target.value })}
                  className={inp}
                />
                <span className="text-xs text-muted-foreground ml-2">
                  {(() => {
                    const [sh, sm] = day.startTime.split(":").map(Number);
                    const [eh, em] = day.endTime.split(":").map(Number);
                    const mins = eh * 60 + em - (sh * 60 + sm);
                    if (mins <= 0) return "";
                    const h = Math.floor(mins / 60),
                      m = mins % 60;
                    return `${h}h${m > 0 ? ` ${m}m` : ""}`;
                  })()}
                </span>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground flex-1 italic">
                Off
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Save button */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {dirty ? "You have unsaved changes" : "Schedule is up to date"}
        </p>
        <button
          onClick={() => save.mutate()}
          disabled={!dirty || save.isPending}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-all"
          style={{
            backgroundColor: "var(--brand-gold)",
            color: "var(--brand-navy)",
          }}
        >
          {save.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save schedule
        </button>
      </div>
    </div>
  );
}

// ── Blocked Slots ─────────────────────────────────────────────────────────────

function BlockedSlots({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    date: "",
    isFullDay: true,
    startTime: "09:00",
    endTime: "10:00",
    reason: "",
  });

  const { data: slots = [], isLoading } = useQuery({
    queryKey: ["staff", userId, "blocked-slots"],
    queryFn: () => scheduleApi.listBlocked(userId, { upcoming: true }),
    select: (res) => extractArray(res) as BlockedSlot[],
  });

  const addSlot = useMutation({
    mutationFn: () => scheduleApi.addBlocked(userId, form),
    onSuccess: () => {
      toast.success("Blocked slot added");
      qc.invalidateQueries({ queryKey: ["staff", userId, "blocked-slots"] });
      setShowAdd(false);
      setForm({
        date: "",
        isFullDay: true,
        startTime: "09:00",
        endTime: "10:00",
        reason: "",
      });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  const removeSlot = useMutation({
    mutationFn: (slotId: string) => scheduleApi.removeBlocked(userId, slotId),
    onSuccess: () => {
      toast.success("Slot removed");
      qc.invalidateQueries({ queryKey: ["staff", userId, "blocked-slots"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  return (
    <div className="space-y-4">
      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : slots.length === 0 && !showAdd ? (
        <div className="flex flex-col items-center justify-center py-8 gap-2 border border-dashed border-border rounded-xl">
          <CalendarOff className="w-8 h-8 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No blocked slots</p>
          <p className="text-xs text-muted-foreground">
            Add leave, unavailability, or ad-hoc time off
          </p>
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
          {slots.map((slot) => (
            <div key={slot.id} className="flex items-center gap-4 px-4 py-3">
              <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center shrink-0">
                <CalendarOff className="w-4 h-4 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {formatDate(slot.date)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {slot.isFullDay
                    ? "Full day"
                    : `${slot.startTime} — ${slot.endTime}`}
                  {slot.reason && ` · ${slot.reason}`}
                </p>
              </div>
              <button
                onClick={() => {
                  if (confirm("Remove this blocked slot?"))
                    removeSlot.mutate(slot.id);
                }}
                disabled={removeSlot.isPending}
                className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      {showAdd && (
        <div className="border border-border rounded-xl p-4 space-y-3 bg-muted/10">
          <p className="text-sm font-semibold text-foreground">
            Add blocked slot
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Date *
              </label>
              <input
                type="date"
                value={form.date}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) =>
                  setForm((f) => ({ ...f, date: e.target.value }))
                }
                className={cn(inp, "w-full")}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Reason
              </label>
              <input
                value={form.reason}
                onChange={(e) =>
                  setForm((f) => ({ ...f, reason: e.target.value }))
                }
                placeholder="e.g. Annual leave, Training"
                className={cn(inp, "w-full")}
              />
            </div>
          </div>

          {/* Full day toggle */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <button
              type="button"
              onClick={() =>
                setForm((f) => ({ ...f, isFullDay: !f.isFullDay }))
              }
              className={cn(
                "flex items-center justify-center w-10 h-6 rounded-full transition-all shrink-0",
                form.isFullDay
                  ? "bg-green-500"
                  : "bg-muted border border-border",
              )}
            >
              <span
                className={cn(
                  "w-4 h-4 rounded-full bg-white shadow-sm transition-transform",
                  form.isFullDay ? "translate-x-2" : "-translate-x-1",
                )}
              />
            </button>
            <span className="text-sm text-foreground">Full day</span>
          </label>

          {!form.isFullDay && (
            <div className="flex items-center gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  From
                </label>
                <input
                  type="time"
                  value={form.startTime}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, startTime: e.target.value }))
                  }
                  className={inp}
                />
              </div>
              <span className="text-sm text-muted-foreground mt-5">to</span>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Until
                </label>
                <input
                  type="time"
                  value={form.endTime}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, endTime: e.target.value }))
                  }
                  className={inp}
                />
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => {
                if (!form.date) {
                  toast.error("Date is required");
                  return;
                }
                addSlot.mutate();
              }}
              disabled={addSlot.isPending || !form.date}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
              style={{
                backgroundColor: "var(--brand-gold)",
                color: "var(--brand-navy)",
              }}
            >
              {addSlot.isPending && (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              )}
              Add slot
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="px-4 py-2 rounded-lg text-sm border border-border hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {!showAdd && (
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 text-sm font-medium hover:underline transition-colors"
          style={{ color: "var(--brand-gold)" }}
        >
          <Plus className="w-4 h-4" /> Add blocked slot
        </button>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function WorkingSchedule({ userId }: { userId: string }) {
  const [tab, setTab] = useState<"schedule" | "blocked">("schedule");

  return (
    <div className="space-y-4">
      {/* Tab nav */}
      <div className="flex items-center gap-1 bg-muted rounded-xl p-1 w-fit">
        {(
          [
            { id: "schedule", label: "Working hours", icon: Clock },
            { id: "blocked", label: "Blocked slots", icon: CalendarOff },
          ] as const
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
              tab === id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {tab === "schedule" && <WeekSchedule userId={userId} />}
      {tab === "blocked" && <BlockedSlots userId={userId} />}
    </div>
  );
}
