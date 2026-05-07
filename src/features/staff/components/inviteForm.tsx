"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useInviteStaff } from "../hooks/useStaff";
import { useRoles } from "../hooks/useStaff";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const schema = z.object({
  fullName: z.string().min(2, "Name required"),
  email: z.string().email("Valid email required"),
  roleIds: z.array(z.string()).min(1, "Select at least one role"),
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

interface Props {
  onDone: () => void;
}

export function InviteForm({ onDone }: Props) {
  const invite = useInviteStaff();
  const { data: roles } = useRoles();
  const allRoles = Array.isArray(roles) ? roles : [];

  const form = useForm<Schema>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: "", email: "", roleIds: [] },
  });
  const { errors } = form.formState;

  const selectedRoles = form.watch("roleIds");

  const toggleRole = (id: string) => {
    const current = form.getValues("roleIds");
    const next = current.includes(id)
      ? current.filter((r) => r !== id)
      : [...current, id];
    form.setValue("roleIds", next, { shouldValidate: true });
  };

  return (
    <form
      onSubmit={form.handleSubmit(async (d) => {
        await invite.mutateAsync(d);
        onDone();
      })}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            Full name
          </label>
          <input
            {...form.register("fullName")}
            placeholder="Jane Doe"
            className={inp(errors.fullName?.message)}
          />
          {errors.fullName && (
            <p className="text-xs text-destructive">
              {errors.fullName.message}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            Email address
          </label>
          <input
            {...form.register("email")}
            type="email"
            placeholder="jane@clinic.com"
            className={inp(errors.email?.message)}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">Roles</label>
        <div className="flex flex-wrap gap-2">
          {allRoles.map((role: any) => (
            <button
              key={role.id}
              type="button"
              onClick={() => toggleRole(role.id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                selectedRoles.includes(role.id)
                  ? "border-transparent text-brand-navy"
                  : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
              style={
                selectedRoles.includes(role.id)
                  ? { backgroundColor: "var(--brand-gold)" }
                  : undefined
              }
            >
              {role.displayName}
            </button>
          ))}
        </div>
        {errors.roleIds && (
          <p className="text-xs text-destructive">{errors.roleIds.message}</p>
        )}
      </div>

      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={invite.isPending}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-60"
          style={{
            backgroundColor: "var(--brand-gold)",
            color: "var(--brand-navy)",
          }}
        >
          {invite.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          Send invite
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
