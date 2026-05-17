"use client";

import { useState } from "react";
import {
  useAllPermissions,
  useUserOverrides,
  useSetPermissionOverride,
  useDeletePermissionOverride,
} from "../hooks/useStaff";
import { cn } from "@/lib/utils";
import { Search, Plus, Minus, X, Loader2 } from "lucide-react";

interface Props {
  userId: string;
}

export function PermissionOverrides({ userId }: Props) {
  const { data: allPerms } = useAllPermissions();
  const { data: overrides } = useUserOverrides(userId);
  const setOverride = useSetPermissionOverride(userId);
  const deleteOverride = useDeletePermissionOverride(userId);

  const [search, setSearch] = useState("");
  const [showPanel, setShowPanel] = useState(false);
  const [module, setModule] = useState("");

  const permissions = Array.isArray(allPerms) ? allPerms : [];
  const existing = Array.isArray(overrides) ? overrides : [];

  const modules = Array.from(
    new Set(permissions.map((p: any) => p.module)),
  ).sort();

  const filtered = permissions.filter((p: any) => {
    const matchSearch =
      !search ||
      p.name.includes(search.toLowerCase()) ||
      p.displayName.toLowerCase().includes(search.toLowerCase());
    const matchModule = !module || p.module === module;
    return matchSearch && matchModule;
  });

  const overrideMap = new Map(existing.map((o: any) => [o.permission.id, o]));

  const handle = (permissionId: string, granted: boolean) => {
    const existing = overrideMap.get(permissionId);
    if (existing && existing.granted === granted) {
      deleteOverride.mutate(permissionId);
    } else {
      setOverride.mutate({ permissionId, granted });
    }
  };

  return (
    <div className="space-y-3">
      {/* Existing overrides summary */}
      {existing.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Active overrides
          </p>
          <div className="flex flex-wrap gap-2">
            {existing.map((o: any) => (
              <div
                key={o.id}
                className={cn(
                  "flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-lg text-xs font-medium border",
                  o.granted
                    ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800/40"
                    : "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/40",
                )}
              >
                {o.granted ? (
                  <Plus className="w-3 h-3" />
                ) : (
                  <Minus className="w-3 h-3" />
                )}
                {o.permission.displayName}
                <button
                  onClick={() => deleteOverride.mutate(o.permission.id)}
                  className="ml-0.5 hover:opacity-70 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => setShowPanel((v) => !v)}
        className="flex items-center gap-1.5 text-sm font-medium hover:underline"
        style={{ color: "var(--brand-gold)" }}
      >
        <Plus className="w-3.5 h-3.5" />
        {showPanel ? "Hide permission editor" : "Add / edit overrides"}
      </button>

      {showPanel && (
        <div className="border border-border rounded-xl overflow-hidden">
          {/* Filters */}
          <div className="flex items-center gap-2 p-3 border-b border-border bg-muted/20 flex-wrap">
            <div className="relative flex-1 min-w-0 max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search permissions…"
                className="w-full h-8 pl-8 pr-3 text-sm rounded-lg border border-input bg-background focus:outline-none"
              />
            </div>
            <select
              value={module}
              onChange={(e) => setModule(e.target.value)}
              className="h-8 px-2 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none cursor-pointer"
            >
              <option value="">All modules</option>
              {modules.map((m) => (
                <option key={m as string} value={m as string}>
                  {m as string}
                </option>
              ))}
            </select>
          </div>

          {/* Permission list */}
          <div className="max-h-72 overflow-y-auto divide-y divide-border/50">
            {filtered.map((perm: any) => {
              const override = overrideMap.get(perm.id);
              const isGranted = override?.granted === true;
              const isDenied = override?.granted === false;
              const isPending =
                setOverride.isPending || deleteOverride.isPending;

              return (
                <div
                  key={perm.id}
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground">
                      {perm.displayName}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      {perm.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handle(perm.id, true)}
                      disabled={isPending}
                      className={cn(
                        "flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50",
                        isGranted
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "text-muted-foreground hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-900/20 dark:hover:text-green-400",
                      )}
                    >
                      <Plus className="w-3 h-3" />
                      Grant
                    </button>
                    <button
                      onClick={() => handle(perm.id, false)}
                      disabled={isPending}
                      className={cn(
                        "flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50",
                        isDenied
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          : "text-muted-foreground hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20 dark:hover:text-red-400",
                      )}
                    >
                      <Minus className="w-3 h-3" />
                      Deny
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
