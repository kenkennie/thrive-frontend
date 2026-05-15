"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import {
  useStaffMember,
  useUserRoles,
  useAllRoles,
  useEffectivePermissions,
  useAllPermissions,
  useSchedule,
  useBlockedSlots,
  useUpdateStaff,
  useDeactivateStaff,
  useActivateStaff,
  useResetPassword,
  useAssignRole,
  useRemoveRole,
  useBulkOverride,
  useRemoveOverride,
  useSaveSchedule,
  useAddBlocked,
  useRemoveBlocked,
} from "@/features/staff/hooks/useStaff";
import { formatDate, cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  ArrowLeft,
  Edit2,
  X,
  Loader2,
  CheckCircle2,
  XCircle,
  Shield,
  Clock,
  CalendarOff,
  Plus,
  Trash2,
  Save,
  Key,
  UserCheck,
  UserX,
  ChevronDown,
  ChevronUp,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

const inp = cn(
  "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30",
);

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// ── Confirm dialog ─────────────────────────────────────────────────────────────

function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
  danger = false,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl border border-border p-6 max-w-sm w-full space-y-4 shadow-2xl">
        <p className="text-sm font-medium text-foreground">{message}</p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm border border-border hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors",
              danger
                ? "bg-destructive hover:bg-destructive/90"
                : "bg-green-600 hover:bg-green-700",
            )}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Schedule tab ──────────────────────────────────────────────────────────────

