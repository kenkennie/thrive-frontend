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
  SaveButton,
} from "@/features/settings/components/settingsSection";
import { Loader2, AlertTriangle } from "lucide-react";

const FEATURES = [
  {
    key: "enableDashboard",
    label: "Dashboard",
    description: "Main overview dashboard with KPI cards",
  },
  {
    key: "enableAppointments",
    label: "Appointments",
    description: "Appointment booking, scheduling and status management",
  },
  {
    key: "enableClients",
    label: "Clients",
    description: "Client profiles, history, intake forms and photos",
  },
  {
    key: "enableClinical",
    label: "Clinical",
    description: "Treatment session notes and before/after photos",
  },
  {
    key: "enableTreatmentPlans",
    label: "Treatment Plans",
    description: "Multi-session treatment plan management",
  },
  {
    key: "enableServices",
    label: "Services",
    description: "Service catalogue and category management",
  },
  {
    key: "enableInvoices",
    label: "Invoices & Quotes",
    description: "Invoice generation, quotes, credit and debit notes",
  },
  {
    key: "enablePayments",
    label: "Payments",
    description: "Payment recording, receipts and refunds",
  },
  {
    key: "enableReports",
    label: "Reports",
    description: "Revenue analytics, doctor performance and aging reports",
  },
  {
    key: "enableStaff",
    label: "Staff Management",
    description: "Staff profiles, roles and permission management",
  },
  {
    key: "enableNotifications",
    label: "Notification Log",
    description: "Email/SMS delivery log and retry controls",
  },
  {
    key: "enableSettings",
    label: "Settings",
    description: "Clinic configuration (always keep enabled)",
  },
] as const;

type FeatureKey = (typeof FEATURES)[number]["key"];

export default function FeaturesPage() {
  const { data, isLoading } = useClinicSettings();
  const update = useUpdateSettings();

  const defaults = Object.fromEntries(
    FEATURES.map((f) => [f.key, true]),
  ) as Record<FeatureKey, boolean>;
  const form = useForm<Record<FeatureKey, boolean>>({
    defaultValues: defaults,
  });
  const vals = form.watch();

  useEffect(() => {
    if (data) {
      const patch = Object.fromEntries(
        FEATURES.map((f) => [f.key, (data as any)[f.key] ?? true]),
      ) as Record<FeatureKey, boolean>;
      form.reset(patch);
    }
  }, [data]);

  if (isLoading)
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/40 rounded-xl">
        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800 dark:text-amber-300">
          Disabling a feature immediately hides it from all staff and returns
          403 on related API calls. Changes take effect instantly.
        </p>
      </div>

      <form onSubmit={form.handleSubmit((d) => update.mutate(d))}>
        <SettingsSection
          title="Feature Toggles"
          description="Enable or disable entire modules for the clinic"
        >
          <div className="space-y-0">
            {FEATURES.map(({ key, label, description }) => (
              <Field
                key={key}
                label={label}
                description={description}
                horizontal
              >
                <Toggle
                  checked={vals[key]}
                  onChange={(v) => form.setValue(key, v)}
                  disabled={key === "enableSettings"}
                />
              </Field>
            ))}
          </div>
        </SettingsSection>

        <div className="flex justify-end mt-5">
          <SaveButton isLoading={update.isPending} />
        </div>
      </form>
    </div>
  );
}
