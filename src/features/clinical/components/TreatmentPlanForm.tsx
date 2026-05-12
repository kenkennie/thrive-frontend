// src/features/clinical/components/TreatmentPlanForm.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { listClients } from "@/lib/api/clients";
import { extractArray } from "@/lib/api/response";
import api from "@/lib/api/client";
import { Loader2, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

const schema = z.object({
  clientId: z.string().min(1, "Client required"),
  doctorId: z.string().min(1, "Doctor required"),
  title: z.string().min(2, "Title required"),
  description: z.string().optional(),
  totalSessions: z.number().int().positive("At least 1 session"),
  sessionFrequencyDays: z.number().int().positive().optional(),
  paymentModel: z.enum(["PER_SESSION", "UPFRONT", "DEPOSIT"]),
  totalPrice: z.number().positive().optional(),
  depositAmount: z.number().positive().optional(),
  notes: z.string().optional(),
  generateQuote: z.boolean().default(false),
  currency: z.string().default("KES"),
});

export type TreatmentPlanFormSchema = z.infer<typeof schema>;

interface Props {
  plan?: any;
  onSubmit: (data: TreatmentPlanFormSchema) => Promise<void>;
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

const PAYMENT_MODEL_INFO = {
  PER_SESSION: "Invoice generated after each completed session",
  UPFRONT: "Full payment invoiced upfront when plan starts",
  DEPOSIT:
    "Deposit collected upfront, balance settled per session or at completion",
};

// ── Client search ─────────────────────────────────────────────────────────────

function ClientSearch({
  value,
  onChange,
  error,
  defaultName,
}: {
  value: string;
  onChange: (id: string, name: string) => void;
  error?: string;
  defaultName?: string;
}) {
  const [q, setQ] = useState(defaultName ?? "");
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState(defaultName ?? "");

  const { data } = useQuery({
    queryKey: ["clients", "search", q],
    queryFn: () => listClients({ search: q, limit: 8 }),
    enabled: q.length >= 1,
    select: (res) => extractArray(res),
  });
  const clients: any[] = data ?? [];

  return (
    <div className="relative">
      <div
        className={cn(
          "flex items-center gap-2 h-10 px-3 rounded-lg border bg-background text-sm transition-shadow",
          error
            ? "border-destructive"
            : "border-input focus-within:ring-2 focus-within:ring-ring/30",
        )}
      >
        <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <input
          value={label || q}
          onChange={(e) => {
            setQ(e.target.value);
            setLabel("");
            setOpen(true);
          }}
          onFocus={() => q && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search by name or phone…"
          className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange("", "");
              setLabel("");
              setQ("");
            }}
          >
            <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
          </button>
        )}
      </div>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
      {open && clients.length > 0 && (
        <div className="absolute left-0 right-0 top-11 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden max-h-52 overflow-y-auto">
          {clients.map((c) => (
            <button
              key={c.id}
              type="button"
              onMouseDown={() => {
                onChange(c.id, c.fullName);
                setLabel(c.fullName);
                setQ("");
                setOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted transition-colors"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{
                  backgroundColor: "var(--brand-gold)",
                  color: "var(--brand-navy)",
                }}
              >
                {c.fullName
                  .split(" ")
                  .map((n: string) => n[0])
                  .slice(0, 2)
                  .join("")}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground truncate">
                  {c.fullName}
                </p>
                <p className="text-xs text-muted-foreground">{c.phoneNumber}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export function TreatmentPlanForm({
  plan,
  onSubmit,
  isLoading,
  onCancel,
}: Props) {
  const form = useForm<TreatmentPlanFormSchema>({
    resolver: zodResolver(schema),
    defaultValues: {
      clientId: plan?.client?.id ?? "",
      doctorId: plan?.doctor?.id ?? "",
      title: plan?.title ?? "",
      description: plan?.description ?? "",
      totalSessions: plan?.totalSessions ?? 6,
      sessionFrequencyDays: plan?.sessionFrequencyDays ?? undefined,
      paymentModel: plan?.paymentModel ?? "PER_SESSION",
      totalPrice: plan?.totalPrice ?? undefined,
      depositAmount: plan?.depositAmount ?? undefined,
      notes: plan?.notes ?? "",
      generateQuote: false,
      currency: "KES",
    },
  });

  const {
    register,
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
  } = form;
  const paymentModel = watch("paymentModel");
  const generateQuote = watch("generateQuote");

  // Doctors list
  const { data: drData } = useQuery({
    queryKey: ["all-doctors"],
    queryFn: () => api.get("/users?role=doctor&limit=50"),
    select: (res) => extractArray(res),
  });
  const doctors: any[] = Array.isArray(drData) ? drData : [];

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5"
    >
      {/* Client + Doctor */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            Client *
          </label>
          <ClientSearch
            value={form.watch("clientId")}
            defaultName={plan?.client?.fullName}
            onChange={(id) =>
              setValue("clientId", id, { shouldValidate: true })
            }
            error={errors.clientId?.message}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            Doctor *
          </label>
          <select
            {...register("doctorId")}
            className={cn(inp(errors.doctorId?.message), "cursor-pointer")}
          >
            <option value="">Select doctor…</option>
            {doctors.map((d) => (
              <option
                key={d.id}
                value={d.id}
              >
                {d.fullName}
              </option>
            ))}
          </select>
          {errors.doctorId && (
            <p className="text-xs text-destructive">
              {errors.doctorId.message}
            </p>
          )}
        </div>
      </div>

      {/* Title + Description */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            Plan title *
          </label>
          <input
            {...register("title")}
            placeholder="e.g. Hair Loss PRP Therapy — 6 Sessions"
            className={inp(errors.title?.message)}
          />
          {errors.title && (
            <p className="text-xs text-destructive">{errors.title.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            Description
          </label>
          <textarea
            {...register("description")}
            rows={2}
            placeholder="Goals, protocol overview, what to expect…"
            className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm text-foreground resize-none placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </div>
      </div>

      {/* Sessions + Frequency */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            Total sessions *
          </label>
          <input
            type="number"
            min={1}
            max={50}
            {...register("totalSessions", { valueAsNumber: true })}
            className={inp(errors.totalSessions?.message)}
          />
          {errors.totalSessions && (
            <p className="text-xs text-destructive">
              {errors.totalSessions.message}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            Interval between sessions (days)
          </label>
          <input
            type="number"
            min={1}
            placeholder="e.g. 28"
            {...register("sessionFrequencyDays", { valueAsNumber: true })}
            className={inp()}
          />
        </div>
      </div>

      {/* Payment model */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Payment model *
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(["PER_SESSION", "UPFRONT", "DEPOSIT"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setValue("paymentModel", m)}
              className={cn(
                "flex flex-col items-start p-3 rounded-xl border text-left transition-all",
                paymentModel === m
                  ? "border-transparent shadow-sm"
                  : "border-border hover:border-primary/30",
              )}
              style={
                paymentModel === m
                  ? {
                      backgroundColor: "var(--brand-gold)",
                      color: "var(--brand-navy)",
                    }
                  : undefined
              }
            >
              <p className="text-xs font-semibold">{m.replace("_", " ")}</p>
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground px-1">
          {PAYMENT_MODEL_INFO[paymentModel]}
        </p>
      </div>

      {/* Pricing */}
      {paymentModel !== "PER_SESSION" && (
        <div className="grid grid-cols-2 gap-3">
          {(paymentModel === "UPFRONT" || paymentModel === "DEPOSIT") && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Total plan price (KES)
              </label>
              <input
                type="number"
                min={0}
                step={0.01}
                {...register("totalPrice", { valueAsNumber: true })}
                className={inp()}
              />
            </div>
          )}
          {paymentModel === "DEPOSIT" && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Deposit amount (KES)
              </label>
              <input
                type="number"
                min={0}
                step={0.01}
                {...register("depositAmount", { valueAsNumber: true })}
                className={inp()}
              />
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">
          Internal notes
        </label>
        <textarea
          {...register("notes")}
          rows={2}
          placeholder="Protocol details, contraindications to monitor, goals…"
          className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm text-foreground resize-none placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
        />
      </div>

      {/* Auto-generate quote */}
      {!plan && paymentModel !== "PER_SESSION" && (
        <label className="flex items-center gap-3 cursor-pointer select-none p-3 rounded-xl hover:bg-muted/30 transition-colors border border-transparent hover:border-border/60">
          <div
            className={cn(
              "w-5 h-5 shrink-0 rounded-md border-2 flex items-center justify-center transition-all",
              generateQuote ? "border-transparent" : "border-input",
            )}
            style={
              generateQuote
                ? { backgroundColor: "var(--brand-gold)" }
                : undefined
            }
            onClick={() => setValue("generateQuote", !generateQuote)}
          >
            {generateQuote && (
              <svg
                className="w-3 h-3"
                viewBox="0 0 12 12"
                fill="none"
              >
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
          <div>
            <p className="text-sm font-medium text-foreground">
              Auto-generate quote
            </p>
            <p className="text-xs text-muted-foreground">
              Creates a draft quote for the full plan price to send to the
              client
            </p>
          </div>
        </label>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2 border-t border-border/60">
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-1.5 px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-60 transition-all"
          style={{
            backgroundColor: "var(--brand-gold)",
            color: "var(--brand-navy)",
          }}
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          {plan ? "Save changes" : "Create plan"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 rounded-lg text-sm border border-border hover:bg-muted transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
