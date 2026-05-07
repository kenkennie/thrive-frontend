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

export default function NotificationsPage() {
  const { data, isLoading } = useClinicSettings();
  const update = useUpdateSettings();

  const form = useForm({
    defaultValues: {
      sendAppointmentReminder: true,
      reminderHoursBefore: 24,
      sendCancellationNotification: true,
      sendCompletionFollowUp: true,
      followUpHoursAfter: 2,
      sendInvoiceEmail: true,
      sendPaymentConfirmation: true,
    },
  });

  const vals = form.watch();

  useEffect(() => {
    if (data)
      form.reset({
        sendAppointmentReminder: data.sendAppointmentReminder ?? true,
        reminderHoursBefore: data.reminderHoursBefore ?? 24,
        sendCancellationNotification: data.sendCancellationNotification ?? true,
        sendCompletionFollowUp: data.sendCompletionFollowUp ?? true,
        followUpHoursAfter: data.followUpHoursAfter ?? 2,
        sendInvoiceEmail: data.sendInvoiceEmail ?? true,
        sendPaymentConfirmation: data.sendPaymentConfirmation ?? true,
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
        title="Appointment Notifications"
        description="Emails and SMS sent to clients around appointments"
      >
        <div className="space-y-0">
          <Field
            label="Send appointment reminders"
            description="Email client before their appointment"
            horizontal
          >
            <Toggle
              checked={vals.sendAppointmentReminder}
              onChange={(v) => form.setValue("sendAppointmentReminder", v)}
            />
          </Field>
          {vals.sendAppointmentReminder && (
            <div className="pl-4 pb-3">
              <Field label="Send reminder (hours before)">
                <input
                  type="number"
                  min={1}
                  max={72}
                  {...form.register("reminderHoursBefore", {
                    valueAsNumber: true,
                  })}
                  className={inputCls() + " max-w-xs"}
                />
              </Field>
            </div>
          )}
          <Field
            label="Cancellation notifications"
            description="Notify client when appointment is cancelled"
            horizontal
          >
            <Toggle
              checked={vals.sendCancellationNotification}
              onChange={(v) => form.setValue("sendCancellationNotification", v)}
            />
          </Field>
          <Field
            label="Post-appointment follow-up"
            description="Send aftercare or review request after session"
            horizontal
          >
            <Toggle
              checked={vals.sendCompletionFollowUp}
              onChange={(v) => form.setValue("sendCompletionFollowUp", v)}
            />
          </Field>
          {vals.sendCompletionFollowUp && (
            <div className="pl-4 pb-3">
              <Field label="Follow-up delay (hours after)">
                <input
                  type="number"
                  min={1}
                  max={48}
                  {...form.register("followUpHoursAfter", {
                    valueAsNumber: true,
                  })}
                  className={inputCls() + " max-w-xs"}
                />
              </Field>
            </div>
          )}
        </div>
      </SettingsSection>

      <SettingsSection
        title="Financial Notifications"
        description="Emails sent when invoices and payments are processed"
      >
        <div className="space-y-0">
          <Field
            label="Send invoice emails"
            description="Email client when an invoice is issued"
            horizontal
          >
            <Toggle
              checked={vals.sendInvoiceEmail}
              onChange={(v) => form.setValue("sendInvoiceEmail", v)}
            />
          </Field>
          <Field
            label="Payment confirmations"
            description="Email client when payment is recorded"
            horizontal
          >
            <Toggle
              checked={vals.sendPaymentConfirmation}
              onChange={(v) => form.setValue("sendPaymentConfirmation", v)}
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
