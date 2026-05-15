// src/app/(dashboard)/staff/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import {
  useStaffList,
  useInviteList,
  useCreateStaff,
  useInviteStaff,
  useCancelInvite,
  useResendInvite,
  useAllRoles,
} from "@/features/staff/hooks/useStaff";
import { extractArray } from "@/lib/api/response";
import { formatDate, cn } from "@/lib/utils";
import {
  Plus,
  Mail,
  RefreshCw,
  X,
  ChevronRight,
  UserPlus,
  Loader2,
  Send,
  UserCheck,
  AlertCircle,
  Clock,
  CheckCircle2,
} from "lucide-react";

const inp = cn(
  "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30",
);

const INVITE_STATUS: Record<string, string> = {
  PENDING:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  ACCEPTED:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  EXPIRED: "bg-muted text-muted-foreground",
  CANCELLED: "bg-muted text-muted-foreground",
};

type Mode = "none" | "invite" | "create";

export default function StaffPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("none");
  const [tab, setTab] = useState<"staff" | "invites">("staff");

  const { data: staffData, isLoading } = useStaffList();
  const { data: invites = [] } = useInviteList();
  const { data: roles = [] } = useAllRoles();

  const staff = staffData?.data ?? [];
  const create = useCreateStaff();
  const invite = useInviteStaff();
  const cancel = useCancelInvite();
  const resend = useResendInvite();

  const inviteForm = useForm({
    defaultValues: { email: "", fullName: "", roleId: "" },
  });
  const createForm = useForm({
    defaultValues: {
      email: "",
      fullName: "",
      phoneNumber: "",
      password: "",
      roleId: "",
    },
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Staff</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {staff.length} members
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMode(mode === "invite" ? "none" : "invite")}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium border border-border hover:bg-muted transition-colors"
          >
            <Mail className="w-4 h-4" /> Invite
          </button>
          <button
            onClick={() => setMode(mode === "create" ? "none" : "create")}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium shadow-sm"
            style={{
              backgroundColor: "var(--brand-gold)",
              color: "var(--brand-navy)",
            }}
          >
            <Plus className="w-4 h-4" /> Add staff
          </button>
        </div>
      </div>

      {/* Invite form */}
      {mode === "invite" && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/20">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Send className="w-4 h-4" /> Invite by email
            </h2>
            <button
              onClick={() => setMode("none")}
              className="p-1 rounded-md hover:bg-muted text-muted-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <form
            onSubmit={inviteForm.handleSubmit(async (d) => {
              await invite.mutateAsync(d as any);
              setMode("none");
              inviteForm.reset();
            })}
            className="p-5 space-y-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Full name
                </label>
                <input
                  {...inviteForm.register("fullName")}
                  placeholder="Jane Kamau"
                  className={inp}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Email *
                </label>
                <input
                  type="email"
                  {...inviteForm.register("email")}
                  placeholder="jane@thrive.co.ke"
                  className={inp}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Role
              </label>
              <select
                {...inviteForm.register("roleId")}
                className={cn(inp, "cursor-pointer")}
              >
                <option value="">Select role…</option>
                {(roles as any[]).map((r) => (
                  <option
                    key={r.id}
                    value={r.id}
                  >
                    {r.displayName}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={invite.isPending}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                style={{
                  backgroundColor: "var(--brand-gold)",
                  color: "var(--brand-navy)",
                }}
              >
                {invite.isPending && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
                Send invitation
              </button>
              <button
                type="button"
                onClick={() => setMode("none")}
                className="px-5 py-2 rounded-lg text-sm border border-border hover:bg-muted transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Create form */}
      {mode === "create" && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/20">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <UserPlus className="w-4 h-4" /> Add staff directly
            </h2>
            <button
              onClick={() => setMode("none")}
              className="p-1 rounded-md hover:bg-muted text-muted-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <form
            onSubmit={createForm.handleSubmit(async (d) => {
              await create.mutateAsync(d as any);
              setMode("none");
              createForm.reset();
            })}
            className="p-5 space-y-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Full name *
                </label>
                <input
                  {...createForm.register("fullName")}
                  placeholder="Dr. Jane Kamau"
                  className={inp}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Email *
                </label>
                <input
                  type="email"
                  {...createForm.register("email")}
                  placeholder="jane@thrive.co.ke"
                  className={inp}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Phone
                </label>
                <input
                  {...createForm.register("phoneNumber")}
                  placeholder="+254 7XX XXX XXX"
                  className={inp}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Temporary password *
                </label>
                <input
                  type="password"
                  {...createForm.register("password")}
                  placeholder="Min 8 characters"
                  className={inp}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Role
              </label>
              <select
                {...createForm.register("roleId")}
                className={cn(inp, "cursor-pointer")}
              >
                <option value="">Select role…</option>
                {(roles as any[]).map((r) => (
                  <option
                    key={r.id}
                    value={r.id}
                  >
                    {r.displayName}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={create.isPending}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                style={{
                  backgroundColor: "var(--brand-gold)",
                  color: "var(--brand-navy)",
                }}
              >
                {create.isPending && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
                Create account
              </button>
              <button
                type="button"
                onClick={() => setMode("none")}
                className="px-5 py-2 rounded-lg text-sm border border-border hover:bg-muted transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center bg-muted rounded-xl p-1 gap-0.5 w-fit">
        {(
          [
            { id: "staff", label: "Staff members" },
            {
              id: "invites",
              label: `Invitations (${(invites as any[]).length})`,
            },
          ] as const
        ).map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "px-3.5 py-2 rounded-lg text-xs font-medium transition-all",
              tab === id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Staff list */}
      {tab === "staff" && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : staff.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2">
              <UserCheck className="w-10 h-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                No staff members yet
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {staff.map((m: any) => (
                <button
                  key={m.id}
                  onClick={() => router.push(`/staff/${m.id}`)}
                  className="w-full flex items-center gap-4 px-4 py-3.5 text-left hover:bg-muted/20 transition-colors group"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                    style={{
                      backgroundColor: "var(--brand-gold)",
                      color: "var(--brand-navy)",
                    }}
                  >
                    {m.fullName
                      .split(" ")
                      .map((n: string) => n[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-foreground">
                        {m.fullName}
                      </p>
                      {!m.isActive && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{m.email}</p>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {m.userRoles?.map((ur: any) => (
                        <span
                          key={ur.role.id}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                        >
                          {ur.role.displayName}
                        </span>
                      ))}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Invites list */}
      {tab === "invites" && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          {(invites as any[]).length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2">
              <Mail className="w-10 h-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                No pending invitations
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {(invites as any[]).map((inv: any) => (
                <div
                  key={inv.id}
                  className="flex items-center gap-4 px-4 py-3.5"
                >
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {inv.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Sent {formatDate(inv.createdAt)}
                      {inv.expiresAt &&
                        ` · Expires ${formatDate(inv.expiresAt)}`}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full font-medium",
                      INVITE_STATUS[inv.status] ??
                        "bg-muted text-muted-foreground",
                    )}
                  >
                    {inv.status}
                  </span>
                  {inv.status === "PENDING" && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => resend.mutate(inv.id)}
                        disabled={resend.isPending}
                        title="Resend"
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Cancel this invitation?"))
                            cancel.mutate(inv.id);
                        }}
                        title="Cancel"
                        className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
