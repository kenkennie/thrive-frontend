"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCategories } from "../hooks/useServices";
import { Loader2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Constants ─────────────────────────────────────────────────────────────────

const SERVICE_TYPES = [
  { value: "TREATMENT", label: "Treatment" },
  { value: "CONSULTATION", label: "Consultation" },
  { value: "PACKAGE", label: "Package" },
  { value: "PRODUCT", label: "Product" },
];

const CONSULTATION_FEE_MODELS = [
  { value: "STANDALONE", label: "Always charged" },
  { value: "DEDUCTIBLE", label: "Deducted from treatment" },
  { value: "FREE", label: "Waived if treatment booked" },
];

const CURRENCIES = ["KES", "USD"];

// ── Schema ────────────────────────────────────────────────────────────────────

const schema = z.object({
  name: z.string().min(2, "Name required"),
  description: z.string().optional(),
  color: z.string().optional(),
  serviceType: z.string().min(1, "Type required"),
  categoryId: z.string().min(1, "Category required"),
  durationMin: z.number().int().positive("Duration required"),
  cleanupTimeMin: z.number().int().min(0).default(0),
  price: z.number().positive("Price required"),
  currency: z.string().default("KES"),
  isActive: z.boolean().default(true),
  requiresConsent: z.boolean().default(false),
  requiresConsultation: z.boolean().default(false),
  isTaxExempt: z.boolean().default(true),
  depositRequired: z.boolean().default(false),
  consultationFee: z.number().min(0).optional(),
  consultationFeeModel: z.string().optional(),
  depositAmount: z.number().min(0).optional(),
  maxCapacity: z.number().int().positive().default(1),
  minNoticeHours: z
    .number()
    .int()
    .min(0)
    .optional()
    .or(z.nan())
    .transform((v) => (isNaN(v as any) ? undefined : v)),
  maxAdvanceDays: z
    .number()
    .int()
    .min(0)
    .optional()
    .or(z.nan())
    .transform((v) => (isNaN(v as any) ? undefined : v)),
  minAge: z
    .number()
    .int()
    .min(0)
    .optional()
    .or(z.nan())
    .transform((v) => (isNaN(v as any) ? undefined : v)),
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

export type ServiceFormSchema = z.infer<typeof schema>;

interface Props {
  service?: any;
  onSubmit: (data: ServiceFormSchema) => Promise<void>;
  isLoading?: boolean;
  onCancel?: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const inp = (err?: string) =>
  cn(
    "w-full h-10 px-3 rounded-lg border bg-background text-sm text-foreground",
    "placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-shadow",
    err
      ? "border-destructive focus:ring-destructive/20"
      : "border-input focus:ring-ring/30",
  );

function Tooltip({ text }: { text: string }) {
  return (
    <span className="relative group inline-flex items-center">
      <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help ml-1" />
      <span
        className={cn(
          "absolute left-1/2 -translate-x-1/2 bottom-6 z-50 w-56 px-3 py-2 rounded-lg",
          "bg-foreground text-background text-xs leading-relaxed shadow-xl",
          "opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity",
          "whitespace-normal text-center",
        )}
      >
        {text}
      </span>
    </span>
  );
}

function FieldLabel({
  children,
  required,
  tip,
}: {
  children: React.ReactNode;
  required?: boolean;
  tip?: string;
}) {
  return (
    <label className="flex items-center gap-0.5 text-sm font-medium text-foreground mb-1.5">
      {children}
      {required && <span className="text-destructive ml-0.5">*</span>}
      {tip && <Tooltip text={tip} />}
    </label>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="pt-2 pb-1 border-t border-border/60">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {children}
      </p>
    </div>
  );
}

function BigCheckbox({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group select-none p-3 rounded-xl hover:bg-muted/30 transition-colors border border-transparent hover:border-border/60">
      <div className="relative mt-0.5 shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div
          className={cn(
            "w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center",
            checked
              ? "border-transparent"
              : "border-input group-hover:border-primary/50 bg-background",
          )}
          style={checked ? { backgroundColor: "var(--brand-gold)" } : undefined}
        >
          {checked && (
            <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
              <path
                d="M2 6l3 3 5-5"
                stroke="#1A1A2E"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </label>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

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
      cleanupTimeMin: service?.bufferTimeMin ?? 0,
      price: service?.price ?? 0,
      currency: service?.currency ?? "KES",
      isActive: service?.isActive ?? true,
      requiresConsent: service?.requiresConsent ?? false,
      requiresConsultation: service?.requiresConsultation ?? false,
      isTaxExempt: service?.isTaxExempt ?? true,
      depositRequired: service?.depositRequired ?? false,
      consultationFee: service?.consultationFee ?? undefined,
      consultationFeeModel: service?.consultationFeeModel ?? "FREE",
      depositAmount: service?.depositAmount ?? undefined,
      minNoticeHours: service?.minNoticeHours ?? undefined,
      maxAdvanceDays: service?.maxAdvanceDays ?? undefined,
      minAge: service?.minAge ?? undefined,
      maxCapacity: service?.maxCapacity ?? 1,
      imageUrl: service?.imageUrl ?? "",
    },
  });

  const {
    watch,
    setValue,
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  const color = watch("color");
  const serviceType = watch("serviceType");
  const depositRequired = watch("depositRequired");
  const isActive = watch("isActive");
  const isTaxExempt = watch("isTaxExempt");
  const requiresConsent = watch("requiresConsent");
  const requiresConsult = watch("requiresConsultation");
  const feeModel = watch("consultationFeeModel");

  const isConsultation = serviceType === "CONSULTATION";

  const FEE_MODEL_HINTS: Record<string, string> = {
    STANDALONE:
      "The consultation fee is always charged, whether or not the client proceeds to a treatment.",
    DEDUCTIBLE:
      "The consultation fee is deducted from the treatment invoice if the client books a treatment on the same visit.",
    FREE: "The consultation fee is completely waived if the client books a treatment. If they leave without booking, the fee applies.",
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* ── Basic details ── */}
      <div className="flex gap-3">
        <div className="flex-1">
          <FieldLabel
            required
            tip="The name clients see when browsing or booking this service"
          >
            Service name
          </FieldLabel>
          <input
            {...register("name")}
            placeholder="e.g. Hydra Facial"
            className={inp(errors.name?.message)}
          />
          {errors.name && (
            <p className="text-xs text-destructive mt-1">
              {errors.name.message}
            </p>
          )}
        </div>
        <div>
          <FieldLabel tip="Colour used to identify this service on the appointments calendar">
            Colour
          </FieldLabel>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg border border-input overflow-hidden shrink-0">
              <input
                type="color"
                {...register("color")}
                className="w-full h-full cursor-pointer"
              />
            </div>
            <input
              value={color ?? ""}
              onChange={(e) => setValue("color", e.target.value)}
              placeholder="#C8A96E"
              className={cn(inp(), "w-28 font-mono text-xs")}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel
            required
            tip="Treatment = a hands-on procedure (e.g. Botox, Facial). Consultation = an assessment or advice session only. Package = a bundle of treatments. Product = a retail item."
          >
            Service type
          </FieldLabel>
          <select
            {...register("serviceType")}
            className={cn(inp(errors.serviceType?.message), "cursor-pointer")}
          >
            {SERVICE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          {errors.serviceType && (
            <p className="text-xs text-destructive mt-1">
              {errors.serviceType.message}
            </p>
          )}
        </div>
        <div>
          <FieldLabel
            required
            tip="The treatment category this service belongs to, e.g. Skin, Hair, Body"
          >
            Category
          </FieldLabel>
          <select
            {...register("categoryId")}
            className={cn(inp(errors.categoryId?.message), "cursor-pointer")}
          >
            <option value="">Select category…</option>
            {categories.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {errors.categoryId && (
            <p className="text-xs text-destructive mt-1">
              {errors.categoryId.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <FieldLabel>Description</FieldLabel>
        <textarea
          {...register("description")}
          rows={3}
          placeholder="What's included, what to expect, preparation tips…"
          className={cn(inp(), "h-auto py-2 resize-none")}
        />
      </div>

      <div>
        <FieldLabel tip="Optional photo shown in the client booking portal">
          Service image URL
        </FieldLabel>
        <input
          {...register("imageUrl")}
          placeholder="https://…"
          className={inp(errors.imageUrl?.message)}
        />
        {errors.imageUrl && (
          <p className="text-xs text-destructive mt-1">
            {errors.imageUrl.message}
          </p>
        )}
      </div>

      {/* ── Timing & Pricing ── */}
      <SectionHeading>Timing & pricing</SectionHeading>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <FieldLabel
            required
            tip="How long the service takes from start to finish, in minutes"
          >
            Duration (min)
          </FieldLabel>
          <input
            type="number"
            min={5}
            step={5}
            {...register("durationMin", { valueAsNumber: true })}
            className={inp(errors.durationMin?.message)}
          />
          {errors.durationMin && (
            <p className="text-xs text-destructive mt-1">
              {errors.durationMin.message}
            </p>
          )}
        </div>
        <div>
          <FieldLabel tip="Extra time after the session for cleaning and preparing the room for the next client. Not shown to clients.">
            Room turnaround (min)
          </FieldLabel>
          <input
            type="number"
            min={0}
            step={5}
            {...register("cleanupTimeMin", { valueAsNumber: true })}
            className={inp()}
          />
        </div>
        <div>
          <FieldLabel required>Price</FieldLabel>
          <input
            type="number"
            min={0}
            step={0.01}
            {...register("price", { valueAsNumber: true })}
            className={inp(errors.price?.message)}
          />
          {errors.price && (
            <p className="text-xs text-destructive mt-1">
              {errors.price.message}
            </p>
          )}
        </div>
        <div>
          <FieldLabel>Currency</FieldLabel>
          <select
            {...register("currency")}
            className={cn(inp(), "cursor-pointer")}
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Booking rules ── */}
      <SectionHeading>Booking rules</SectionHeading>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <FieldLabel tip="How many clients can attend this service at the same time slot">
            Clients per slot
          </FieldLabel>
          <input
            type="number"
            min={1}
            {...register("maxCapacity", { valueAsNumber: true })}
            className={inp()}
          />
        </div>
        <div>
          <FieldLabel tip="Minimum age a client must be to book this service. Leave blank for no restriction.">
            Min age (yrs)
          </FieldLabel>
          <input
            type="number"
            min={0}
            placeholder="None"
            {...register("minAge", { valueAsNumber: true })}
            className={inp()}
          />
        </div>
        <div>
          <FieldLabel tip="How many hours before the appointment a client must book. E.g. 24 means no same-day bookings.">
            Earliest booking (hrs)
          </FieldLabel>
          <input
            type="number"
            min={0}
            placeholder="e.g. 24"
            {...register("minNoticeHours", { valueAsNumber: true })}
            className={inp()}
          />
        </div>
        <div>
          <FieldLabel tip="How many days in advance clients can book. Leave blank to use the clinic-wide setting.">
            Furthest booking (days)
          </FieldLabel>
          <input
            type="number"
            min={0}
            placeholder="e.g. 90"
            {...register("maxAdvanceDays", { valueAsNumber: true })}
            className={inp()}
          />
        </div>
      </div>

      {/* ── Consultation fee — only for CONSULTATION type ── */}
      {isConsultation && (
        <>
          <SectionHeading>Consultation fee</SectionHeading>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel tip="The fee for the consultation itself. This is separate from any treatment price.">
                Consultation fee
              </FieldLabel>
              <input
                type="number"
                min={0}
                step={0.01}
                placeholder="e.g. 2000"
                {...register("consultationFee", { valueAsNumber: true })}
                className={inp()}
              />
            </div>
            <div>
              <FieldLabel tip="What happens to this fee when the client also books a treatment on the same visit">
                If client books a treatment…
              </FieldLabel>
              <select
                {...register("consultationFeeModel")}
                className={cn(inp(), "cursor-pointer")}
              >
                {CONSULTATION_FEE_MODELS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {feeModel && FEE_MODEL_HINTS[feeModel] && (
            <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/40 rounded-xl">
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-800 dark:text-blue-300">
                {FEE_MODEL_HINTS[feeModel]}
              </p>
            </div>
          )}
        </>
      )}

      {/* ── Deposit ── */}
      <SectionHeading>Deposit</SectionHeading>

      <BigCheckbox
        label="Require a deposit to confirm booking"
        description="Client pays a deposit upfront when booking. The remaining balance is collected at the appointment."
        checked={depositRequired}
        onChange={(v) => setValue("depositRequired", v)}
      />

      {depositRequired && (
        <div className="pl-8">
          <FieldLabel tip="The amount the client must pay upfront to secure their booking">
            Deposit amount
          </FieldLabel>
          <input
            type="number"
            min={0}
            step={0.01}
            placeholder="e.g. 1500"
            {...register("depositAmount", { valueAsNumber: true })}
            className={cn(inp(), "max-w-xs")}
          />
        </div>
      )}

      {/* ── Settings ── */}
      <SectionHeading>Settings</SectionHeading>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <BigCheckbox
          label="Service is active"
          description="When off, this service is hidden from the booking calendar and cannot be selected for new appointments."
          checked={isActive}
          onChange={(v) => setValue("isActive", v)}
        />
        <BigCheckbox
          label="Requires consultation first"
          description="Clients must have a consultation before this treatment. Prevents direct booking without seeing a doctor first."
          checked={requiresConsult}
          onChange={(v) => setValue("requiresConsultation", v)}
        />
        <BigCheckbox
          label="Client must sign a consent form"
          description="A digital consent form is sent to the client before their appointment and must be completed."
          checked={requiresConsent}
          onChange={(v) => setValue("requiresConsent", v)}
        />
        <BigCheckbox
          label="Exempt from VAT"
          description="No VAT is added to this service. Uncheck only if this specific service attracts tax."
          checked={isTaxExempt}
          onChange={(v) => setValue("isTaxExempt", v)}
        />
      </div>

      {/* ── Actions ── */}
      <div className="flex gap-3 pt-4 border-t border-border/60">
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
