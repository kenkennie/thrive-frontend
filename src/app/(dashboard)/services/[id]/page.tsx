"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useService,
  useServiceVariants,
  useContraindications,
  useServiceDoctors,
  useUpdateService,
  useDeleteService,
  useCreateVariant,
  useDeleteVariant,
  useCreateContraindication,
  useDeleteContraindication,
  useAssignDoctor,
  useRemoveDoctor,
  useServiceAvailability,
} from "@/features/services/hooks/useServices";
import { ServiceForm } from "@/features/services/components/serviceForm";
import { usePermission } from "@/hooks/usePermission";
import { useQuery } from "@tanstack/react-query";
import { extractArray } from "@/lib/api/response";
import api from "@/lib/api/client";
import { formatCurrency, getInitials, cn } from "@/lib/utils";
import {
  ArrowLeft,
  Trash2,
  Loader2,
  Clock,
  AlertTriangle,
  User,
  CalendarDays,
  Check,
  Plus,
  X,
  Edit2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

type Tab =
  | "edit"
  | "variants"
  | "contraindications"
  | "doctors"
  | "availability";

const TABS: { id: Tab; label: string }[] = [
  { id: "edit", label: "Details" },
  { id: "variants", label: "Variants" },
  { id: "contraindications", label: "Contraindications" },
  { id: "doctors", label: "Doctors" },
  { id: "availability", label: "Availability" },
];

// ── Variants Tab ──────────────────────────────────────────────────────────────

function VariantsTab({
  serviceId,
  currency,
}: {
  serviceId: string;
  currency: string;
}) {
  const { data } = useServiceVariants(serviceId);
  const variants = Array.isArray(data) ? data : [];
  const create = useCreateVariant(serviceId);
  const remove = useDeleteVariant(serviceId);
  const canEdit = usePermission("services:update");

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [dur, setDur] = useState("60");
  const [price, setPrice] = useState("");

  const submit = () => {
    if (!name.trim() || !price) return;
    create.mutate({
      name: name.trim(),
      durationMin: parseInt(dur),
      price: parseFloat(price),
    });
    setName("");
    setDur("60");
    setPrice("");
    setShowForm(false);
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Variants let you offer this service at different durations or price
        points — e.g. Express (45 min), Standard (60 min), Deluxe (90 min).
      </p>

      {variants.length === 0 && !showForm && (
        <div className="flex flex-col items-center justify-center h-24 gap-1 border border-dashed border-border rounded-xl">
          <p className="text-sm text-muted-foreground">No variants yet</p>
        </div>
      )}

      {variants.map((v: any) => (
        <div
          key={v.id}
          className="flex items-center gap-3 p-3.5 bg-muted/20 border border-border rounded-xl"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">{v.name}</p>
            <p className="text-xs text-muted-foreground">
              {v.durationMin} min ·{" "}
              {formatCurrency(v.price, v.currency ?? currency)}
            </p>
          </div>
          {canEdit && (
            <button
              onClick={() => {
                if (confirm(`Remove "${v.name}"?`)) remove.mutate(v.id);
              }}
              className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ))}

      {showForm ? (
        <div className="p-4 border border-border rounded-xl space-y-3 bg-muted/10">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            New variant
          </p>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Variant name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Express"
                autoFocus
                className="w-full h-9 px-2.5 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Duration (min)
              </label>
              <input
                type="number"
                min={5}
                step={5}
                value={dur}
                onChange={(e) => setDur(e.target.value)}
                className="w-full h-9 px-2.5 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Price ({currency})
              </label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full h-9 px-2.5 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={submit}
              disabled={create.isPending || !name.trim() || !price}
              className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-all"
              style={{
                backgroundColor: "var(--brand-gold)",
                color: "var(--brand-navy)",
              }}
            >
              {create.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              Add variant
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setName("");
                setDur("60");
                setPrice("");
              }}
              className="px-4 py-2 rounded-lg text-sm border border-border hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        canEdit && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 text-sm font-medium hover:underline transition-colors"
            style={{ color: "var(--brand-gold)" }}
          >
            <Plus className="w-4 h-4" />
            Add variant
          </button>
        )
      )}
    </div>
  );
}

// ── Contraindications Tab ─────────────────────────────────────────────────────

function ContraindicationsTab({ serviceId }: { serviceId: string }) {
  const { data } = useContraindications(serviceId);
  const contras = Array.isArray(data) ? data : [];
  const create = useCreateContraindication(serviceId);
  const remove = useDeleteContraindication(serviceId);
  const canEdit = usePermission("services:update");

  const [showForm, setShowForm] = useState(false);
  const [desc, setDesc] = useState("");
  const [isCritical, setIsCritical] = useState(false);

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Contraindications are conditions or medications that make this treatment
        unsafe or unsuitable. Staff are alerted when a client has a matching
        intake form flag.
      </p>

      {contras.length === 0 && !showForm && (
        <div className="flex flex-col items-center justify-center h-24 gap-1 border border-dashed border-border rounded-xl">
          <p className="text-sm text-muted-foreground">
            No contraindications recorded
          </p>
        </div>
      )}

      {contras.map((c: any) => (
        <div
          key={c.id}
          className={cn(
            "flex items-start gap-3 p-3.5 border rounded-xl",
            c.isCritical
              ? "border-red-200 bg-red-50 dark:border-red-800/40 dark:bg-red-900/10"
              : "border-amber-200 bg-amber-50 dark:border-amber-800/40 dark:bg-amber-900/10",
          )}
        >
          <AlertTriangle
            className={cn(
              "w-4 h-4 mt-0.5 shrink-0",
              c.isCritical
                ? "text-red-600 dark:text-red-400"
                : "text-amber-600 dark:text-amber-400",
            )}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground">{c.description}</p>
            {c.isCritical && (
              <p className="text-xs font-semibold text-red-700 dark:text-red-400 mt-0.5">
                Critical — treatment must not be performed
              </p>
            )}
          </div>
          {canEdit && (
            <button
              onClick={() => remove.mutate(c.id)}
              className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ))}

      {showForm ? (
        <div className="p-4 border border-border rounded-xl space-y-3 bg-muted/10">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Add contraindication
          </p>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Describe the contraindication, e.g. Active rosacea or severe acne…"
            rows={2}
            autoFocus
            className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <div
              className={cn(
                "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                isCritical
                  ? "border-transparent bg-red-600"
                  : "border-input bg-background",
              )}
              onClick={() => setIsCritical((v) => !v)}
            >
              {isCritical && (
                <svg
                  className="w-3 h-3"
                  viewBox="0 0 12 12"
                  fill="none"
                >
                  <path
                    d="M2 6l3 3 5-5"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Critical contraindication
              </p>
              <p className="text-xs text-muted-foreground">
                Treatment must never be performed if this applies
              </p>
            </div>
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (!desc.trim()) return;
                create.mutate({ description: desc.trim(), isCritical });
                setDesc("");
                setIsCritical(false);
                setShowForm(false);
              }}
              disabled={create.isPending || !desc.trim()}
              className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-all"
              style={{
                backgroundColor: "var(--brand-gold)",
                color: "var(--brand-navy)",
              }}
            >
              {create.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              Add
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setDesc("");
                setIsCritical(false);
              }}
              className="px-4 py-2 rounded-lg text-sm border border-border hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        canEdit && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 text-sm font-medium hover:underline transition-colors"
            style={{ color: "var(--brand-gold)" }}
          >
            <Plus className="w-4 h-4" />
            Add contraindication
          </button>
        )
      )}
    </div>
  );
}

