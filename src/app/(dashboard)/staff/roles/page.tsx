"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useRoles,
  useRole,
  useAllPermissions,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
} from "@/features/staff/hooks/useStaff";
import { usePermission } from "@/hooks/usePermission";
import { cn } from "@/lib/utils";
import {
  Plus,
  Search,
  X,
  ChevronRight,
  Shield,
  Trash2,
  Loader2,
  Check,
  Edit2,
  ArrowLeft,
} from "lucide-react";
import { useRouter } from "next/navigation";

const schema = z.object({
  name: z
    .string()
    .min(2, "Name required")
    .regex(/^[a-z0-9_]+$/, "Lowercase, numbers and underscores only"),
  displayName: z.string().min(2, "Display name required"),
  description: z.string().optional(),
  permissionIds: z.array(z.string()).min(1, "Select at least one permission"),
});
type Schema = z.infer<typeof schema>;

const inp = (err?: string) =>
  cn(
    "w-full h-10 px-3 rounded-lg border bg-background text-sm text-foreground",
    "placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-shadow",
    err
      ? "border-destructive focus:ring-destructive/20"
      : "border-input focus:ring-ring/30",
  );

// ── Permission picker ─────────────────────────────────────────────────────────

function PermissionPicker({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const { data } = useAllPermissions();
  const perms = Array.isArray(data) ? data : [];
  const [search, setSearch] = useState("");
  const [module, setModule] = useState("");

  const modules = Array.from(new Set(perms.map((p: any) => p.module))).sort();

  const filtered = perms.filter((p: any) => {
    const ms =
      !search ||
      p.name.includes(search.toLowerCase()) ||
      p.displayName.toLowerCase().includes(search.toLowerCase());
    const mm = !module || p.module === module;
    return ms && mm;
  });

  const toggle = (id: string) => {
    onChange(
      selected.includes(id)
        ? selected.filter((s) => s !== id)
        : [...selected, id],
    );
  };

  const selectModule = (mod: string) => {
    const modulePerms = perms
      .filter((p: any) => p.module === mod)
      .map((p: any) => p.id);
    const allSelected = modulePerms.every((id) => selected.includes(id));
    if (allSelected)
      onChange(selected.filter((id) => !modulePerms.includes(id)));
    else onChange(Array.from(new Set([...selected, ...modulePerms])));
  };

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 p-2.5 border-b border-border bg-muted/20 flex-wrap">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            className="h-7 pl-7 pr-2 text-xs rounded-md border border-input bg-background focus:outline-none w-40"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => setModule("")}
            className={cn(
              "px-2 py-0.5 rounded text-xs transition-colors",
              !module
                ? "text-brand-navy"
                : "text-muted-foreground hover:bg-muted",
            )}
            style={
              !module ? { backgroundColor: "var(--brand-gold)" } : undefined
            }
          >
            All
          </button>
          {modules.map((m) => (
            <button
              key={m as string}
              type="button"
              onClick={() => setModule(module === m ? "" : (m as string))}
              className={cn(
                "px-2 py-0.5 rounded text-xs transition-colors",
                module === m
                  ? "text-brand-navy"
                  : "text-muted-foreground hover:bg-muted",
              )}
              style={
                module === m
                  ? { backgroundColor: "var(--brand-gold)" }
                  : undefined
              }
            >
              {m as string}
            </button>
          ))}
        </div>
      </div>

      {/* Module select-all */}
      {module && (
        <button
          type="button"
          onClick={() => selectModule(module)}
          className="w-full text-left px-3 py-2 text-xs text-primary hover:bg-muted/30 border-b border-border transition-colors"
        >
          {perms
            .filter((p: any) => p.module === module)
            .every((p: any) => selected.includes(p.id))
            ? "✓ Deselect all in module"
            : "+ Select all in module"}
        </button>
      )}

      <div className="max-h-64 overflow-y-auto divide-y divide-border/40">
        {filtered.map((p: any) => (
          <label
            key={p.id}
            className="flex items-center gap-3 px-3 py-2 hover:bg-muted/20 cursor-pointer transition-colors"
          >
            <input
              type="checkbox"
              checked={selected.includes(p.id)}
              onChange={() => toggle(p.id)}
              className="accent-[var(--brand-gold)]"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground">
                {p.displayName}
              </p>
              <p className="text-[10px] text-muted-foreground font-mono">
                {p.name}
              </p>
            </div>
          </label>
        ))}
      </div>

      <div className="px-3 py-2 border-t border-border bg-muted/20 text-xs text-muted-foreground">
        {selected.length} of {perms.length} selected
      </div>
    </div>
  );
}

// ── Role form ─────────────────────────────────────────────────────────────────

