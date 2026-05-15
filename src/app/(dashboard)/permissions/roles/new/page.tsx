"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAllPermissions } from "@/features/staff/hooks/useStaff";
import { toast } from "sonner";
import staffApi from "@/lib/api/staff";
import { extractArray } from "@/lib/api/response";
import { cn } from "@/lib/utils";
import { ArrowLeft, Loader2, ChevronDown, ChevronUp } from "lucide-react";

const inp = cn(
  "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30",
);

export default function NewRolePage() {
  const router = useRouter();
  const qc = useQueryClient();

  const { data: allPerms = {} } = useAllPermissions();
  const modules = Object.keys(allPerms as Record<string, any[]>).sort();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const form = useForm({
    defaultValues: { name: "", displayName: "", description: "" },
  });

  const create = useMutation({
    mutationFn: (dto: any) =>
      staffApi.getAllRoles().then(() =>
        fetch("/api/v1/permissions/roles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dto),
        }).then((r) => r.json()),
      ),
    // Use the api client directly
    onSuccess: () => {
      toast.success("Role created");
      qc.invalidateQueries({ queryKey: ["roles"] });
      router.push("/permissions");
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  // Use api client
  const createRole = useMutation({
    mutationFn: (dto: any) =>
      (staffApi as any).createRole
        ? (staffApi as any).createRole(dto)
        : fetch(
            `${process.env.NEXT_PUBLIC_API_URL ?? ""}/api/v1/permissions/roles`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${document.cookie.match(/accessToken=([^;]+)/)?.[1] ?? ""}`,
              },
              body: JSON.stringify(dto),
            },
          ).then((r) => {
            if (!r.ok) return r.json().then((e) => Promise.reject(e));
            return r.json();
          }),
    onSuccess: () => {
      toast.success("Role created");
      qc.invalidateQueries({ queryKey: ["roles"] });
      router.push("/permissions");
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message ?? e?.message ?? "Failed"),
  });

  const togglePerm = (id: string) =>
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
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

  const onSubmit = form.handleSubmit((d) => {
    if (selected.size === 0) {
      toast.error("Select at least one permission");
      return;
    }
    createRole.mutate({ ...d, permissionIds: Array.from(selected) });
  });

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Permissions
      </button>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border bg-muted/20">
          <h1 className="text-base font-semibold text-foreground">
            New custom role
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            System roles cannot be edited. Create custom roles for specific
            workflows.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="p-5 space-y-5"
        >
          {/* Basic info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Internal name *
              </label>
              <input
                {...form.register("name")}
                placeholder="e.g. senior_doctor"
                className={inp}
              />
              <p className="text-[10px] text-muted-foreground">
                Lowercase, underscores only. Cannot be changed.
              </p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Display name *
              </label>
              <input
                {...form.register("displayName")}
                placeholder="e.g. Senior Doctor"
                className={inp}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Description
            </label>
            <input
              {...form.register("description")}
              placeholder="What this role is for…"
              className={inp}
            />
          </div>

          {/* Permissions picker */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-foreground">
                Permissions ({selected.size} selected)
              </p>
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear all
              </button>
            </div>

            <div className="space-y-2">
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
                      {/* Module select-all */}
                      <button
                        type="button"
                        onClick={() => toggleModule(mod)}
                        className={cn(
                          "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all",
                          allSel
                            ? "border-transparent"
                            : selCount > 0
                              ? "border-primary bg-primary/20"
                              : "border-input",
                        )}
                        style={
                          allSel
                            ? { backgroundColor: "var(--brand-gold)" }
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
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/10 cursor-pointer"
                          >
                            <div
                              onClick={() => togglePerm(perm.id)}
                              className={cn(
                                "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all",
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
          </div>

          <div className="flex gap-3 pt-2 border-t border-border/60">
            <button
              type="submit"
              disabled={createRole.isPending}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
              style={{
                backgroundColor: "var(--brand-gold)",
                color: "var(--brand-navy)",
              }}
            >
              {createRole.isPending && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              Create role
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2.5 rounded-lg text-sm border border-border hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
