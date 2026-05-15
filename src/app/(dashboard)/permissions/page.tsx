"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useAllRoles,
  useAllPermissions,
} from "@/features/staff/hooks/useStaff";
import { cn } from "@/lib/utils";
import {
  Shield,
  Plus,
  ChevronRight,
  Users,
  Lock,
  Unlock,
  Settings2,
  Loader2,
} from "lucide-react";

const SYSTEM_BADGE =
  "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
const CUSTOM_BADGE =
  "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400";

export default function PermissionsPage() {
  const router = useRouter();
  const { data: roles = [], isLoading } = useAllRoles();
  const { data: allPerms = {} } = useAllPermissions();

  const totalPerms = Object.values(allPerms as Record<string, any[]>).reduce(
    (s, v) => s + v.length,
    0,
  );
  const modules = Object.keys(allPerms as Record<string, any[]>).sort();

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Permissions</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {(roles as any[]).length} roles · {totalPerms} permissions across{" "}
            {modules.length} modules
          </p>
        </div>
        <button
          onClick={() => router.push("/permissions/roles/new")}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium shadow-sm"
          style={{
            backgroundColor: "var(--brand-gold)",
            color: "var(--brand-navy)",
          }}
        >
          <Plus className="w-4 h-4" /> New role
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Total roles",
            value: (roles as any[]).length,
            icon: Shield,
          },
          {
            label: "System roles",
            value: (roles as any[]).filter((r: any) => r.isSystem).length,
            icon: Lock,
          },
          {
            label: "Custom roles",
            value: (roles as any[]).filter((r: any) => r.isCustom).length,
            icon: Unlock,
          },
          { label: "Permission keys", value: totalPerms, icon: Settings2 },
        ].map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="bg-card rounded-2xl border border-border p-4 space-y-2"
          >
            <div className="w-8 h-8 rounded-xl bg-muted/60 flex items-center justify-center">
              <Icon className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Roles list */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border bg-muted/20">
          <p className="text-sm font-semibold text-foreground">Roles</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="divide-y divide-border">
            {(roles as any[]).map((role) => (
              <button
                key={role.id}
                onClick={() => router.push(`/permissions/roles/${role.id}`)}
                className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-muted/20 transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-muted/60 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-foreground">
                      {role.displayName}
                    </p>
                    <span
                      className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full font-medium",
                        role.isSystem ? SYSTEM_BADGE : CUSTOM_BADGE,
                      )}
                    >
                      {role.isSystem ? "System" : "Custom"}
                    </span>
                  </div>
                  {role.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {role.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {role.rolePermissions?.length ?? 0} permissions ·{" "}
                    {role._count?.userRoles ?? 0} users
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Permission catalogue */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border bg-muted/20">
          <p className="text-sm font-semibold text-foreground">
            Permission catalogue
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            All available permissions grouped by module
          </p>
        </div>
        <div className="divide-y divide-border">
          {modules.map((mod) => {
            const perms: any[] = (allPerms as any)[mod] ?? [];
            return (
              <div
                key={mod}
                className="px-5 py-4"
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 capitalize">
                  {mod.replace(/_/g, " ")}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {perms.map((p) => (
                    <span
                      key={p.id}
                      title={p.description ?? p.displayName}
                      className="text-xs px-2 py-1 rounded-lg bg-muted text-muted-foreground border border-border/60"
                    >
                      {p.displayName}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
