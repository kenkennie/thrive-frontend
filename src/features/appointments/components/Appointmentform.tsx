"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Plus, X, Search, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import servicesApi, { type Service, type Doctor } from "@/lib/api/services";
import clientsApi from "@/lib/api/clients";
import api from "@/lib/api/client";
import type { Appointment } from "@/lib/api/appointments";

// ── Schema ────────────────────────────────────────────────────────────────────

const schema = z.object({
  clientId: z.string().min(1, "Client is required"),
  doctorId: z.string().min(1, "Doctor is required"),
  date: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
  documentChoice: z.enum(["INVOICE", "QUOTE", "NONE"]).default("INVOICE"),
  clientNotes: z.string().optional(),
  internalNotes: z.string().optional(),
  sourceId: z.string().optional(),
  services: z
    .array(
      z.object({
        serviceId: z.string().min(1, "Service required"),
        variantId: z.string().optional(),
        quantity: z.number().int().positive().default(1),
        durationMin: z.number().int().positive().optional(),
      }),
    )
    .min(1, "At least one service is required"),
});

type Schema = z.infer<typeof schema>;

interface Props {
  appointment?: Appointment;
  onSubmit: (data: Schema) => Promise<void>;
  isLoading?: boolean;
  onCancel?: () => void;
}

// ── Client search ─────────────────────────────────────────────────────────────

