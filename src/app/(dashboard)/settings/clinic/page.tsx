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
  inputCls,
  SaveButton,
} from "@/features/settings/components/settingsSection";
import { Loader2 } from "lucide-react";

export default function ClinicPage() {
  const { data: settings, isLoading } = useClinicSettings();
  const update = useUpdateSettings();

  const form = useForm({
    defaultValues: {
      clinicName: "",
      tagline: "",
      email: "",
      phoneNumber: "",
      address: "",
      website: "",
    },
  });

  useEffect(() => {
    if (settings)
      form.reset({
        clinicName: settings.clinicName ?? "",
        tagline: settings.tagline ?? "",
        email: settings.email ?? "",
        phoneNumber: settings.phoneNumber ?? "",
        address: settings.address ?? "",
        website: settings.website ?? "",
      });
  }, [settings]);

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
        title="Clinic Identity"
        description="Brand name and tagline shown on documents and emails"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Clinic name">
              <input
                {...form.register("clinicName")}
                className={inputCls()}
              />
            </Field>
            <Field label="Tagline">
              <input
                {...form.register("tagline")}
                placeholder="e.g. Certified. Holistic. Leading."
                className={inputCls()}
              />
            </Field>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Contact Details"
        description="Shown on invoices, quotes, and client communications"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Email">
              <input
                {...form.register("email")}
                type="email"
                className={inputCls()}
              />
            </Field>
            <Field label="Phone">
              <input
                {...form.register("phoneNumber")}
                className={inputCls()}
              />
            </Field>
          </div>
          <Field label="Website">
            <input
              {...form.register("website")}
              placeholder="https://thriveaesthetics.co.ke"
              className={inputCls()}
            />
          </Field>
          <Field label="Address">
            <textarea
              {...form.register("address")}
              rows={3}
              className={inputCls() + " h-auto py-2 resize-none"}
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