function RoleForm({ role, onDone }: { role?: any; onDone: () => void }) {
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const isEdit = !!role;

  const form = useForm<Schema>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: role?.name ?? "",
      displayName: role?.displayName ?? "",
      description: role?.description ?? "",
      permissionIds:
        role?.rolePermissions?.map((rp: any) => rp.permission.id) ?? [],
    },
  });
  const { errors } = form.formState;
  const selected = form.watch("permissionIds");

  return (
    <form
      onSubmit={form.handleSubmit(async (d) => {
        if (isEdit) await updateRole.mutateAsync({ id: role.id, ...d });
        else await createRole.mutateAsync(d);
        onDone();
      })}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            System name
          </label>
          <input
            {...form.register("name")}
            disabled={isEdit}
            placeholder="e.g. senior_doctor"
            className={
              inp(errors.name?.message) +
              (isEdit ? " opacity-50 cursor-not-allowed" : "")
            }
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            Display name
          </label>
          <input
            {...form.register("displayName")}
            placeholder="e.g. Senior Doctor"
            className={inp(errors.displayName?.message)}
          />
          {errors.displayName && (
            <p className="text-xs text-destructive">
              {errors.displayName.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">
          Description
        </label>
        <textarea
          {...form.register("description")}
          rows={2}
          placeholder="What this role is for…"
          className={inp() + " h-auto py-2 resize-none"}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">
          Permissions
        </label>
        {errors.permissionIds && (
          <p className="text-xs text-destructive">
            {errors.permissionIds.message}
          </p>
        )}
        <PermissionPicker
          selected={selected}
          onChange={(ids) =>
            form.setValue("permissionIds", ids, { shouldValidate: true })
          }
        />
      </div>

      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={createRole.isPending || updateRole.isPending}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-60"
          style={{
            backgroundColor: "var(--brand-gold)",
            color: "var(--brand-navy)",
          }}
        >
          {(createRole.isPending || updateRole.isPending) && (
            <Loader2 className="w-4 h-4 animate-spin" />
          )}
          {isEdit ? "Save changes" : "Create role"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="px-5 py-2.5 rounded-lg text-sm border border-border hover:bg-muted transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function RolesPage() {
  const router = useRouter();
  const { data } = useRoles();
  const roles = Array.isArray(data) ? data : [];

  const deleteRole = useDeleteRole();
  const canManage = usePermission("roles:create");

  const [showCreate, setShowCreate] = useState(false);
  const [editRole, setEditRole] = useState<any>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: roleDetail } = useRole(selectedId ?? "");

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Staff
        </button>
        <h1 className="text-base font-semibold text-foreground">
          Role Management
        </h1>
        {canManage && (
          <button
            onClick={() => setShowCreate(true)}
            className="ml-auto flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium"
            style={{
              backgroundColor: "var(--brand-gold)",
              color: "var(--brand-navy)",
            }}
          >
            <Plus className="w-4 h-4" />
            New Role
          </button>
        )}
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">
              Create Role
            </h2>
            <button
              onClick={() => setShowCreate(false)}
              className="p-1 rounded-md hover:bg-muted text-muted-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <RoleForm onDone={() => setShowCreate(false)} />
        </div>
      )}

      {/* Edit form */}
      {editRole && (
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">
              Edit Role — {editRole.displayName}
            </h2>
            <button
              onClick={() => setEditRole(null)}
              className="p-1 rounded-md hover:bg-muted text-muted-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <RoleForm role={editRole} onDone={() => setEditRole(null)} />
        </div>
      )}

      {/* Role list + detail */}
      <div className="flex gap-4">
        {/* List */}
        <div className="flex-1 bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/20">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Roles ({roles.length})
            </p>
          </div>
          <div className="divide-y divide-border">
            {roles.map((role: any) => (
              <button
                key={role.id}
                onClick={() =>
                  setSelectedId(selectedId === role.id ? null : role.id)
                }
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors group",
                  selectedId === role.id ? "bg-primary/5" : "hover:bg-muted/20",
                )}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor:
                      selectedId === role.id
                        ? "var(--brand-gold)"
                        : "hsl(var(--muted))",
                    color:
                      selectedId === role.id
                        ? "var(--brand-navy)"
                        : "hsl(var(--muted-foreground))",
                  }}
                >
                  <Shield className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">
                      {role.displayName}
                    </p>
                    {role.isSystem && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        system
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {role._count?.userRoles ?? 0} members ·{" "}
                    {role._count?.rolePermissions ?? 0} permissions
                  </p>
                </div>

                {!role.isSystem && canManage && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditRole(roleDetail ?? role);
                      }}
                      className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete role "${role.displayName}"?`))
                          deleteRole.mutate(role.id);
                      }}
                      className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <ChevronRight
                  className={cn(
                    "w-4 h-4 text-muted-foreground transition-transform",
                    selectedId === role.id && "rotate-90",
                  )}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Detail */}
        {selectedId && roleDetail && (
          <div className="w-72 shrink-0 bg-card rounded-2xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-muted/20">
              <p className="text-sm font-semibold text-foreground">
                {roleDetail.displayName}
              </p>
              {roleDetail.description && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {roleDetail.description}
                </p>
              )}
            </div>
            <div className="p-3 max-h-[60vh] overflow-y-auto">
              {/* Group permissions by module */}
              {(() => {
                const perms = (roleDetail.rolePermissions ?? []).map(
                  (rp: any) => rp.permission,
                );
                const grouped = perms.reduce((acc: any, p: any) => {
                  if (!acc[p.module]) acc[p.module] = [];
                  acc[p.module].push(p);
                  return acc;
                }, {});
                return Object.entries(grouped).map(([mod, mperms]) => (
                  <div key={mod} className="mb-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 px-1">
                      {mod}
                    </p>
                    <div className="space-y-1">
                      {(mperms as any[]).map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center gap-2 px-2 py-1 rounded-lg bg-muted/30"
                        >
                          <Check className="w-3 h-3 text-green-500 shrink-0" />
                          <p className="text-xs text-foreground">
                            {p.displayName}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
