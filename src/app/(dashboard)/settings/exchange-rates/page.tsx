"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useExchangeRates,
  useCreateExchangeRate,
} from "@/features/settings/hooks/useSettings";
import {
  SettingsSection,
  Field,
  inputCls,
} from "@/features/settings/components/settingsSection";
import { formatDate } from "@/lib/utils";
import { Loader2, Plus, RefreshCw, CheckCircle2 } from "lucide-react";

const schema = z.object({
  fromCurrency: z.string().min(3).max(3),
  toCurrency: z.string().min(3).max(3),
  rate: z.number().positive("Rate must be positive"),
});

type Schema = z.infer<typeof schema>;

const CURRENCY_PAIRS = [
  { from: "USD", to: "KES" },
  { from: "EUR", to: "KES" },
  { from: "GBP", to: "KES" },
];

export default function ExchangeRatesPage() {
  const { data: rates, isLoading } = useExchangeRates();
  const createRate = useCreateExchangeRate();
  const [showForm, setShowForm] = useState(false);

  const form = useForm<Schema>({
    resolver: zodResolver(schema),
    defaultValues: { fromCurrency: "USD", toCurrency: "KES", rate: 0 },
  });

  const rateList = Array.isArray(rates) ? rates : [];

  return (
    <div className="space-y-5">
      <SettingsSection
        title="Exchange Rates"
        description="Set the USD/KES rate used when recording payments and generating reports. Rates are applied at the time of transaction."
      >
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Current rates */}
            <div className="space-y-2">
              {rateList.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No exchange rates set yet.
                </p>
              ) : (
                rateList.map((rate: any) => (
                  <div
                    key={rate.id}
                    className="flex items-center justify-between p-3.5 border border-border rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          1 {rate.fromCurrency} = {Number(rate.rate).toFixed(4)}{" "}
                          {rate.toCurrency}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Set {formatDate(rate.createdAt)}
                          {rate.setBy && ` by ${rate.setBy.fullName}`}
                        </p>
                      </div>
                    </div>
                    {rate.isActive && (
                      <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Active
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Quick set buttons */}
            <div className="flex flex-wrap gap-2">
              {CURRENCY_PAIRS.map(({ from, to }) => (
                <button
                  key={`${from}-${to}`}
                  type="button"
                  onClick={() => {
                    form.setValue("fromCurrency", from);
                    form.setValue("toCurrency", to);
                    setShowForm(true);
                  }}
                  className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                >
                  Set {from}/{to}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowForm((v) => !v)}
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-dashed border-border hover:bg-muted transition-colors text-muted-foreground"
              >
                <Plus className="w-3 h-3" />
                Custom pair
              </button>
            </div>

            {/* New rate form */}
            {showForm && (
              <form
                onSubmit={form.handleSubmit(async (d) => {
                  await createRate.mutateAsync(d);
                  setShowForm(false);
                  form.reset();
                })}
                className="p-4 border border-border rounded-xl space-y-4 bg-muted/20"
              >
                <p className="text-sm font-medium text-foreground">
                  Set exchange rate
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="From">
                    <input
                      {...form.register("fromCurrency")}
                      maxLength={3}
                      className={inputCls()}
                      style={{ textTransform: "uppercase" }}
                    />
                  </Field>
                  <Field label="To">
                    <input
                      {...form.register("toCurrency")}
                      maxLength={3}
                      className={inputCls()}
                      style={{ textTransform: "uppercase" }}
                    />
                  </Field>
                  <Field
                    label="Rate"
                    error={form.formState.errors.rate?.message}
                  >
                    <input
                      type="number"
                      step="0.0001"
                      min="0"
                      placeholder="e.g. 132.50"
                      {...form.register("rate", { valueAsNumber: true })}
                      className={inputCls(form.formState.errors.rate?.message)}
                    />
                  </Field>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={createRate.isPending}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60"
                    style={{
                      backgroundColor: "var(--brand-gold)",
                      color: "var(--brand-navy)",
                    }}
                  >
                    {createRate.isPending && (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    )}
                    Save rate
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 rounded-lg text-sm border border-border hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </SettingsSection>

      {/* Info */}
      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/40 rounded-xl p-4">
        <p className="text-sm text-blue-800 dark:text-blue-300 font-medium mb-1">
          How exchange rates work
        </p>
        <p className="text-xs text-blue-700 dark:text-blue-400">
          When a payment is recorded in a foreign currency (e.g. USD), the
          system uses the most recent active rate to calculate the KES
          equivalent for internal reporting. Client-facing documents always show
          the original transaction currency — the exchange rate is only used for
          aggregating revenue in KES.
        </p>
      </div>
    </div>
  );
}
