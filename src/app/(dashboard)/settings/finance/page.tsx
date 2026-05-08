"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  useClinicSettings,
  useUpdateSettings,
} from "@/features/settings/hooks/useSettings";
import {
  SettingsSection,
  Field,
  Toggle,
  inputCls,
  SaveButton,
} from "@/features/settings/components/settingsSection";
import { Loader2 } from "lucide-react";

const CURRENCIES = ["KES", "USD"];

export default function FinancePage() {
  const { data, isLoading } = useClinicSettings();
  const update = useUpdateSettings();

  const form = useForm({
    defaultValues: {
      baseCurrency: "KES",
      vatRate: 16,
      invoicePrefix: "INV",
      quotePrefix: "QUO",
      creditNotePrefix: "CN",
      debitNotePrefix: "DN",
      invoiceDueDays: 14,
      defaultPaymentTerms: "",
      autoGenerateInvoice: true,
    },
  });

  const vals = form.watch();

  useEffect(() => {
    if (data)
      form.reset({
        baseCurrency: data.baseCurrency ?? "KES",
        vatRate: data.vatRate ?? 16,
        invoicePrefix: data.invoicePrefix ?? "INV",
        quotePrefix: data.quotePrefix ?? "QUO",
        creditNotePrefix: data.creditNotePrefix ?? "CN",
        debitNotePrefix: data.debitNotePrefix ?? "DN",
        invoiceDueDays: data.invoiceDueDays ?? 14,
        defaultPaymentTerms: data.defaultPaymentTerms ?? "",
        autoGenerateInvoice: data.autoGenerateInvoice ?? true,
      });
  }, [data]);

  if (isLoading)
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );

  return (
    <form
      onSubmit={form.handleSubmit((d) => update.mutate(d))}
      className="space-y-5"
    >
      <SettingsSection
        title="Currency & Tax"
        description="Base currency and VAT settings for all invoices"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Base currency"
              description="Primary currency for internal reporting (KES)"
            >
              <select
                {...form.register("baseCurrency")}
                className={inputCls() + " cursor-pointer"}
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
            </Field>
            <Field
              label="VAT rate (%)"
              description="Applied to all taxable invoices"
            >
              <input
                type="number"
                min={0}
                max={100}
                step={0.5}
                {...form.register("vatRate", { valueAsNumber: true })}
                className={inputCls()}
              />
            </Field>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Document Numbering"
        description="Prefixes used when generating document numbers"
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { key: "invoicePrefix", label: "Invoice" },
            { key: "quotePrefix", label: "Quote" },
            { key: "creditNotePrefix", label: "Credit Note" },
            { key: "debitNotePrefix", label: "Debit Note" },
          ].map(({ key, label }) => (
            <Field
              key={key}
              label={label}
            >
              <input
                {...form.register(key as any)}
                placeholder={label.substring(0, 3).toUpperCase()}
                className={inputCls()}
              />
            </Field>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Example:{" "}
          <span className="font-mono">{vals.invoicePrefix}-2026-0001</span>
        </p>
      </SettingsSection>

      <SettingsSection
        title="Payment Terms"
        description="Default due dates and terms shown on invoices"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Invoice due (days)"
              description="Days until invoice is overdue"
            >
              <input
                type="number"
                min={0}
                max={90}
                {...form.register("invoiceDueDays", { valueAsNumber: true })}
                className={inputCls()}
              />
            </Field>
          </div>
          <Field
            label="Payment terms text"
            description="Shown at the bottom of invoices"
          >
            <textarea
              {...form.register("defaultPaymentTerms")}
              rows={2}
              placeholder="e.g. Payment is due within 14 days of invoice date."
              className={inputCls() + " h-auto py-2 resize-none"}
            />
          </Field>
          <Field
            label="Auto-generate invoice on booking"
            description="Automatically create a draft invoice when an appointment is booked"
            horizontal
          >
            <Toggle
              checked={vals.autoGenerateInvoice}
              onChange={(v) => form.setValue("autoGenerateInvoice", v)}
            />
          </Field>
        </div>
      </SettingsSection>

      <div className="flex justify-end">
        <SaveButton isLoading={update.isPending} />
      </div>
    </form>
  );
}
