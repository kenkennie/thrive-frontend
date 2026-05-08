"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRecordPayment } from "../hooks/useFinancial";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

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

  const method = form.watch("method");

  return (
    <form
      onSubmit={form.handleSubmit(async (d) => {
        await record.mutateAsync({ invoiceId, ...d });
        onDone();
      })}
      className="space-y-4"
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            Amount *
          </label>
          <input
            type="number"
            step="0.01"
            {...form.register("amount", { valueAsNumber: true })}
            className={inp(form.formState.errors.amount?.message)}
          />
          {form.formState.errors.amount && (
            <p className="text-xs text-destructive">
              {form.formState.errors.amount.message}
            </p>
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

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">
          Payment method *
        </label>
        <div className="flex flex-wrap gap-2">
          {METHODS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => form.setValue("method", m)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                method === m
                  ? "border-transparent text-brand-navy"
                  : "border-border text-muted-foreground hover:border-primary/40",
              )}
              style={
                method === m
                  ? { backgroundColor: "var(--brand-gold)" }
                  : undefined
              }
            >
              {m.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            Payment date
          </label>
          <input
            type="date"
            {...form.register("paidAt")}
            className={inp()}
          />
        </div>
        {["MPESA", "BANK_TRANSFER", "CARD", "CHEQUE"].includes(method) && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Reference / Transaction ID
            </label>
            <input
              {...form.register("reference")}
              placeholder="e.g. QA12B3C4"
              className={inp()}
            />
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">
          Note (optional)
        </label>
        <input
          {...form.register("note")}
          placeholder="Internal note about this payment"
          className={inp()}
        />
      </div>

      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={record.isPending}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-60"
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
