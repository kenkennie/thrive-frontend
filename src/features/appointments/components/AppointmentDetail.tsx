// src/features/appointments/components/AppointmentDetail.tsx
"use client";

import { formatDate, formatTime, formatCurrency, cn } from "@/lib/utils";
import { StatusBadge } from "./StatusBadge";
import { StatusActions } from "./StatusActions";
import type { Appointment } from "@/lib/api/appointments";
import {
  User,
  Phone,
  Mail,
  Clock,
  Stethoscope,
  FileText,
  CreditCard,
  ExternalLink,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

interface Props {
  appointment: Appointment;
  onClose?: () => void;
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-4">
        {title}
      </h3>
      <div className="px-4">{children}</div>
    </div>
  );
}

export function AppointmentDetail({ appointment, onClose }: Props) {
  const {
    client,
    doctor,
    status,
    appointmentServices,
    date,
    startTime,
    endTime,
    invoice,
    internalNotes,
    clientNotes,
  } = appointment;

  const source = (appointment as any).source;
  const treatmentPlan = (appointment as any).treatmentPlan;

  // Amount breakdown from service definitions
  const subtotal = appointmentServices.reduce(
    (s, a) => s + (a.totalPrice ?? 0),
    0,
  );

  // Consultation fee (STANDALONE only)
  const consultationFee = appointmentServices.reduce((s, a) => {
    const fee = (a.service as any)?.consultationFee ?? 0;
    const model = (a.service as any)?.consultationFeeModel;
    return model === "STANDALONE" ? s + fee : s;
  }, 0);

  const estimatedTotal = subtotal + consultationFee;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-4 border-b border-border bg-muted/30 shrink-0">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              {client.fullName}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {formatDate(date, "long")} · {formatTime(startTime)} —{" "}
              {formatTime(endTime)}
            </p>
          </div>
          <StatusBadge status={status} />
        </div>
        {/* Action buttons */}
        <StatusActions
          appointment={appointment}
          onDone={onClose}
          compact
        />
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto divide-y divide-border/60 py-2">
        {/* Client */}
        <Section title="Client">
          <Link
            href={`/clients/${client.id}`}
            className="flex items-center justify-between py-2 group"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
                style={{
                  backgroundColor: "var(--brand-gold)",
                  color: "var(--brand-navy)",
                }}
              >
                {client.fullName
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {client.fullName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {client.phoneNumber}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </Link>
          {client.email && (
            <a
              href={`mailto:${client.email}`}
              className="flex items-center gap-2 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Mail className="w-3.5 h-3.5" /> {client.email}
            </a>
          )}
          <a
            href={`tel:${client.phoneNumber}`}
            className="flex items-center gap-2 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Phone className="w-3.5 h-3.5" /> {client.phoneNumber}
          </a>
          {client.noShowCount > 0 && (
            <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {client.noShowCount} lifetime no-show
              {client.noShowCount > 1 ? "s" : ""}
            </p>
          )}
        </Section>

        {/* Services + Amount breakdown */}
        <Section title="Services & Amount">
          <div className="space-y-1.5 pt-1">
            {appointmentServices.map((as, i) => (
              <div
                key={i}
                className="flex items-start justify-between gap-2"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {as.service.name}
                    {as.variant && (
                      <span className="text-muted-foreground font-normal">
                        {" "}
                        — {as.variant.name}
                      </span>
                    )}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {as.durationMin && (
                      <span className="text-xs text-muted-foreground">
                        {as.durationMin} min
                      </span>
                    )}
                    {as.quantity > 1 && (
                      <span className="text-xs text-muted-foreground">
                        ×{as.quantity}
                      </span>
                    )}
                    {!(as.service as any)?.isTaxExempt && (
                      <span className="text-xs text-blue-500">VAT</span>
                    )}
                  </div>
                </div>
                <span className="text-sm font-medium text-foreground shrink-0">
                  {formatCurrency(as.totalPrice ?? 0)}
                </span>
              </div>
            ))}

            {consultationFee > 0 && (
              <div className="flex items-center justify-between py-1">
                <span className="text-sm text-muted-foreground">
                  Consultation fee
                </span>
                <span className="text-sm font-medium text-foreground">
                  {formatCurrency(consultationFee)}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="text-sm font-bold text-foreground">
                Est. total
              </span>
              <span
                className="text-sm font-bold"
                style={{ color: "var(--brand-gold)" }}
              >
                {formatCurrency(estimatedTotal)}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground">
              VAT and final adjustments applied at invoice stage.
            </p>
          </div>
        </Section>

        {/* Doctor */}
        <Section title="Doctor">
          <div className="flex items-center gap-2 py-2">
            <Stethoscope className="w-4 h-4 text-muted-foreground shrink-0" />
            <p className="text-sm font-medium text-foreground">
              {doctor.fullName}
            </p>
          </div>
          {source && (
            <p className="text-xs text-muted-foreground pb-2">
              via {source.label}
            </p>
          )}
          {treatmentPlan && (
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground">
                    Treatment Plan
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {treatmentPlan.title}
                  </p>
                </div>
              </div>
              <Link href={`/clinical/treatment-plans/${treatmentPlan.id}`}>
                <ChevronRight className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
              </Link>
            </div>
          )}
        </Section>

        {/* Invoice */}
        {invoice && (
          <Section title="Invoice">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <CreditCard className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">
                    {invoice.invoiceNumber}
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {formatCurrency(invoice.totalAmount, invoice.currency)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "text-xs px-2 py-0.5 rounded-full",
                    invoice.status === "PAID"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : invoice.status === "DRAFT"
                        ? "bg-muted text-muted-foreground"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                  )}
                >
                  {invoice.status}
                </span>
                <Link href={`/invoices/${invoice.id}`}>
                  <ChevronRight className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
                </Link>
              </div>
            </div>
            {invoice.amountDue > 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Outstanding:{" "}
                {formatCurrency(invoice.amountDue, invoice.currency)}
              </p>
            )}
          </Section>
        )}

        {/* Notes */}
        {(clientNotes || internalNotes) && (
          <Section title="Notes">
            {clientNotes && (
              <p className="text-sm text-foreground bg-muted/50 rounded-lg p-2.5 mb-2">
                {clientNotes}
              </p>
            )}
            {internalNotes && (
              <p className="text-sm text-foreground bg-amber-50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-800/30 rounded-lg p-2.5">
                {internalNotes}
              </p>
            )}
          </Section>
        )}
      </div>

      {/* Footer */}
      <div className="shrink-0 px-4 py-3 border-t border-border">
        <Link
          href={`/appointments/${appointment.id}`}
          className="flex items-center justify-center gap-2 w-full py-2 rounded-lg text-sm font-medium border border-border hover:bg-muted transition-colors text-foreground"
        >
          View full details
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
