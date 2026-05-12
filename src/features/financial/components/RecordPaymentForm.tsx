"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRecordPayment } from "../hooks/useFinancial";
import { Loader2 } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";

const METHODS = [
  "CASH",
  "MPESA",
  "CARD",
  "BANK_TRANSFER",
  "CHEQUE",
  "INSURANCE",
  "OTHER",
] as const;

const schema = z.object({
  amount: z.number().positive("Amount required"),
  currency: z.string().default("KES"),
  method: z.enum(METHODS),
  reference: z.string().optional(),
  note: z.string().optional(),
  paidAt: z.string().optional(),
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
  invoiceId: string;
  amountDue: number;
  currency: string;
  onDone: () => void;
}

const METHOD_LABELS: Record<string, string> = {
  CASH: "Cash",
  MPESA: "M-Pesa",
  CARD: "Card",
  BANK_TRANSFER: "Bank Transfer",
  CHEQUE: "Cheque",
  INSURANCE: "Insurance",
  OTHER: "Other",
};

const NEEDS_REFERENCE = ["MPESA", "BANK_TRANSFER", "CARD", "CHEQUE"];

export function RecordPaymentForm({
  invoiceId,
  amountDue,
  currency,
  onDone,
}: Props) {
  const record = useRecordPayment();

  const form = useForm<Schema>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: amountDue,
      currency,
      method: "CASH",
      paidAt: new Date().toISOString().split("T")[0],
    },
  });

  const {
    register,
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
  } = form;
  const method = watch("method");
  const amount = watch("amount");
  const cur = watch("currency");

  return (
    <form
      onSubmit={handleSubmit(async (d) => {
        await record.mutateAsync({ invoiceId, ...d });
        onDone();
      })}
      className="space-y-4"
    >
      {/* Amount due hint */}
      <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
        <span>Outstanding balance</span>
        <span className="font-semibold text-foreground">
          {formatCurrency(amountDue, currency)}
        </span>
      </div>

      {/* Amount + Currency */}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2 space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            Amount received *
          </label>
          <input
            type="number"
            step="0.01"
            min={0}
            {...register("amount", { valueAsNumber: true })}
            className={inp(errors.amount?.message)}
          />
          {errors.amount && (
            <p className="text-xs text-destructive">{errors.amount.message}</p>
          )}
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

      {/* Payment method */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">
          Payment method *
        </label>
        <div className="flex flex-wrap gap-2">
          {METHODS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setValue("method", m)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                method === m
                  ? "border-transparent text-brand-navy shadow-sm"
                  : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
              style={
                method === m
                  ? { backgroundColor: "var(--brand-gold)" }
                  : undefined
              }
            >
              {METHOD_LABELS[m]}
            </button>
          ))}
        </div>
      </div>

      {/* Date + Reference */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            Payment date
          </label>
          <input
            type="date"
            {...register("paidAt")}
            className={inp()}
          />
        </div>
        {NEEDS_REFERENCE.includes(method) && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              {method === "MPESA"
                ? "M-Pesa code"
                : method === "CARD"
                  ? "Last 4 digits"
                  : "Reference"}
            </label>
            <input
              {...register("reference")}
              placeholder={
                method === "MPESA"
                  ? "e.g. QA12BC3D4"
                  : method === "CARD"
                    ? "•••• 1234"
                    : "Ref number"
              }
              className={inp()}
            />
          </div>
        )}
      </div>

      {/* Note */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">
          Internal note (optional)
        </label>
        <input
          {...register("note")}
          placeholder="e.g. Client paid in two instalments"
          className={inp()}
        />
      </div>

      {/* Submit */}
      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={record.isPending}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-60 transition-all"
          style={{
            backgroundColor: "var(--brand-gold)",
            color: "var(--brand-navy)",
          }}
        >
          {record.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          Record payment
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
