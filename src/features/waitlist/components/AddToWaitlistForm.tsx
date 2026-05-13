"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { listClients } from "@/lib/api/clients";
import { extractArray } from "@/lib/api/response";
import api from "@/lib/api/client";
import { useJoinWaitlist } from "../hooks/useWaitlist";
import { Loader2, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

const schema = z.object({
  clientId: z.string().min(1, "Client required"),
  serviceId: z.string().min(1, "Service required"),
  doctorId: z.string().optional(),
  preferredDate: z.string().min(1, "Date required"),
  flexibleDate: z.boolean().default(false),
  note: z.string().optional(),
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

function ClientSearch({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (id: string) => void;
  error?: string;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");

  const { data } = useQuery({
    queryKey: ["clients", "search", q],
    queryFn: () => listClients({ search: q, limit: 8 }),
    enabled: q.length >= 1,
    select: (res) => extractArray(res),
  });
  const clients: any[] = data ?? [];

  return (
    <div className="relative">
      <div
        className={cn(
          "flex items-center gap-2 h-10 px-3 rounded-lg border bg-background text-sm",
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
          onFocus={() => q && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search client…"
          className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange("");
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
        <div className="absolute left-0 right-0 top-11 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden max-h-52 overflow-y-auto">
          {clients.map((c) => (
            <button
              key={c.id}
              type="button"
              onMouseDown={() => {
                onChange(c.id);
                setLabel(c.fullName);
                setQ("");
                setOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted transition-colors"
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
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
              <div>
                <p className="text-sm font-medium text-foreground">
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

interface Props {
  onDone: () => void;
}

export function AddToWaitlistForm({ onDone }: Props) {
  const join = useJoinWaitlist();

  const { data: servicesData } = useQuery({
    queryKey: ["services", "active"],
    queryFn: () => api.get("/services?isActive=true&limit=100"),
    select: (res) => extractArray(res),
  });
  const services: any[] = servicesData ?? [];

  const { data: doctorsData } = useQuery({
    queryKey: ["all-doctors"],
    queryFn: () => api.get("/users?role=doctor&limit=50"),
    select: (res) => extractArray(res),
  });
  const doctors: any[] = Array.isArray(doctorsData) ? doctorsData : [];

  const form = useForm<Schema>({
    resolver: zodResolver(schema),
    defaultValues: {
      clientId: "",
      serviceId: "",
      doctorId: "",
      preferredDate: "",
      flexibleDate: false,
      note: "",
    },
  });
  const {
    register,
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
  } = form;
  const flexibleDate = watch("flexibleDate");

  return (
    <form
      onSubmit={handleSubmit(async (d) => {
        await join.mutateAsync(d as any);
        onDone();
      })}
      className="space-y-4"
    >
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">Client *</label>
        <ClientSearch
          value={form.watch("clientId")}
          onChange={(id) => setValue("clientId", id, { shouldValidate: true })}
          error={errors.clientId?.message}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            Service *
          </label>
          <select
            {...register("serviceId")}
            className={cn(inp(errors.serviceId?.message), "cursor-pointer")}
          >
            <option value="">Select service…</option>
            {services.map((s) => (
              <option
                key={s.id}
                value={s.id}
              >
                {s.name}
              </option>
            ))}
          </select>
          {errors.serviceId && (
            <p className="text-xs text-destructive">
              {errors.serviceId.message}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            Preferred doctor
          </label>
          <select
            {...register("doctorId")}
            className={cn(inp(), "cursor-pointer")}
          >
            <option value="">Any doctor</option>
            {doctors.map((d) => (
              <option
                key={d.id}
                value={d.id}
              >
                {d.fullName}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            Preferred date *
          </label>
          <input
            type="date"
            {...register("preferredDate")}
            min={new Date().toISOString().split("T")[0]}
            className={inp(errors.preferredDate?.message)}
          />
          {errors.preferredDate && (
            <p className="text-xs text-destructive">
              {errors.preferredDate.message}
            </p>
          )}
        </div>
        <div className="flex items-end pb-0.5">
          <label className="flex items-center gap-3 cursor-pointer select-none p-3 rounded-xl hover:bg-muted/30 transition-colors border border-transparent hover:border-border/60 w-full">
            <div
              className={cn(
                "w-5 h-5 shrink-0 rounded-md border-2 flex items-center justify-center transition-all",
                flexibleDate ? "border-transparent" : "border-input",
              )}
              style={
                flexibleDate
                  ? { backgroundColor: "var(--brand-gold)" }
                  : undefined
              }
              onClick={() => setValue("flexibleDate", !flexibleDate)}
            >
              {flexibleDate && (
                <svg
                  className="w-3 h-3"
                  viewBox="0 0 12 12"
                  fill="none"
                >
                  <path
                    d="M2 6l3 3 5-5"
                    stroke="#1A1A2E"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Flexible date
              </p>
              <p className="text-xs text-muted-foreground">
                Any slot around that date
              </p>
            </div>
          </label>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">
          Note (optional)
        </label>
        <textarea
          {...register("note")}
          rows={2}
          placeholder="Any special requests or context…"
          className={cn(inp(), "h-auto py-2.5 resize-none")}
        />
      </div>

      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={join.isPending}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-60"
          style={{
            backgroundColor: "var(--brand-gold)",
            color: "var(--brand-navy)",
          }}
        >
          {join.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          Add to waitlist
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
