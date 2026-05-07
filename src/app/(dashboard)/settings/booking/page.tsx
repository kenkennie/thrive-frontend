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

export default function BookingPage() {
  const { data, isLoading } = useClinicSettings();
  const update = useUpdateSettings();

  const form = useForm({
    defaultValues: {
      bookingOpenDays: 30,
      bufferTimeMin: 15,
      cancellationHours: 24,
      cancellationFeePercentage: 0,
      autoConfirmBookings: false,
      requireIntakeForNewClients: true,
      requireIntakeFormBeforeConfirmation: false,
      intakeValidityDays: 365,
      noShowAutoFlagMinutes: 30,
      waitlistExpiryHours: 48,
    },
  });

  const vals = form.watch();

  useEffect(() => {
    if (data)
      form.reset({
        bookingOpenDays: data.bookingOpenDays ?? 30,
        bufferTimeMin: data.bufferTimeMin ?? 15,
        cancellationHours: data.cancellationHours ?? 24,
        cancellationFeePercentage: data.cancellationFeePercentage ?? 0,
        autoConfirmBookings: data.autoConfirmBookings ?? false,
        requireIntakeForNewClients: data.requireIntakeForNewClients ?? true,
        requireIntakeFormBeforeConfirmation:
          data.requireIntakeFormBeforeConfirmation ?? false,
        intakeValidityDays: data.intakeValidityDays ?? 365,
        noShowAutoFlagMinutes: data.noShowAutoFlagMinutes ?? 30,
        waitlistExpiryHours: data.waitlistExpiryHours ?? 48,
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
        title="Scheduling"
        description="Control how far in advance clients can book and buffer times between appointments"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Booking window (days)"
              description="How many days ahead clients can book"
            >
              <input
                type="number"
                min={1}
                max={365}
                {...form.register("bookingOpenDays", { valueAsNumber: true })}
                className={inputCls()}
              />
            </Field>
            <Field
              label="Buffer time (minutes)"
              description="Gap between consecutive appointments"
            >
              <input
                type="number"
                min={0}
                max={120}
                step={5}
                {...form.register("bufferTimeMin", { valueAsNumber: true })}
                className={inputCls()}
              />
            </Field>
          </div>

          <Field
            label="Auto-confirm bookings"
            description="Automatically confirm new bookings without manual review"
            horizontal
          >
            <Toggle
              checked={vals.autoConfirmBookings}
              onChange={(v) => form.setValue("autoConfirmBookings", v)}
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="No-show flag after (minutes)"
              description="Mark as no-show if client hasn't arrived"
            >
              <input
                type="number"
                min={5}
                max={120}
                {...form.register("noShowAutoFlagMinutes", {
                  valueAsNumber: true,
                })}
                className={inputCls()}
              />
            </Field>
            <Field
              label="Waitlist expiry (hours)"
              description="How long a waitlist slot stays open"
            >
              <input
                type="number"
                min={1}
                max={168}
                {...form.register("waitlistExpiryHours", {
                  valueAsNumber: true,
                })}
                className={inputCls()}
              />
            </Field>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Cancellations"
        description="Cancellation window and fee policy"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Cancellation window (hours)"
              description="Free cancellation allowed before this threshold"
            >
              <input
                type="number"
                min={0}
                max={168}
                {...form.register("cancellationHours", { valueAsNumber: true })}
                className={inputCls()}
              />
            </Field>
            <Field
              label="Late cancellation fee (%)"
              description="Percentage of invoice charged for late cancellations (0 = no fee)"
            >
              <input
                type="number"
                min={0}
                max={100}
                step={5}
                {...form.register("cancellationFeePercentage", {
                  valueAsNumber: true,
                })}
                className={inputCls()}
              />
            </Field>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Intake Forms"
        description="Control when clients are required to complete intake forms"
      >
        <div className="space-y-0">
          <Field
            label="Require intake for new clients"
            description="New clients must complete an intake form before their first appointment"
            horizontal
          >
            <Toggle
              checked={vals.requireIntakeForNewClients}
              onChange={(v) => form.setValue("requireIntakeForNewClients", v)}
            />
          </Field>
          <Field
            label="Require intake before confirmation"
            description="Appointment stays pending until client submits intake form"
            horizontal
          >
            <Toggle
              checked={vals.requireIntakeFormBeforeConfirmation}
              onChange={(v) =>
                form.setValue("requireIntakeFormBeforeConfirmation", v)
              }
            />
          </Field>
          <Field
            label="Intake validity (days)"
            description="Number of days an intake form remains valid before requiring renewal"
          >
            <input
              type="number"
              min={30}
              max={730}
              {...form.register("intakeValidityDays", { valueAsNumber: true })}
              className={inputCls() + " max-w-xs"}
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
