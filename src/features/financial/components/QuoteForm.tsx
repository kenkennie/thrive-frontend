"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { listClients } from "@/lib/api/clients";
import { extractArray } from "@/lib/api/response";
import { formatCurrency, cn } from "@/lib/utils";
import { Loader2, Plus, X, Search, Info } from "lucide-react";

const lineItemSchema = z.object({
  description: z.string().min(1, "Description required"),
  quantity: z.number().positive().default(1),
  unitPrice: z.number().min(0),
  taxable: z.boolean().default(true),
});

const schema = z.object({
  clientId: z.string().min(1, "Client required"),
  currency: z.string().default("KES"),
  vatRate: z.number().min(0).max(100).default(16),
  notes: z.string().optional(),
  expiresAt: z.string().optional(),
  discountType: z.enum(["PERCENTAGE", "FIXED"]).optional(),
  discountValue: z.number().min(0).optional(),
  sendOnCreate: z.boolean().default(false),
  lineItems: z.array(lineItemSchema).min(1, "At least one line item required"),
});

export type QuoteFormSchema = z.infer<typeof schema>;

interface Props {
  quote?: any;
  onSubmit: (data: QuoteFormSchema) => Promise<void>;
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

// ── Client search ─────────────────────────────────────────────────────────────

function ClientSearch({
  value,
  onChange,
  error,
  defaultName,
}: {
  value: string;
  onChange: (id: string) => void;
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
              onChange("");
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
                onChange(c.id);
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

export function QuoteForm({ quote, onSubmit, isLoading, onCancel }: Props) {
  const isEdit = !!quote;
  const [showDiscount, setShowDiscount] = useState(!!quote?.discountType);

  const form = useForm<QuoteFormSchema>({
    resolver: zodResolver(schema),
    defaultValues: {
      clientId: quote?.client?.id ?? "",
      currency: quote?.currency ?? "KES",
      vatRate: quote?.vatRate != null ? Number(quote.vatRate) : 16,
      notes: quote?.notes ?? "",
      expiresAt: quote?.expiresAt
        ? new Date(quote.expiresAt).toISOString().split("T")[0]
        : "",
      discountType: quote?.discountType ?? undefined,
      discountValue:
        quote?.discountValue != null ? Number(quote.discountValue) : undefined,
      sendOnCreate: false,
      lineItems: quote?.lineItems?.map((li: any) => ({
        description: li.description,
        quantity: li.quantity,
        unitPrice: Number(li.unitPrice),
        taxable: li.taxable ?? true,
      })) ?? [{ description: "", quantity: 1, unitPrice: 0, taxable: true }],
    },
  });

  const {
    formState: { errors },
    watch,
    setValue,
    register,
    handleSubmit,
  } = form;
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lineItems",
  });

  const lineItems = watch("lineItems");
  const vatRate = watch("vatRate") ?? 0;
  const discountType = watch("discountType");
  const discountValue = watch("discountValue") ?? 0;
  const currency = watch("currency");
  const sendOnCreate = watch("sendOnCreate");

  const subtotal = lineItems.reduce(
    (s, li) => s + Number(li.unitPrice ?? 0) * Number(li.quantity ?? 1),
    0,
  );
  const discountAmount = !discountType
    ? 0
    : discountType === "PERCENTAGE"
      ? (subtotal * discountValue) / 100
      : Math.min(discountValue, subtotal);
  const taxableSubtotal = lineItems
    .filter((li) => li.taxable)
    .reduce(
      (s, li) => s + Number(li.unitPrice ?? 0) * Number(li.quantity ?? 1),
      0,
    );
  const taxableAfterDiscount =
    discountAmount > 0 && subtotal > 0
      ? taxableSubtotal * ((subtotal - discountAmount) / subtotal)
      : taxableSubtotal;
  const vatAmount = vatRate > 0 ? (taxableAfterDiscount * vatRate) / 100 : 0;
  const total = subtotal - discountAmount + vatAmount;

  const fmtC = (n: number) => formatCurrency(n, currency);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6"
    >
      {/* Client + Currency */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="sm:col-span-3 space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            Client *
          </label>
          <ClientSearch
            value={form.watch("clientId")}
            defaultName={quote?.client?.fullName}
            onChange={(id) =>
              setValue("clientId", id, { shouldValidate: true })
            }
            error={errors.clientId?.message}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            Currency
          </label>
          <select
            {...register("currency")}
            className={cn(inp(), "cursor-pointer")}
          >
            {["KES", "USD", "EUR", "GBP"].map((c) => (
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

      {/* Expiry */}
      <div className="space-y-1.5 max-w-xs">
        <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
          Quote valid until
          <span className="text-xs text-muted-foreground font-normal">
            (default: 14 days)
          </span>
        </label>
        <input
          type="date"
          {...register("expiresAt")}
          className={inp()}
        />
      </div>

      {/* Line items */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-foreground">
            Line items *
          </label>
          <button
            type="button"
            onClick={() =>
              append({
                description: "",
                quantity: 1,
                unitPrice: 0,
                taxable: true,
              })
            }
            className="flex items-center gap-1 text-xs font-medium hover:underline"
            style={{ color: "var(--brand-gold)" }}
          >
            <Plus className="w-3.5 h-3.5" /> Add item
          </button>
        </div>

        <div className="hidden sm:grid grid-cols-12 gap-2 px-3 pb-1">
          <span className="col-span-5 text-xs font-medium text-muted-foreground">
            Description
          </span>
          <span className="col-span-2 text-xs font-medium text-muted-foreground">
            Qty
          </span>
          <span className="col-span-2 text-xs font-medium text-muted-foreground">
            Unit price
          </span>
          <span className="col-span-1 text-xs font-medium text-muted-foreground text-center">
            VAT
          </span>
          <span className="col-span-1 text-xs font-medium text-muted-foreground text-right">
            Total
          </span>
          <span className="col-span-1" />
        </div>

        <div className="space-y-2">
          {fields.map((field, index) => {
            const qty = Number(watch(`lineItems.${index}.quantity`) ?? 1);
            const price = Number(watch(`lineItems.${index}.unitPrice`) ?? 0);
            const taxable = watch(`lineItems.${index}.taxable`);
            return (
              <div
                key={field.id}
                className="grid grid-cols-12 gap-2 items-center p-3 rounded-xl bg-muted/20 border border-border/60 hover:border-border transition-colors"
              >
                <div className="col-span-12 sm:col-span-5">
                  <input
                    {...register(`lineItems.${index}.description`)}
                    placeholder="e.g. Hydra Facial treatment"
                    className={cn(
                      inp(errors.lineItems?.[index]?.description?.message),
                      "bg-background",
                    )}
                  />
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <input
                    type="number"
                    min={1}
                    {...register(`lineItems.${index}.quantity`, {
                      valueAsNumber: true,
                    })}
                    className={cn(inp(), "bg-background")}
                  />
                </div>
                <div className="col-span-5 sm:col-span-2">
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    {...register(`lineItems.${index}.unitPrice`, {
                      valueAsNumber: true,
                    })}
                    className={cn(inp(), "bg-background")}
                  />
                </div>
                <div className="col-span-3 sm:col-span-1 flex justify-center">
                  <button
                    type="button"
                    onClick={() =>
                      setValue(`lineItems.${index}.taxable`, !taxable)
                    }
                    title={
                      taxable
                        ? "Taxable — click to exempt"
                        : "VAT exempt — click to tax"
                    }
                    className={cn(
                      "w-10 h-7 rounded-md text-[10px] font-bold border transition-all",
                      taxable
                        ? "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/40"
                        : "bg-muted text-muted-foreground border-border",
                    )}
                  >
                    {taxable ? "VAT" : "EX"}
                  </button>
                </div>
                <div className="col-span-8 sm:col-span-1 flex items-center justify-end h-10">
                  <span className="text-sm font-semibold text-foreground">
                    {fmtC(qty * price)}
                  </span>
                </div>
                <div className="col-span-4 sm:col-span-1 flex justify-end">
                  {fields.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  ) : (
                    <div className="w-7" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Totals panel */}
      <div className="rounded-2xl border border-border bg-muted/10 overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border-b border-border">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              VAT rate (%){" "}
              <span className="text-xs text-muted-foreground font-normal">
                — taxable items only
              </span>
            </label>
            <input
              type="number"
              min={0}
              max={100}
              step={0.5}
              {...register("vatRate", { valueAsNumber: true })}
              className={inp()}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Discount
            </label>
            {showDiscount ? (
              <div className="flex gap-2">
                <select
                  {...register("discountType")}
                  className={cn(inp(), "cursor-pointer w-28 shrink-0")}
                >
                  <option value="PERCENTAGE">%</option>
                  <option value="FIXED">Fixed</option>
                </select>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  placeholder={discountType === "PERCENTAGE" ? "0–100" : "0.00"}
                  {...register("discountValue", { valueAsNumber: true })}
                  className={inp()}
                />
                <button
                  type="button"
                  onClick={() => {
                    setShowDiscount(false);
                    setValue("discountType", undefined);
                    setValue("discountValue", undefined);
                  }}
                  className="p-2 shrink-0 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setShowDiscount(true);
                  setValue("discountType", "PERCENTAGE");
                  setValue("discountValue", 0);
                }}
                className="flex items-center gap-1.5 h-10 px-3 rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors w-full"
              >
                <Plus className="w-3.5 h-3.5" /> Add discount
              </button>
            )}
          </div>
        </div>

        <div className="p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium text-foreground">
              {fmtC(subtotal)}
            </span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-green-600 dark:text-green-400">
                Discount{" "}
                {discountType === "PERCENTAGE"
                  ? `(${discountValue}%)`
                  : "(fixed)"}
              </span>
              <span className="font-medium text-green-600 dark:text-green-400">
                −{fmtC(discountAmount)}
              </span>
            </div>
          )}
          {vatRate > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">VAT ({vatRate}%)</span>
              <span className="font-medium text-foreground">
                {fmtC(vatAmount)}
              </span>
            </div>
          )}
          <div className="flex justify-between items-center pt-3 border-t border-border">
            <span className="text-base font-bold text-foreground">
              Quote total
            </span>
            <span
              className="text-xl font-bold"
              style={{ color: "var(--brand-gold)" }}
            >
              {fmtC(total)}
            </span>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">Notes</label>
        <textarea
          {...register("notes")}
          rows={3}
          placeholder="Terms, inclusions, scope of work shown on the quote…"
          className={cn(inp(), "h-auto py-2.5 resize-none")}
        />
      </div>

      {/* Send on create — only for new quotes */}
      {!isEdit && (
        <label className="flex items-start gap-3 cursor-pointer select-none p-3 rounded-xl hover:bg-muted/30 transition-colors border border-transparent hover:border-border/60">
          <div
            className={cn(
              "mt-0.5 w-5 h-5 shrink-0 rounded-md border-2 flex items-center justify-center transition-all",
              sendOnCreate ? "border-transparent" : "border-input",
            )}
            style={
              sendOnCreate
                ? { backgroundColor: "var(--brand-gold)" }
                : undefined
            }
            onClick={() => setValue("sendOnCreate", !sendOnCreate)}
          >
            {sendOnCreate && (
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
              Send to client immediately
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Mark as SENT and email the quote to the client after creating
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
          {isEdit
            ? "Save changes"
            : sendOnCreate
              ? "Create & send quote"
              : "Create quote"}
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
