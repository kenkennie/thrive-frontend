"use client";

import { formatDate, formatTime, formatCurrency, cn } from "@/lib/utils";
import { StatusBadge } from "./StatusBadge";
import type { Appointment } from "@/lib/api/appointments";
import {
  User,
  Phone,
  Mail,
  Clock,
  Calendar,
  Stethoscope,
  FileText,
  CreditCard,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { StatusActions } from "./Statusactions";

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
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-4">
        {title}
      </h3>
      <div className="px-4">{children}</div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ElementType;
  label: string;
  value: string | React.ReactNode;
  href?: string;
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        {href ? (
          <a
            href={href}
            className="text-sm font-medium text-primary hover:underline"
          >
            {value}
          </a>
        ) : (
          <p className="text-sm font-medium text-foreground">{value}</p>
        )}
      </div>
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
    source,
    treatmentPlan,
  } = appointment;

  const totalAmount = appointmentServices.reduce((s, a) => s + a.totalPrice, 0);

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

        {/* Status actions */}
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
            <InfoRow
              icon={Mail}
              label="Email"
              value={client.email}
              href={`mailto:${client.email}`}
            />
          )}
          <InfoRow
            icon={Phone}
            label="Phone"
            value={client.phoneNumber}
            href={`tel:${client.phoneNumber}`}
          />
          {client.noShowCount > 0 && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
              ⚠ {client.noShowCount} lifetime no-show
              {client.noShowCount > 1 ? "s" : ""}
            </p>
          )}
        </Section>

        {/* Services */}
        <Section title="Services">
          <div className="space-y-2">
            {appointmentServices.map((as, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-1.5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {as.service.name}
                    {as.variant && (
                      <span className="text-muted-foreground font-normal">
                        {" "}
                        — {as.variant.name}
                      </span>
                    )}
                  </p>
                  {as.durationMin && (
                    <p className="text-xs text-muted-foreground">
                      {as.durationMin} min
                    </p>
                  )}
                </div>
                <span className="text-sm font-medium text-foreground shrink-0 ml-3">
                  {formatCurrency(as.totalPrice)}
                </span>
              </div>
            ))}
            {appointmentServices.length > 1 && (
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-sm font-semibold">Total</span>
                <span
                  className="text-sm font-semibold"
                  style={{ color: "var(--brand-gold)" }}
                >
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            )}
          </div>
        </Section>

        {/* Doctor */}
        <Section title="Assigned Doctor">
          <InfoRow
            icon={Stethoscope}
            label="Doctor"
            value={doctor.fullName}
          />
          {source && (
            <InfoRow
              icon={ExternalLink}
              label="Booking source"
              value={source.label}
            />
          )}
          {treatmentPlan && (
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">
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
              <div className="mb-3">
                <p className="text-xs text-muted-foreground mb-1">
                  Client note
                </p>
                <p className="text-sm text-foreground bg-muted/50 rounded-lg p-2.5">
                  {clientNotes}
                </p>
              </div>
            )}
            {internalNotes && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Internal note
                </p>
                <p className="text-sm text-foreground bg-amber-50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-800/30 rounded-lg p-2.5">
                  {internalNotes}
                </p>
              </div>
            )}
          </Section>
        )}
      </div>

      {/* Footer link */}
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
