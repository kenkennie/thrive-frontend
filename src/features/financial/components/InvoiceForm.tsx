"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { listClients } from "@/lib/api/clients";
import { extractArray } from "@/lib/api/response";
import { formatCurrency, cn } from "@/lib/utils";
import { Loader2, Plus, X, Search } from "lucide-react";

// ── Schema ────────────────────────────────────────────────────────────────────

const lineItemSchema = z.object({
  description: z.string().min(1, "Description required"),
  quantity: z.number().positive().default(1),
  unitPrice: z.number().min(0, "Price required"),
  taxable: z.boolean().default(true),
});

const schema = z.object({
  clientId: z.string().min(1, "Client required"),
  currency: z.string().default("KES"),
  vatRate: z.number().min(0).max(100).default(16),
  notes: z.string().optional(),
  dueDate: z.string().optional(),
  paymentTerms: z.string().optional(),
  discountType: z.enum(["PERCENTAGE", "FIXED"]).optional(),
  discountValue: z.number().min(0).optional(),
  lineItems: z.array(lineItemSchema).min(1, "At least one line item required"),
});

export type InvoiceFormSchema = z.infer<typeof schema>;

interface Props {
  invoice?: any;
  onSubmit: (data: InvoiceFormSchema) => Promise<void>;
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

const PAYMENT_TERMS = [
  { value: "", label: "Select…" },
  { value: "DUE_ON_RECEIPT", label: "Due on receipt" },
  { value: "NET_7", label: "Net 7 days" },
  { value: "NET_14", label: "Net 14 days" },
  { value: "NET_30", label: "Net 30 days" },
];

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
  const clients = data ?? [];

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
          placeholder="Search client by name or phone…"
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
        <div className="absolute left-0 right-0 top-11 bg-card border border-border rounded-xl shadow-xl z-40 overflow-hidden max-h-52 overflow-y-auto">
          {clients.map((c: any) => (
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
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
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
              <div className="min-w-0">
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

export function InvoiceForm({ invoice, onSubmit, isLoading, onCancel }: Props) {
  const isEdit = !!invoice;

  const form = useForm<InvoiceFormSchema>({
    resolver: zodResolver(schema),
    defaultValues: {
      clientId: invoice?.client?.id ?? "",
      currency: invoice?.currency ?? "KES",
      vatRate: invoice?.vatRate ?? 16,
      notes: invoice?.notes ?? "",
      dueDate: invoice?.dueDate ? invoice.dueDate.split("T")[0] : "",
      paymentTerms: invoice?.paymentTerms ?? "",
      discountType: invoice?.discountType ?? undefined,
      discountValue: invoice?.discountValue ?? undefined,
      lineItems: invoice?.lineItems?.map((li: any) => ({
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

  // Live calculations
  const subtotal = lineItems.reduce(
    (s, li) => s + (li.unitPrice ?? 0) * (li.quantity ?? 1),
    0,
  );
  const discountAmount =
    discountType === "PERCENTAGE"
      ? (subtotal * discountValue) / 100
      : discountType === "FIXED"
        ? Math.min(discountValue, subtotal)
        : 0;
  const taxableSubtotal = lineItems
    .filter((li) => li.taxable)
    .reduce((s, li) => s + (li.unitPrice ?? 0) * (li.quantity ?? 1), 0);
  const taxableAfterDiscount =
    discountAmount > 0
      ? taxableSubtotal * ((subtotal - discountAmount) / subtotal)
      : taxableSubtotal;
  const vatAmount = vatRate > 0 ? (taxableAfterDiscount * vatRate) / 100 : 0;
  const total = subtotal - discountAmount + vatAmount;

  const [showDiscount, setShowDiscount] = useState(!!invoice?.discountType);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Client + Currency */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            Client *
          </label>
          <ClientSearch
            value={form.watch("clientId")}
            defaultName={invoice?.client?.fullName}
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
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Payment terms + Due date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            Payment terms
          </label>
          <select
            {...register("paymentTerms")}
            className={cn(inp(), "cursor-pointer")}
          >
            {PAYMENT_TERMS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            Due date
          </label>
          <input type="date" {...register("dueDate")} className={inp()} />
        </div>
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

        {/* Header */}
        <div className="grid grid-cols-12 gap-2 px-1">
          <p className="col-span-5 text-xs font-medium text-muted-foreground">
            Description
          </p>
          <p className="col-span-2 text-xs font-medium text-muted-foreground">
            Qty
          </p>
          <p className="col-span-2 text-xs font-medium text-muted-foreground">
            Unit price
          </p>
          <p className="col-span-2 text-xs font-medium text-muted-foreground text-right">
            Total
          </p>
          <p className="col-span-1" />
        </div>

        <div className="space-y-2">
          {fields.map((field, index) => {
            const qty = watch(`lineItems.${index}.quantity`) ?? 1;
            const price = watch(`lineItems.${index}.unitPrice`) ?? 0;
            const taxable = watch(`lineItems.${index}.taxable`);

            return (
              <div
                key={field.id}
                className="grid grid-cols-12 gap-2 items-start"
              >
                <div className="col-span-5">
                  <input
                    {...register(`lineItems.${index}.description`)}
                    placeholder="e.g. Hydra Facial (60 min)"
                    className={inp(
                      errors.lineItems?.[index]?.description?.message,
                    )}
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    min={1}
                    {...register(`lineItems.${index}.quantity`, {
                      valueAsNumber: true,
                    })}
                    className={inp()}
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    {...register(`lineItems.${index}.unitPrice`, {
                      valueAsNumber: true,
                    })}
                    className={inp()}
                  />
                </div>
                <div className="col-span-2 flex items-center justify-end h-10">
                  <span className="text-sm font-semibold text-foreground">
                    {formatCurrency(qty * price, currency)}
                  </span>
                </div>
                <div className="col-span-1 flex items-center justify-center h-10 gap-1">
                  {/* Taxable toggle */}
                  <button
                    type="button"
                    onClick={() =>
                      setValue(`lineItems.${index}.taxable`, !taxable)
                    }
                    title={
                      taxable
                        ? "Taxable — click to exempt"
                        : "Not taxable — click to tax"
                    }
                    className={cn(
                      "text-[10px] px-1 py-0.5 rounded font-medium transition-colors border",
                      taxable
                        ? "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/40"
                        : "bg-muted text-muted-foreground border-border",
                    )}
                  >
                    {taxable ? "VAT" : "EX"}
                  </button>
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {errors.lineItems?.root && (
          <p className="text-xs text-destructive">
            {errors.lineItems.root.message}
          </p>
        )}
      </div>

      {/* VAT + Discount */}
      <div className="bg-muted/20 rounded-xl border border-border p-4 space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              VAT rate (%)
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
            <div className="flex gap-2">
              {showDiscount ? (
                <>
                  <select
                    {...register("discountType")}
                    className={cn(inp(), "cursor-pointer w-28")}
                  >
                    <option value="PERCENTAGE">%</option>
                    <option value="FIXED">Fixed</option>
                  </select>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    {...register("discountValue", { valueAsNumber: true })}
                    placeholder="Value"
                    className={inp()}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setShowDiscount(false);
                      setValue("discountType", undefined);
                      setValue("discountValue", undefined);
                    }}
                    className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setShowDiscount(true);
                    setValue("discountType", "PERCENTAGE");
                  }}
                  className="flex items-center gap-1.5 h-10 px-3 rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:bg-muted transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add discount
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="pt-3 border-t border-border space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal, currency)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
              <span>
                Discount (
                {discountType === "PERCENTAGE" ? `${discountValue}%` : "fixed"})
              </span>
              <span>−{formatCurrency(discountAmount, currency)}</span>
            </div>
          )}
          {vatRate > 0 && (
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>VAT ({vatRate}%)</span>
              <span>{formatCurrency(vatAmount, currency)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold text-foreground pt-2 border-t border-border">
            <span>Total</span>
            <span style={{ color: "var(--brand-gold)" }}>
              {formatCurrency(total, currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">
          Notes (optional)
        </label>
        <textarea
          {...register("notes")}
          rows={3}
          placeholder="Payment instructions, additional details…"
          className={cn(inp(), "h-auto py-2 resize-none")}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2 border-t border-border/60">
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
          {isEdit ? "Save changes" : "Create invoice"}
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