function ClientSearch({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (id: string, name: string) => void;
  error?: string;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");

  const { data } = useQuery({
    queryKey: ["clients", "search", q],
    queryFn: () => clientsApi.list({ search: q, limit: 8 }).then((r) => r.data),
    enabled: q.length >= 1,
  });

  const clients = data?.data ?? [];

  return (
    <div className="relative">
      <div
        className={cn(
          "flex items-center gap-2 h-10 px-3 rounded-lg border bg-background text-sm transition-shadow",
          error
            ? "border-destructive"
            : "border-input focus-within:ring-2 focus-within:ring-ring/30",
        )}
      >
        <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <input
          value={label || q}
          onChange={(e) => {
            setQ(e.target.value);
            setLabel("");
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search client by name or phone…"
          className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange("", "");
              setLabel("");
              setQ("");
            }}
          >
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        )}
      </div>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
      {open && clients.length > 0 && (
        <div className="absolute left-0 right-0 top-11 bg-card border border-border rounded-xl shadow-xl z-40 overflow-hidden">
          {clients.map((c) => (
            <button
              key={c.id}
              type="button"
              onMouseDown={() => {
                onChange(c.id, c.fullName);
                setLabel(c.fullName);
                setQ("");
                setOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted transition-colors"
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                style={{
                  backgroundColor: "var(--brand-gold)",
                  color: "var(--brand-navy)",
                }}
              >
                {c.fullName
                  .split(" ")
                  .map((n: string) => n[0])
                  .slice(0, 2)
                  .join("")}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {c.fullName}
                </p>
                <p className="text-xs text-muted-foreground">{c.phoneNumber}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Service row ───────────────────────────────────────────────────────────────

function ServiceRow({
  index,
  services = [],
  onRemove,
  form,
}: {
  index: number;
  services: Service[];
  onRemove: () => void;
  form: any;
}) {
  const serviceId = form.watch(`services.${index}.serviceId`);
  const selected = Array.isArray(services)
    ? services.find((s) => s.id === serviceId)
    : undefined;
  const variants = selected?.variants ?? [];

  return (
    <div className="flex gap-2 items-start">
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
        {/* Service */}
        <div>
          <select
            {...form.register(`services.${index}.serviceId`)}
            className="w-full h-9 px-2 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 cursor-pointer"
          >
            <option value="">Select service…</option>
            {(Array.isArray(services) ? services : []).map((s) => (
              <option
                key={s.id}
                value={s.id}
              >
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Variant */}
        <div>
          <select
            {...form.register(`services.${index}.variantId`)}
            disabled={!variants.length}
            className="w-full h-9 px-2 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 cursor-pointer disabled:opacity-40"
          >
            <option value="">No variant</option>
            {variants.map((v) => (
              <option
                key={v.id}
                value={v.id}
              >
                {v.name}
              </option>
            ))}
          </select>
        </div>

        {/* Duration override */}
        <div>
          <input
            type="number"
            placeholder={`Duration (${selected?.durationMin ?? "—"} min)`}
            {...form.register(`services.${index}.durationMin`, {
              valueAsNumber: true,
            })}
            className="w-full h-9 px-2 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </div>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="mt-0.5 p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// ── Main form ─────────────────────────────────────────────────────────────────

const inputCls = (err?: string) =>
  cn(
    "w-full h-10 px-3 rounded-lg border bg-background text-sm text-foreground",
    "placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-shadow",
    err
      ? "border-destructive focus:ring-destructive/20"
      : "border-input focus:ring-ring/30",
  );

export function AppointmentForm({
  appointment,
  onSubmit,
  isLoading,
  onCancel,
}: Props) {
  const form = useForm<Schema>({
    resolver: zodResolver(schema),
    defaultValues: {
      clientId: appointment?.client?.id ?? "",
      doctorId: appointment?.doctor?.id ?? "",
      date: appointment?.date ?? new Date().toISOString().split("T")[0],
      startTime: appointment?.startTime ?? "",
      documentChoice: (appointment?.documentChoice as any) ?? "INVOICE",
      clientNotes: appointment?.clientNotes ?? "",
      internalNotes: appointment?.internalNotes ?? "",
      services: appointment?.appointmentServices?.map((s) => ({
        serviceId: s.service.id,
        variantId: s.variant?.name ?? "",
        quantity: s.quantity,
        durationMin: s.durationMin ?? undefined,
      })) ?? [{ serviceId: "", variantId: "", quantity: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "services",
  });
  const { errors } = form.formState;

  const doctorId = form.watch("doctorId");
  const date = form.watch("date");
  const services = form.watch("services");

  // Load services list
  const { data: servicesData } = useQuery({
    queryKey: ["services", "active"],
    queryFn: () =>
      servicesApi
        .list({ isActive: true, limit: 100 })
        .then((r) => r.data.data ?? []),
  });
  const servicesList: Service[] = servicesData ?? [];

  // Load doctors — first from selected service, then all doctors
  const firstServiceId = services[0]?.serviceId;
  const { data: serviceDoctors } = useQuery({
    queryKey: ["service-doctors", firstServiceId],
    queryFn: () =>
      servicesApi.getDoctors(firstServiceId).then((r) => r.data.data ?? []),
    enabled: !!firstServiceId,
  });

  const { data: allDoctorsData } = useQuery({
    queryKey: ["all-doctors"],
    queryFn: () =>
      api
        .get<any>("/users?role=doctor&limit=50")
        .then((r) => r.data?.data ?? []),
  });

  const doctors: Doctor[] =
    (serviceDoctors?.length ? serviceDoctors : allDoctorsData) ?? [];

  // Load availability slots
  const serviceIds = services.map((s) => s.serviceId).filter(Boolean);
  const { data: availData } = useQuery({
    queryKey: ["availability", serviceIds, doctorId, date],
    queryFn: () =>
      servicesApi
        .getAvailability({ serviceIds, doctorId, date })
        .then((r) => r.data.data ?? []),
    enabled: serviceIds.length > 0 && !!doctorId && !!date,
  });

  const availableSlots = Array.isArray(availData)
    ? availData.filter((s: any) => s.available).map((s: any) => s.time)
    : [];

  // Load booking sources
  const { data: sourcesData } = useQuery({
    queryKey: ["booking-sources"],
    queryFn: () =>
      api.get<any>("/settings/booking-sources").then((r) => r.data?.data ?? []),
  });
  const sources = sourcesData ?? [];

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-5"
    >
      {/* Client */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">Client *</label>
        <ClientSearch
          value={form.watch("clientId")}
          onChange={(id) =>
            form.setValue("clientId", id, { shouldValidate: true })
          }
          error={errors.clientId?.message}
        />
      </div>

      {/* Services */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">
            Services *
          </label>
          <button
            type="button"
            onClick={() =>
              append({ serviceId: "", variantId: "", quantity: 1 })
            }
            className="flex items-center gap-1 text-xs font-medium hover:underline"
            style={{ color: "var(--brand-gold)" }}
          >
            <Plus className="w-3.5 h-3.5" />
            Add service
          </button>
        </div>
        <div className="space-y-2">
          {fields.map((field, index) => (
            <ServiceRow
              key={field.id}
              index={index}
              services={servicesList ?? []}
              onRemove={() => remove(index)}
              form={form}
            />
          ))}
        </div>
        {errors.services && (
          <p className="text-xs text-destructive">
            {typeof errors.services === "object" && "message" in errors.services
              ? (errors.services as any).message
              : "Please fix service errors"}
          </p>
        )}
      </div>

      {/* Doctor */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">Doctor *</label>
        <select
          {...form.register("doctorId")}
          className={cn(inputCls(errors.doctorId?.message), "cursor-pointer")}
        >
          <option value="">Select doctor…</option>
          {doctors.map((d: Doctor) => (
            <option
              key={d.id}
              value={d.id}
            >
              {d.fullName}
            </option>
          ))}
        </select>
        {errors.doctorId && (
          <p className="text-xs text-destructive">{errors.doctorId.message}</p>
        )}
      </div>

      {/* Date + Time */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Date *</label>
          <input
            type="date"
            {...form.register("date")}
            min={new Date().toISOString().split("T")[0]}
            className={inputCls(errors.date?.message)}
          />
          {errors.date && (
            <p className="text-xs text-destructive">{errors.date.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            Start time *
          </label>
          {availableSlots.length > 0 ? (
            <select
              {...form.register("startTime")}
              className={cn(
                inputCls(errors.startTime?.message),
                "cursor-pointer",
              )}
            >
              <option value="">Select slot…</option>
              {availableSlots.map((slot: string) => (
                <option
                  key={slot}
                  value={slot}
                >
                  {slot}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="time"
              step={900}
              {...form.register("startTime")}
              className={inputCls(errors.startTime?.message)}
            />
          )}
          {errors.startTime && (
            <p className="text-xs text-destructive">
              {errors.startTime.message}
            </p>
          )}
        </div>
      </div>

      {/* Document choice */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">Document</label>
        <div className="flex gap-2">
          {(["INVOICE", "QUOTE", "NONE"] as const).map((choice) => (
            <label
              key={choice}
              className="flex items-center gap-2 cursor-pointer"
            >
              <input
                type="radio"
                value={choice}
                {...form.register("documentChoice")}
                className="accent-[var(--brand-gold)]"
              />
              <span className="text-sm text-foreground">{choice}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Booking source */}
      {sources.length > 0 && (
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            Booking source
          </label>
          <select
            {...form.register("sourceId")}
            className={cn(inputCls(), "cursor-pointer")}
          >
            <option value="">Select source…</option>
            {sources.map((s: any) => (
              <option
                key={s.id}
                value={s.id}
              >
                {s.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Notes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            Client notes
          </label>
          <textarea
            {...form.register("clientNotes")}
            rows={3}
            placeholder="Notes visible to client…"
            className={cn(inputCls(), "h-auto py-2 resize-none")}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            Internal notes
          </label>
          <textarea
            {...form.register("internalNotes")}
            rows={3}
            placeholder="Staff-only notes…"
            className={cn(inputCls(), "h-auto py-2 resize-none")}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-60 transition-all"
          style={{
            backgroundColor: "var(--brand-gold)",
            color: "var(--brand-navy)",
          }}
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          {appointment ? "Save changes" : "Book appointment"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-lg text-sm border border-border hover:bg-muted transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