// ── Doctors Tab ───────────────────────────────────────────────────────────────

function DoctorsTab({ serviceId }: { serviceId: string }) {
  const { data } = useServiceDoctors(serviceId);
  const assignedDoctors = Array.isArray(data) ? data : [];
  const assign = useAssignDoctor(serviceId);
  const removeDr = useRemoveDoctor(serviceId);
  const canEdit = usePermission("services:assign_doctors");

  const { data: allDrData } = useQuery({
    queryKey: ["all-doctors"],
    queryFn: () => api.get("/users?role=doctor&limit=50"),
    select: (res) => extractArray(res),
  });

  const allDoctors = Array.isArray(allDrData) ? allDrData : [];
  const assignedIds = assignedDoctors.map((d: any) => d.id);
  const unassigned = allDoctors.filter((d: any) => !assignedIds.includes(d.id));

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Only assigned doctors will appear as options when booking this service.
        Assign all doctors who are qualified to perform this treatment.
      </p>

      {/* Assigned */}
      <div className="space-y-2">
        {assignedDoctors.length === 0 && (
          <div className="flex flex-col items-center justify-center h-20 gap-1 border border-dashed border-border rounded-xl">
            <p className="text-sm text-muted-foreground">
              No doctors assigned yet
            </p>
          </div>
        )}
        {assignedDoctors.map((d: any) => (
          <div
            key={d.id}
            className="flex items-center gap-3 p-3 border border-border rounded-xl bg-muted/10"
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
              style={{
                backgroundColor: "var(--brand-gold)",
                color: "var(--brand-navy)",
              }}
            >
              {getInitials(d.fullName)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">
                {d.fullName}
              </p>
              {d.staffProfile?.specialisation && (
                <p className="text-xs text-muted-foreground">
                  {d.staffProfile.specialisation}
                </p>
              )}
            </div>
            {canEdit && (
              <button
                onClick={() => removeDr.mutate(d.id)}
                disabled={removeDr.isPending}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground border border-border hover:bg-destructive/5 hover:text-destructive hover:border-destructive/30 transition-colors disabled:opacity-50"
              >
                <X className="w-3 h-3" />
                Remove
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Unassigned doctors */}
      {canEdit && unassigned.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Available to assign
          </p>
          <div className="flex flex-wrap gap-2">
            {unassigned.map((d: any) => (
              <button
                key={d.id}
                onClick={() => assign.mutate(d.id)}
                disabled={assign.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-dashed border-border hover:border-primary/40 hover:bg-muted transition-colors disabled:opacity-50"
              >
                {assign.isPending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Plus className="w-3 h-3" />
                )}
                {d.fullName}
              </button>
            ))}
          </div>
        </div>
      )}

      {canEdit && unassigned.length === 0 && assignedDoctors.length > 0 && (
        <p className="text-xs text-muted-foreground">
          All available doctors are assigned to this service.
        </p>
      )}
    </div>
  );
}

// ── Availability Tab ──────────────────────────────────────────────────────────

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function AvailabilityTab({ serviceId }: { serviceId: string }) {
  const today = new Date();
  const [cur, setCur] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  });
  const [doctorId, setDoctorId] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const { data: doctors } = useServiceDoctors(serviceId);
  const doctorList = Array.isArray(doctors) ? doctors : [];

  const { data: avail, isLoading } = useServiceAvailability(
    serviceId,
    cur.month + 1,
    cur.year,
    doctorId || undefined,
  );
  const slots = Array.isArray(avail) ? avail : [];

  const slotMap = new Map(slots.map((s: any) => [s.date, s]));

  const firstDay = new Date(cur.year, cur.month, 1).getDay();
  const daysInMonth = new Date(cur.year, cur.month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const navigate = (d: number) => {
    const next = new Date(cur.year, cur.month + d, 1);
    setCur({ year: next.getFullYear(), month: next.getMonth() });
    setSelected(null);
  };

  const todayStr = today.toISOString().split("T")[0];
  const selectedSlot = selected ? slotMap.get(selected) : null;

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        View which dates and time slots are available for this service. Click a
        date to see available times.
      </p>

      {/* Doctor filter */}
      {doctorList.length > 1 && (
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-muted-foreground shrink-0" />
          <select
            value={doctorId}
            onChange={(e) => {
              setDoctorId(e.target.value);
              setSelected(null);
            }}
            className="h-8 px-2.5 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none cursor-pointer"
          >
            <option value="">All doctors</option>
            {doctorList.map((d: any) => (
              <option
                key={d.id}
                value={d.id}
              >
                {d.fullName}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex gap-4">
        {/* Calendar */}
        <div className="flex-1 bg-muted/10 rounded-2xl border border-border overflow-hidden">
          {/* Nav */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-foreground">
              {MONTHS[cur.month]} {cur.year}
            </span>
            <button
              onClick={() => navigate(1)}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Day labels */}
          <div className="grid grid-cols-7 border-b border-border bg-muted/30">
            {DAYS.map((d) => (
              <div
                key={d}
                className="py-2 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wide"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Cells */}
          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              if (!day)
                return (
                  <div
                    key={`e-${i}`}
                    className="h-14 border-b border-r border-border/40 bg-muted/5"
                  />
                );

              const dateStr = `${cur.year}-${String(cur.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const info = slotMap.get(dateStr) as any;
              const isPast = dateStr < todayStr;
              const isToday = dateStr === todayStr;
              const isSel = selected === dateStr;

              return (
                <button
                  key={dateStr}
                  onClick={() =>
                    info && !isPast && setSelected(isSel ? null : dateStr)
                  }
                  disabled={!info || isPast || !info.available}
                  className={cn(
                    "h-14 p-1.5 text-left border-b border-r border-border/40 transition-colors",
                    !isPast &&
                      info?.available &&
                      !isSel &&
                      "hover:bg-muted/30 cursor-pointer",
                    isSel && "bg-primary/5 ring-2 ring-inset ring-primary",
                    (isPast || !info?.available) && "cursor-default opacity-60",
                  )}
                >
                  <span
                    className={cn(
                      "flex items-center justify-center w-6 h-6 text-xs font-medium rounded-full",
                      isToday && "font-bold text-brand-navy",
                      isSel && !isToday && "text-primary font-bold",
                      !isToday && !isSel && "text-foreground",
                    )}
                    style={
                      isToday
                        ? { backgroundColor: "var(--brand-gold)" }
                        : undefined
                    }
                  >
                    {day}
                  </span>
                  {info && !isPast && (
                    <span
                      className={cn(
                        "text-[9px] font-medium",
                        info.available
                          ? "text-green-600 dark:text-green-400"
                          : "text-muted-foreground",
                      )}
                    >
                      {info.available ? `${info.count ?? ""} open` : "Full"}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="px-4 py-2 border-t border-border flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500" /> Available
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />{" "}
              Full / unavailable
            </span>
          </div>
        </div>

        {/* Slot list */}
        {selected && selectedSlot && (
          <div className="w-48 shrink-0 bg-card rounded-2xl border border-border overflow-hidden">
            <div className="px-3 py-3 border-b border-border bg-muted/20">
              <p className="text-sm font-semibold text-foreground">
                {new Date(selected).toLocaleDateString("en-KE", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {(selectedSlot as any).count ?? 0} slots available
              </p>
            </div>
            <div className="p-2 space-y-1.5 max-h-72 overflow-y-auto">
              {((selectedSlot as any).slots ?? []).map((time: string) => (
                <div
                  key={time}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/40"
                >
                  <Clock className="w-3.5 h-3.5 text-green-600 dark:text-green-400 shrink-0" />
                  <span className="text-sm font-medium text-foreground">
                    {time}
                  </span>
                </div>
              ))}
              {!(selectedSlot as any).slots?.length && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No time details available
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function ServiceDetailPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();

  const { data: service, isLoading } = useService(id);
  const update = useUpdateService(id);
  const remove = useDeleteService();

  const canEdit = usePermission("services:update");
  const canDelete = usePermission("services:delete");

  const [tab, setTab] = useState<Tab>("edit");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-muted-foreground">Service not found</p>
        <button
          onClick={() => router.back()}
          className="text-sm hover:underline"
          style={{ color: "var(--brand-gold)" }}
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto space-y-5">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Services
      </button>

      {/* Header */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div
          className="h-1.5"
          style={{ backgroundColor: service.color ?? "#C8A96E" }}
        />
        <div className="px-6 py-4 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-foreground">
                {service.name}
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                {service.serviceType}
              </span>
              {!service.isActive && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  Inactive
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {service.category?.name}
            </p>
            <div className="flex items-center gap-4 mt-1.5">
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                {service.durationMin} min
              </span>
              <span className="text-sm font-semibold text-foreground">
                {formatCurrency(service.price, service.currency)}
              </span>
            </div>
          </div>

          {canDelete && (
            <button
              onClick={() => {
                if (
                  confirm(`Delete "${service.name}"? This cannot be undone.`)
                ) {
                  remove.mutate(id);
                  router.push("/services");
                }
              }}
              disabled={remove.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-destructive border border-destructive/30 hover:bg-destructive/5 transition-colors disabled:opacity-50 shrink-0"
            >
              {remove.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-border overflow-x-auto">
          {TABS.map(({ id: tabId, label }) => (
            <button
              key={tabId}
              onClick={() => setTab(tabId)}
              className={cn(
                "flex-1 min-w-fit px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px",
                tab === tabId
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-6">
          {tab === "edit" &&
            (canEdit ? (
              <ServiceForm
                service={service}
                isLoading={update.isPending}
                onSubmit={async (data) => {
                  await update.mutateAsync(data as any);
                }}
              />
            ) : (
              <div className="space-y-3">
                {[
                  { label: "Duration", value: `${service.durationMin} min` },
                  {
                    label: "Price",
                    value: formatCurrency(service.price, service.currency),
                  },
                  { label: "Category", value: service.category?.name },
                  { label: "Type", value: service.serviceType },
                  { label: "Max clients", value: service.maxCapacity },
                  {
                    label: "Tax exempt",
                    value: service.isTaxExempt ? "Yes" : "No",
                  },
                  {
                    label: "Consent",
                    value: service.requiresConsent
                      ? "Required"
                      : "Not required",
                  },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between py-2 border-b border-border/60 last:border-0"
                  >
                    <span className="text-sm text-muted-foreground">
                      {label}
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {value}
                    </span>
                  </div>
                ))}
                {service.description && (
                  <div className="pt-2">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Description
                    </p>
                    <p className="text-sm text-foreground">
                      {service.description}
                    </p>
                  </div>
                )}
              </div>
            ))}

          {tab === "variants" && (
            <VariantsTab
              serviceId={id}
              currency={service.currency}
            />
          )}
          {tab === "contraindications" && (
            <ContraindicationsTab serviceId={id} />
          )}
          {tab === "doctors" && <DoctorsTab serviceId={id} />}
          {tab === "availability" && <AvailabilityTab serviceId={id} />}
        </div>
      </div>
    </div>
  );
}
