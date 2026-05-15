"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAllPermissions } from "@/features/staff/hooks/useStaff";
import { toast } from "sonner";
import api from "@/lib/api/client";
import { extractItem, extractArray } from "@/lib/api/response";
import { formatDate, cn } from "@/lib/utils";
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Loader2,
  Shield,
  Users,
  ChevronDown,
  ChevronUp,
  Save,
  X,
  AlertTriangle,
} from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

const inp = cn(
  "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30",
);

export default function RoleDetailPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const qc = useQueryClient();

  const { data: role, isLoading } = useQuery({
    queryKey: ["roles", id],
    queryFn: () => api.get(`/permissions/roles/${id}`),
    select: (r) => extractItem<any>(r),
  });

  const { data: allPerms = {} } = useAllPermissions();
  const modules = Object.keys(allPerms as Record<string, any[]>).sort();

  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [dispName, setDispName] = useState("");
  const [desc, setDesc] = useState("");

  useEffect(() => {
    if (!role) return;
    setSelected(
      new Set(role.rolePermissions?.map((rp: any) => rp.permission.id) ?? []),
    );
    setDispName(role.displayName ?? "");
    setDesc(role.description ?? "");
  }, [role]);

  const updateRole = useMutation({
    mutationFn: (dto: any) => api.patch(`/permissions/roles/${id}`, dto),
    onSuccess: () => {
      toast.success("Role updated");
      qc.invalidateQueries({ queryKey: ["roles"] });
      setEditing(false);
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  const deleteRole = useMutation({
    mutationFn: () => api.delete(`/permissions/roles/${id}`),
    onSuccess: () => {
      toast.success("Role deleted");
      qc.invalidateQueries({ queryKey: ["roles"] });
      router.push("/permissions");
    },
    onError: (e: any) =>
      toast.error(
        e?.message ?? "Failed to delete — check no users are assigned",
      ),
  });

  const togglePerm = (pid: string) =>
    setSelected((p) => {
      const n = new Set(p);
      n.has(pid) ? n.delete(pid) : n.add(pid);
      return n;
    });
  const toggleModule = (mod: string) => {
    const perms: any[] = (allPerms as any)[mod] ?? [];
    const allSel = perms.every((p) => selected.has(p.id));
    setSelected((prev) => {
      const n = new Set(prev);
      perms.forEach((p) => (allSel ? n.delete(p.id) : n.add(p.id)));
      return n;
    });
  };

  const save = () =>
    updateRole.mutate({
      displayName: dispName,
      description: desc,
      permissionIds: Array.from(selected),
    });

  if (isLoading)
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  if (!role)
    return (
      <div className="flex justify-center py-16">
        <p className="text-muted-foreground">Role not found</p>
      </div>
    );

  const isSystem = role.isSystem;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Permissions
      </button>

      {/* Header */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-muted/60 flex items-center justify-center shrink-0">
              <Shield className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              {editing ? (
                <div className="space-y-2">
                  <input
                    value={dispName}
                    onChange={(e) => setDispName(e.target.value)}
                    placeholder="Display name"
                    className={cn(inp, "max-w-xs")}
                  />
                  <input
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder="Description"
                    className={cn(inp, "max-w-xs")}
                  />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-lg font-bold text-foreground">
                      {role.displayName}
                    </h1>
                    <span
                      className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full font-medium",
                        isSystem
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          : "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
                      )}
                    >
                      {isSystem ? "System" : "Custom"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">
                    {role.name}
                  </p>
                  {role.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {role.description}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {!isSystem && (
            <div className="flex items-center gap-2 shrink-0">
              {editing ? (
                <>
                  <button
                    onClick={save}
                    disabled={updateRole.isPending}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50"
                    style={{
                      backgroundColor: "var(--brand-gold)",
                      color: "var(--brand-navy)",
                    }}
                  >
                    {updateRole.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false);
                      setSelected(
                        new Set(
                          role.rolePermissions?.map(
                            (rp: any) => rp.permission.id,
                          ) ?? [],
                        ),
                      );
                      setDispName(role.displayName);
                      setDesc(role.description ?? "");
                    }}
                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-border hover:bg-muted transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => {
                      if (
                        confirm(
                          `Delete "${role.displayName}"? Users with this role will lose it.`,
                        )
                      )
                        deleteRole.mutate();
                    }}
                    disabled={deleteRole.isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-destructive border border-destructive/30 hover:bg-destructive/5 transition-colors disabled:opacity-50"
                  >
                    {deleteRole.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                    Delete
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border/60">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{role._count?.userRoles ?? 0} users</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Shield className="w-4 h-4" />
            <span>{role.rolePermissions?.length ?? 0} permissions</span>
          </div>
          {isSystem && (
            <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/40 rounded-lg px-2.5 py-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              System role — read only
            </div>
          )}
        </div>
      </div>

      {/* Permissions */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border bg-muted/20 flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">Permissions</p>
          <span className="text-xs text-muted-foreground">
            {selected.size} selected
          </span>
        </div>

        <div className="p-5 space-y-2">
          {modules.map((mod) => {
            const perms: any[] = (allPerms as any)[mod] ?? [];
            const selCount = perms.filter((p) => selected.has(p.id)).length;
            const isExpanded = expanded[mod] ?? false;
            const allSel = selCount === perms.length;

            return (
              <div
                key={mod}
                className="border border-border rounded-xl overflow-hidden"
              >
                <div className="flex items-center gap-3 px-4 py-3 bg-muted/10 hover:bg-muted/20 transition-colors">
                  {/* Select-all */}
                  <button
                    type="button"
                    disabled={isSystem}
                    onClick={() => !isSystem && toggleModule(mod)}
                    className={cn(
                      "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all",
                      isSystem ? "opacity-60 cursor-default" : "",
                      allSel
                        ? "border-transparent"
                        : selCount > 0
                          ? "border-primary bg-primary/10"
                          : "border-input",
                    )}
                    style={
                      allSel && !isSystem
                        ? { backgroundColor: "var(--brand-gold)" }
                        : allSel && isSystem
                          ? {
                              backgroundColor: "var(--brand-gold)",
                              opacity: 0.6,
                            }
                          : undefined
                    }
                  >
                    {(allSel || selCount > 0) && (
                      <svg
                        className="w-3 h-3"
                        viewBox="0 0 12 12"
                        fill="none"
                      >
                        <path
                          d={allSel ? "M2 6l3 3 5-5" : "M2 6h8"}
                          stroke={allSel ? "#1A1A3E" : "currentColor"}
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>

                  <button
                    type="button"
                    className="flex-1 flex items-center justify-between text-left"
                    onClick={() =>
                      setExpanded((e) => ({ ...e, [mod]: !isExpanded }))
                    }
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground capitalize">
                        {mod.replace(/_/g, " ")}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {selCount}/{perms.length}
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                </div>

                {isExpanded && (
                  <div className="border-t border-border divide-y divide-border/60">
                    {perms.map((perm) => (
                      <label
                        key={perm.id}
                        className={cn(
                          "flex items-center gap-3 px-4 py-2.5",
                          !isSystem && "hover:bg-muted/10 cursor-pointer",
                        )}
                      >
                        <div
                          onClick={() => !isSystem && togglePerm(perm.id)}
                          className={cn(
                            "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all",
                            isSystem ? "cursor-default opacity-70" : "",
                            selected.has(perm.id)
                              ? "border-transparent"
                              : "border-input",
                          )}
                          style={
                            selected.has(perm.id)
                              ? { backgroundColor: "var(--brand-gold)" }
                              : undefined
                          }
                        >
                          {selected.has(perm.id) && (
                            <svg
                              className="w-3 h-3"
                              viewBox="0 0 12 12"
                              fill="none"
                            >
                              <path
                                d="M2 6l3 3 5-5"
                                stroke="#1A1A3E"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {perm.displayName}
                          </p>
                          {perm.description && (
                            <p className="text-xs text-muted-foreground">
                              {perm.description}
                            </p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Save footer (edit mode) */}
        {editing && !isSystem && (
          <div className="px-5 pb-5 flex gap-3">
            <button
              onClick={save}
              disabled={updateRole.isPending}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
              style={{
                backgroundColor: "var(--brand-gold)",
                color: "var(--brand-navy)",
              }}
            >
              {updateRole.isPending && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              Save changes
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