function ScheduleTab({ userId }: { userId: string }) {
  const { data: rawSchedule = [] } = useSchedule(userId);
  const { data: blockedSlots = [] } = useBlockedSlots(userId);
  const saveSchedule = useSaveSchedule(userId);
  const addBlocked = useAddBlocked(userId);
  const removeBlocked = useRemoveBlocked(userId);

  const [days, setDays] = useState<any[]>([]);
  const [dirty, setDirty] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newSlot, setNewSlot] = useState({
    date: "",
    isFullDay: true,
    startTime: "09:00",
    endTime: "10:00",
    reason: "",
  });

  useEffect(() => {
    if (rawSchedule.length > 0) {
      const filled = Array.from({ length: 7 }, (_, i) => {
        const ex = (rawSchedule as any[]).find((d: any) => d.dayOfWeek === i);
        return (
          ex ?? {
            dayOfWeek: i,
            isWorking: false,
            startTime: "08:00",
            endTime: "17:00",
          }
        );
      });
      setDays(filled);
      setDirty(false);
    } else {
      setDays(
        Array.from({ length: 7 }, (_, i) => ({
          dayOfWeek: i,
          isWorking: i >= 1 && i <= 5,
          startTime: "08:00",
          endTime: "17:00",
        })),
      );
    }
  }, [rawSchedule]);

  const update = (i: number, patch: any) => {
    setDays((p) => p.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));
    setDirty(true);
  };

  return (
    <div className="space-y-6">
      {/* Working hours */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Working hours
        </p>
        <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
          {days.map((day, i) => (
            <div
              key={i}
              className={cn(
                "flex items-center gap-4 px-4 py-3",
                !day.isWorking && "bg-muted/20",
              )}
            >
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
              <span
                className={cn(
                  "w-24 text-sm font-medium shrink-0",
                  !day.isWorking && "text-muted-foreground",
                )}
              >
                {DAYS[i]}
              </span>
              {day.isWorking ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="time"
                    value={day.startTime}
                    onChange={(e) => update(i, { startTime: e.target.value })}
                    className="h-9 px-2.5 text-sm rounded-lg border border-input bg-background focus:outline-none"
                  />
                  <span className="text-xs text-muted-foreground">to</span>
                  <input
                    type="time"
                    value={day.endTime}
                    onChange={(e) => update(i, { endTime: e.target.value })}
                    className="h-9 px-2.5 text-sm rounded-lg border border-input bg-background focus:outline-none"
                  />
                </div>
              ) : (
                <span className="text-sm text-muted-foreground italic flex-1">
                  Off
                </span>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-end mt-3">
          <button
            onClick={() => saveSchedule.mutate(days)}
            disabled={!dirty || saveSchedule.isPending}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            style={{
              backgroundColor: "var(--brand-gold)",
              color: "var(--brand-navy)",
            }}
          >
            {saveSchedule.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            Save schedule
          </button>
        </div>
      </div>

      {/* Blocked slots */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Blocked slots
        </p>
        {(blockedSlots as any[]).length === 0 && !showAdd ? (
          <div className="flex flex-col items-center justify-center py-6 gap-2 border border-dashed border-border rounded-xl">
            <CalendarOff className="w-7 h-7 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No blocked slots</p>
          </div>
        ) : (
          <div className="border border-border rounded-xl divide-y divide-border overflow-hidden">
            {(blockedSlots as any[]).map((slot: any) => (
              <div
                key={slot.id}
                className="flex items-center gap-3 px-4 py-3"
              >
                <CalendarOff className="w-4 h-4 text-red-500 shrink-0" />
                <div className="flex-1">
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
                  onClick={() => removeBlocked.mutate(slot.id)}
                  disabled={removeBlocked.isPending}
                  className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {showAdd && (
          <div className="mt-3 border border-border rounded-xl p-4 space-y-3 bg-muted/10">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Date *
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  value={newSlot.date}
                  onChange={(e) =>
                    setNewSlot((s) => ({ ...s, date: e.target.value }))
                  }
                  className={inp}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Reason
                </label>
                <input
                  value={newSlot.reason}
                  onChange={(e) =>
                    setNewSlot((s) => ({ ...s, reason: e.target.value }))
                  }
                  placeholder="e.g. Annual leave"
                  className={inp}
                />
              </div>
            </div>
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <button
                type="button"
                onClick={() =>
                  setNewSlot((s) => ({ ...s, isFullDay: !s.isFullDay }))
                }
                className={cn(
                  "flex items-center justify-center w-10 h-6 rounded-full transition-all",
                  newSlot.isFullDay
                    ? "bg-green-500"
                    : "bg-muted border border-border",
                )}
              >
                <span
                  className={cn(
                    "w-4 h-4 rounded-full bg-white shadow-sm transition-transform",
                    newSlot.isFullDay ? "translate-x-2" : "-translate-x-1",
                  )}
                />
              </button>
              <span className="text-sm text-foreground">Full day</span>
            </label>
            {!newSlot.isFullDay && (
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={newSlot.startTime}
                  onChange={(e) =>
                    setNewSlot((s) => ({ ...s, startTime: e.target.value }))
                  }
                  className="h-9 px-2.5 text-sm rounded-lg border border-input bg-background focus:outline-none"
                />
                <span className="text-xs text-muted-foreground">to</span>
                <input
                  type="time"
                  value={newSlot.endTime}
                  onChange={(e) =>
                    setNewSlot((s) => ({ ...s, endTime: e.target.value }))
                  }
                  className="h-9 px-2.5 text-sm rounded-lg border border-input bg-background focus:outline-none"
                />
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (!newSlot.date) {
                    toast.error("Date required");
                    return;
                  }
                  addBlocked.mutate(newSlot);
                  setShowAdd(false);
                  setNewSlot({
                    date: "",
                    isFullDay: true,
                    startTime: "09:00",
                    endTime: "10:00",
                    reason: "",
                  });
                }}
                disabled={addBlocked.isPending}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                style={{
                  backgroundColor: "var(--brand-gold)",
                  color: "var(--brand-navy)",
                }}
              >
                {addBlocked.isPending && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}{" "}
                Add
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
            className="flex items-center gap-1.5 mt-3 text-sm font-medium hover:underline"
            style={{ color: "var(--brand-gold)" }}
          >
            <Plus className="w-4 h-4" /> Add blocked slot
          </button>
        )}
      </div>
    </div>
  );
}

// ── Permissions tab ───────────────────────────────────────────────────────────

function PermissionsTab({ userId }: { userId: string }) {
  const { data: effective } = useEffectivePermissions(userId);
  const { data: allPerms = {} } = useAllPermissions();
  const { data: userRoles = [] } = useUserRoles(userId);
  const { data: allRoles = [] } = useAllRoles();
  const assignRole = useAssignRole(userId);
  const removeRole = useRemoveRole(userId);
  const bulkOverride = useBulkOverride(userId);
  const removeOverride = useRemoveOverride(userId);

  // Local override state: permId → true (grant) | false (revoke) | null (no override)
  const [overrides, setOverrides] = useState<Record<string, boolean | null>>(
    {},
  );
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [dirty, setDirty] = useState(false);

  // Seed overrides from effective permissions on load
  useEffect(() => {
    if (!effective) return;
    const map: Record<string, boolean | null> = {};
    effective.overrides?.forEach((o: any) => {
      map[o.permission.id] = o.granted;
    });
    setOverrides(map);
    setDirty(false);
  }, [effective]);

  const roleIds = (userRoles as any[]).map((ur: any) => ur.role.id);

  const roleGranted = new Set<string>(
    (userRoles as any[]).flatMap(
      (ur: any) =>
        ur.role.rolePermissions?.map((rp: any) => rp.permission.id) ?? [],
    ),
  );

  const getStatus = (
    permId: string,
  ): "role" | "granted" | "revoked" | "none" => {
    const ov = overrides[permId];
    if (ov === true) return "granted";
    if (ov === false) return "revoked";
    if (roleGranted.has(permId)) return "role";
    return "none";
  };

  const toggle = (permId: string) => {
    setOverrides((prev) => {
      const cur = prev[permId];
      // Cycle: no override → grant → revoke → remove override
      const next =
        cur === undefined || cur === null ? true : cur === true ? false : null;
      setDirty(true);
      return { ...prev, [permId]: next };
    });
  };

  const save = () => {
    const list = Object.entries(overrides)
      .filter(([, v]) => v !== null)
      .map(([permissionId, granted]) => ({ permissionId, granted }));
    bulkOverride.mutate(list);
    setDirty(false);
  };

  const modules = Object.keys(allPerms as Record<string, any[]>).sort();

  return (
    <div className="space-y-5">
      {/* Roles */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Assigned roles
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          {(userRoles as any[]).map((ur: any) => (
            <div
              key={ur.role.id}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-sm font-medium text-foreground border border-border"
            >
              {ur.role.displayName}
              <button
                onClick={() => removeRole.mutate(ur.role.id)}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <select
            onChange={(e) => {
              if (e.target.value) {
                assignRole.mutate(e.target.value);
                e.target.value = "";
              }
            }}
            className="h-9 px-2.5 text-sm rounded-lg border border-input bg-background focus:outline-none cursor-pointer max-w-xs"
          >
            <option value="">+ Assign role…</option>
            {(allRoles as any[])
              .filter((r) => !roleIds.includes(r.id))
              .map((r) => (
                <option
                  key={r.id}
                  value={r.id}
                >
                  {r.displayName}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Per-user overrides */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Permission overrides
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Grant or revoke individual permissions beyond what the role
              provides.
              <span className="ml-1 text-green-600 dark:text-green-400">
                Green = grant
              </span>{" "}
              · <span className="text-red-500">Red = revoke</span> ·{" "}
              <span className="text-blue-600 dark:text-blue-400">
                Blue = from role
              </span>
            </p>
          </div>
          {dirty && (
            <button
              onClick={save}
              disabled={bulkOverride.isPending}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
              style={{
                backgroundColor: "var(--brand-gold)",
                color: "var(--brand-navy)",
              }}
            >
              {bulkOverride.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              Save overrides
            </button>
          )}
        </div>

        <div className="space-y-2">
          {modules.map((mod) => {
            const perms: any[] = (allPerms as any)[mod] ?? [];
            const isExpanded = expanded[mod] ?? false;
            const hasOverride = perms.some(
              (p) => overrides[p.id] !== undefined && overrides[p.id] !== null,
            );

            return (
              <div
                key={mod}
                className="border border-border rounded-xl overflow-hidden"
              >
                <button
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/20 transition-colors"
                  onClick={() =>
                    setExpanded((e) => ({ ...e, [mod]: !isExpanded }))
                  }
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground capitalize">
                      {mod.replace(/_/g, " ")}
                    </span>
                    {hasOverride && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        custom
                      </span>
                    )}
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>

                {isExpanded && (
                  <div className="border-t border-border divide-y divide-border/60 bg-muted/5">
                    {perms.map((perm) => {
                      const status = getStatus(perm.id);
                      return (
                        <div
                          key={perm.id}
                          className="flex items-center justify-between px-4 py-2.5"
                        >
                          <div>
                            <p className="text-xs font-medium text-foreground">
                              {perm.displayName}
                            </p>
                            {perm.description && (
                              <p className="text-[10px] text-muted-foreground">
                                {perm.description}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => toggle(perm.id)}
                            className={cn(
                              "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all",
                              status === "granted"
                                ? "bg-green-100 border-green-300 text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-400"
                                : status === "revoked"
                                  ? "bg-red-100 border-red-300 text-red-700 dark:bg-red-900/30 dark:border-red-700 dark:text-red-400"
                                  : status === "role"
                                    ? "bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-400"
                                    : "bg-muted border-border text-muted-foreground",
                            )}
                          >
                            {status === "granted"
                              ? "Granted"
                              : status === "revoked"
                                ? "Revoked"
                                : status === "role"
                                  ? "Via role"
                                  : "No access"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function StaffDetailPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();

  const { data: member, isLoading } = useStaffMember(id);
  const update = useUpdateStaff(id);
  const deactivate = useDeactivateStaff();
  const activate = useActivateStaff();
  const resetPwd = useResetPassword();

  const [activeTab, setActiveTab] = useState<
    "profile" | "permissions" | "schedule"
  >("profile");
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState<{
    msg: string;
    onConfirm: () => void;
    danger?: boolean;
  } | null>(null);

  const form = useForm({
    defaultValues: { fullName: "", email: "", phoneNumber: "" },
  });
  useEffect(() => {
    if (member)
      form.reset({
        fullName: member.fullName,
        email: member.email,
        phoneNumber: member.phoneNumber ?? "",
      });
  }, [member]);

  if (isLoading)
    return (
      <div className="flex justify-center h-64 items-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  if (!member)
    return (
      <div className="flex justify-center h-64 items-center">
        <p className="text-muted-foreground">Staff member not found</p>
      </div>
    );

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {confirm && (
        <ConfirmDialog
          message={confirm.msg}
          danger={confirm.danger}
          onConfirm={() => {
            confirm.onConfirm();
            setConfirm(null);
          }}
          onCancel={() => setConfirm(null)}
        />
      )}

      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Staff
      </button>

      {/* Header */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <div className="flex items-start gap-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold shrink-0"
            style={{
              backgroundColor: "var(--brand-gold)",
              color: "var(--brand-navy)",
            }}
          >
            {member.fullName
              .split(" ")
              .map((n: string) => n[0])
              .slice(0, 2)
              .join("")}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-foreground">
                {member.fullName}
              </h1>
              {!member.isActive && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  Inactive
                </span>
              )}
              {member.isSuperAdmin && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  Super admin
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{member.email}</p>
            {member.phoneNumber && (
              <p className="text-xs text-muted-foreground">
                {member.phoneNumber}
              </p>
            )}
            <div className="flex flex-wrap gap-1 mt-1.5">
              {member.userRoles?.map((ur: any) => (
                <span
                  key={ur.role.id}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                >
                  {ur.role.displayName}
                </span>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              onClick={() => setEditing(!editing)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-border hover:bg-muted transition-colors"
            >
              {editing ? (
                <X className="w-3.5 h-3.5" />
              ) : (
                <Edit2 className="w-3.5 h-3.5" />
              )}
              {editing ? "Cancel" : "Edit"}
            </button>
            <button
              onClick={() =>
                setConfirm({
                  msg: "Send a password reset email to this staff member? They will receive a link to set a new password.",
                  onConfirm: () => resetPwd.mutate(id),
                })
              }
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-border hover:bg-muted transition-colors"
            >
              <Key className="w-3.5 h-3.5" /> Reset password
            </button>
            {member.isActive ? (
              <button
                onClick={() =>
                  setConfirm({
                    msg: `Deactivate ${member.fullName}? They will no longer be able to log in.`,
                    onConfirm: () => deactivate.mutate(id),
                    danger: true,
                  })
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-destructive border border-destructive/30 hover:bg-destructive/5 transition-colors"
              >
                <UserX className="w-3.5 h-3.5" /> Deactivate
              </button>
            ) : (
              <button
                onClick={() => activate.mutate(id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 transition-colors"
              >
                <UserCheck className="w-3.5 h-3.5" /> Activate
              </button>
            )}
          </div>
        </div>

        {/* Edit form */}
        {editing && (
          <form
            onSubmit={form.handleSubmit(async (d) => {
              await update.mutateAsync(d as any);
              setEditing(false);
            })}
            className="mt-4 pt-4 border-t border-border space-y-3"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Full name
                </label>
                <input
                  {...form.register("fullName")}
                  className={inp}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Phone
                </label>
                <input
                  {...form.register("phoneNumber")}
                  className={inp}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={update.isPending}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                style={{
                  backgroundColor: "var(--brand-gold)",
                  color: "var(--brand-navy)",
                }}
              >
                {update.isPending && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}{" "}
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-4 py-2 rounded-lg text-sm border border-border hover:bg-muted transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center bg-muted rounded-xl p-1 gap-0.5 w-fit">
        {(
          [
            { id: "profile", label: "Profile" },
            { id: "permissions", label: "Permissions" },
            { id: "schedule", label: "Schedule" },
          ] as const
        ).map(({ id: tabId, label }) => (
          <button
            key={tabId}
            onClick={() => setActiveTab(tabId)}
            className={cn(
              "px-3.5 py-2 rounded-lg text-xs font-medium transition-all",
              activeTab === tabId
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="bg-card rounded-2xl border border-border p-5">
        {/* Profile tab */}
        {activeTab === "profile" && (
          <div className="space-y-3">
            {[
              { label: "Email", value: member.email },
              { label: "Phone", value: member.phoneNumber ?? "—" },
              {
                label: "Last login",
                value: member.lastLoginAt
                  ? formatDate(member.lastLoginAt)
                  : "Never",
              },
              {
                label: "Last active",
                value: member.lastActiveAt
                  ? formatDate(member.lastActiveAt)
                  : "—",
              },
              { label: "Member since", value: formatDate(member.createdAt) },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="flex justify-between py-2 border-b border-border/60 last:border-0"
              >
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className="text-sm font-medium text-foreground">
                  {value}
                </span>
              </div>
            ))}
          </div>
        )}

        {activeTab === "permissions" && <PermissionsTab userId={id} />}
        {activeTab === "schedule" && <ScheduleTab userId={id} />}
      </div>
    </div>
  );
}
