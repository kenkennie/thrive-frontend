"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCategories } from "../hooks/useServices";

const SERVICE_TYPES = ["TREATMENT", "CONSULTATION", "PACKAGE", "PRODUCT"];
const CURRENCIES = ["KES", "USD"];

const schema = z.object({
  name: z.string().min(2, "Name required"),
  description: z.string().optional(),
  color: z.string().optional(),
  serviceType: z.string().min(1, "Type required"),
  categoryId: z.string().min(1, "Category required"),
  durationMin: z.number().int().positive("Duration required"),
  bufferTimeMin: z.number().int().min(0).optional(),
  price: z.number().positive("Price required"),
  currency: z.string().default("KES"),
  isActive: z.boolean().default(true),
  requiresConsent: z.boolean().default(false),
  maxCapacity: z.number().int().positive().default(1),
});

export type ServiceFormSchema = z.infer<typeof schema>;

interface Props {
  service?: any;
  onSubmit: (data: ServiceFormSchema) => Promise<void>;
  isLoading?: boolean;
  onCancel?: () => void;
}

const inp = (err?: string) =>
  cn(
    "w-full h-10 px-3 rounded-lg border bg-background text-sm text-foreground",
    "placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-shadow",
    err
      ? "border-destructive focus:ring-destructive/20"
      : "border-input focus:ring-ring/30",
  );

export function ServiceForm({ service, onSubmit, isLoading, onCancel }: Props) {
  const { data: cats } = useCategories();
  const categories = Array.isArray(cats) ? cats : [];

  const form = useForm<ServiceFormSchema>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: service?.name ?? "",
      description: service?.description ?? "",
      color: service?.color ?? "#C8A96E",
      serviceType: service?.serviceType ?? "TREATMENT",
      categoryId: service?.category?.id ?? "",
      durationMin: service?.durationMin ?? 60,
      bufferTimeMin: service?.bufferTimeMin ?? 0,
      price: service?.price ?? 0,
      currency: service?.currency ?? "KES",
      isActive: service?.isActive ?? true,
      requiresConsent: service?.requiresConsent ?? false,
      maxCapacity: service?.maxCapacity ?? 1,
    },
  });

  const { errors } = form.formState;
  const color = form.watch("color");
  const isActive = form.watch("isActive");
  const requiresConsent = form.watch("requiresConsent");

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-5"
    >
      {/* Name + Color */}
      <div className="flex gap-3">
        <div className="flex-1 space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            Service name *
          </label>
          <input
            {...form.register("name")}
            placeholder="e.g. Hydra Facial"
            className={inp(errors.name?.message)}
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Colour</label>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg border border-input overflow-hidden shrink-0">
              <input
                type="color"
                {...form.register("color")}
                className="w-full h-full cursor-pointer"
              />
            </div>
            <input
              value={color ?? ""}
              onChange={(e) => form.setValue("color", e.target.value)}
              placeholder="#C8A96E"
              className={cn(inp(), "w-28 font-mono text-xs")}
            />
          </div>
        </div>
      </div>

      {/* Type + Category */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            Service type *
          </label>
          <select
            {...form.register("serviceType")}
            className={cn(inp(errors.serviceType?.message), "cursor-pointer")}
          >
            {SERVICE_TYPES.map((t) => (
              <option
                key={t}
                value={t}
              >
                {t}
              </option>
            ))}
          </select>
          {errors.serviceType && (
            <p className="text-xs text-destructive">
              {errors.serviceType.message}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            Category *
          </label>
          <select
            {...form.register("categoryId")}
            className={cn(inp(errors.categoryId?.message), "cursor-pointer")}
          >
            <option value="">Select category…</option>
            {categories.map((c: any) => (
              <option
                key={c.id}
                value={c.id}
              >
                {c.name}
              </option>
            ))}
          </select>
          {errors.categoryId && (
            <p className="text-xs text-destructive">
              {errors.categoryId.message}
            </p>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">
          Description
        </label>
        <textarea
          {...form.register("description")}
          rows={3}
          placeholder="What's included in this service…"
          className={cn(inp(), "h-auto py-2 resize-none")}
        />
      </div>

      {/* Duration + Buffer + Price + Currency */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            Duration (min) *
          </label>
          <input
            type="number"
            min={5}
            step={5}
            {...form.register("durationMin", { valueAsNumber: true })}
            className={inp(errors.durationMin?.message)}
          />
          {errors.durationMin && (
            <p className="text-xs text-destructive">
              {errors.durationMin.message}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            Buffer (min)
          </label>
          <input
            type="number"
            min={0}
            step={5}
            {...form.register("bufferTimeMin", { valueAsNumber: true })}
            className={inp()}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Price *</label>
          <input
            type="number"
            min={0}
            step={0.01}
            {...form.register("price", { valueAsNumber: true })}
            className={inp(errors.price?.message)}
          />
          {errors.price && (
            <p className="text-xs text-destructive">{errors.price.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            Currency
          </label>
          <select
            {...form.register("currency")}
            className={cn(inp(), "cursor-pointer")}
          >
            {CURRENCIES.map((c) => (
              <option
                key={c}
                value={c}
              >
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Toggles */}
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            {...form.register("isActive")}
            className="accent-[var(--brand-gold)]"
          />
          <span className="text-sm text-foreground">Active</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            {...form.register("requiresConsent")}
            className="accent-[var(--brand-gold)]"
          />
          <span className="text-sm text-foreground">Requires consent form</span>
        </label>
      </div>

      {/* Max capacity */}
      <div className="space-y-1.5 max-w-xs">
        <label className="text-sm font-medium text-foreground">
          Max capacity (clients per slot)
        </label>
        <input
          type="number"
          min={1}
          {...form.register("maxCapacity", { valueAsNumber: true })}
          className={inp()}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-60"
          style={{
            backgroundColor: "var(--brand-gold)",
            color: "var(--brand-navy)",
          }}
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          {service ? "Save changes" : "Create service"}
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
