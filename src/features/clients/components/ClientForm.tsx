"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api/client";
import type { Client } from "@/lib/api/clients";

const schema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  phoneNumber: z.string().min(9, "Valid phone number required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  dateOfBirth: z.string().optional(),
  genderId: z.string().optional(),
  skinTypeId: z.string().optional(),
  allergies: z.string().optional(),
  medicalNotes: z.string().optional(),
});

type Schema = z.infer<typeof schema>;

interface Props {
  client?: Client;
  onSubmit: (data: Schema) => Promise<void>;
  isLoading?: boolean;
  onCancel?: () => void;
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

const inputCls = (err?: string) =>
  cn(
    "w-full h-10 px-3 rounded-lg border bg-background text-sm text-foreground",
    "placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-shadow",
    err
      ? "border-destructive focus:ring-destructive/20"
      : "border-input focus:ring-ring/30",
  );

export function ClientForm({ client, onSubmit, isLoading, onCancel }: Props) {
  const form = useForm<Schema>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: client?.fullName ?? "",
      phoneNumber: client?.phoneNumber ?? "",
      email: client?.email ?? "",
      dateOfBirth: client?.dateOfBirth?.split("T")[0] ?? "",
      genderId: client?.gender?.id ?? "",
      skinTypeId: client?.skinType?.id ?? "",
      allergies: client?.allergies ?? "",
      medicalNotes: client?.medicalNotes ?? "",
    },
  });

  const { data: genders } = useQuery({
    queryKey: ["settings", "genders"],
    queryFn: () =>
      api
        .get("/settings/genders")
        .then((r) => (r.data as any).data as { id: string; label: string }[]),
  });
  const { data: skinTypes } = useQuery({
    queryKey: ["settings", "skinTypes"],
    queryFn: () =>
      api
        .get("/settings/skin-types")
        .then((r) => (r.data as any).data as { id: string; label: string }[]),
  });

  const { errors } = form.formState;

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-5"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field
          label="Full name *"
          error={errors.fullName?.message}
        >
          <input
            {...form.register("fullName")}
            placeholder="Jane Doe"
            className={inputCls(errors.fullName?.message)}
          />
        </Field>
        <Field
          label="Phone number *"
          error={errors.phoneNumber?.message}
        >
          <input
            {...form.register("phoneNumber")}
            placeholder="+254 7XX XXX XXX"
            className={inputCls(errors.phoneNumber?.message)}
          />
        </Field>
      </div>

      <Field
        label="Email"
        error={errors.email?.message}
      >
        <input
          {...form.register("email")}
          type="email"
          placeholder="jane@example.com"
          className={inputCls(errors.email?.message)}
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field label="Date of birth">
          <input
            {...form.register("dateOfBirth")}
            type="date"
            className={inputCls()}
          />
        </Field>
        <Field label="Gender">
          <select
            {...form.register("genderId")}
            className={cn(inputCls(), "cursor-pointer")}
          >
            <option value="">Select…</option>
            {genders?.map((g) => (
              <option
                key={g.id}
                value={g.id}
              >
                {g.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Skin type">
          <select
            {...form.register("skinTypeId")}
            className={cn(inputCls(), "cursor-pointer")}
          >
            <option value="">Select…</option>
            {skinTypes?.map((s) => (
              <option
                key={s.id}
                value={s.id}
              >
                {s.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Known allergies">
        <textarea
          {...form.register("allergies")}
          rows={2}
          placeholder="List any known allergies…"
          className={cn(inputCls(), "h-auto py-2 resize-none")}
        />
      </Field>

      <Field label="Medical notes">
        <textarea
          {...form.register("medicalNotes")}
          rows={3}
          placeholder="Relevant medical history, conditions, medications…"
          className={cn(inputCls(), "h-auto py-2 resize-none")}
        />
      </Field>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-60 transition-all"
          style={{
            backgroundColor: "var(--brand-gold)",
            color: "var(--brand-navy)",
          }}
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          {client ? "Save changes" : "Create client"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-lg text-sm border border-border hover:bg-muted transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
