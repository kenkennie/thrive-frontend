"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useUpdateClient,
  useClient,
  useClientIntakeForms,
  useClientInvoices,
} from "@/features/clients/hooks/useClients";
import { ClientForm } from "@/features/clients/components/ClientForm";
import { PhotoGallery } from "@/features/clients/components/PhotoGallery";
import { TreatmentHistory } from "@/features/clients/components/TreatmentHistory";
import { getInitials, formatDate, formatCurrency, cn } from "@/lib/utils";
import { usePermission } from "@/hooks/usePermission";
import {
  ArrowLeft,
  Edit2,
  X,
  Phone,
  Mail,
  Calendar,
  User,
  AlertCircle,
  ShieldCheck,
  ShieldOff,
  CheckCircle2,
  FileText,
  Camera,
  ClipboardList,
  Receipt,
} from "lucide-react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { PhotoConsentToggle } from "@/features/clients/components/PhotoConsentToggle";

interface Props {
  params: Promise<{ id: string }>;
}

type Tab = "overview" | "history" | "photos" | "intake" | "invoices";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: User },
  { id: "history", label: "Treatment History", icon: ClipboardList },
  { id: "photos", label: "Photos", icon: Camera },
  { id: "intake", label: "Intake Forms", icon: FileText },
  { id: "invoices", label: "Invoices", icon: Receipt },
];

// ── Intake forms tab ──────────────────────────────────────────────────────────

function IntakeForms({ clientId }: { clientId: string }) {
  const { data: forms, isLoading } = useClientIntakeForms(clientId);

  if (isLoading)
    return <div className="h-32 rounded-xl bg-muted/50 animate-pulse" />;
  if (!forms?.length) {
    return (
      <div className="flex flex-col items-center justify-center h-32 gap-2 border border-dashed border-border rounded-xl">
        <FileText className="w-8 h-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">No intake forms on file</p>
      </div>
    );
  }

  const FLAG_LABELS: Record<string, string> = {
    isPregnant: "Pregnant",
    hasActiveSkinInfection: "Active skin infection",
    hasRecentSunExposure: "Recent sun exposure",
    onBloodThinners: "On blood thinners",
    hasHerpesHistory: "Herpes history",
  };

  return (
    <div className="space-y-3">
      {forms.map((form) => {
        const flags = Object.entries(FLAG_LABELS)
          .filter(([key]) => (form as any)[key])
          .map(([, label]) => label);

        return (
          <div
            key={form.id}
            className="border border-border rounded-xl p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {form.service?.name ?? "General intake"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(form.completedAt, "long")}
                </p>
              </div>
              <span
                className={cn(
                  "text-xs px-2 py-0.5 rounded-full",
                  form.treatmentConsentGiven
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                )}
              >
                {form.treatmentConsentGiven ? "Consented" : "No consent"}
              </span>
            </div>

            {flags.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">
                  Flags
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {flags.map((f) => (
                    <span
                      key={f}
                      className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    >
                      ⚠ {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {form.skinConcerns && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Skin concerns
                </p>
                <p className="text-sm text-foreground">{form.skinConcerns}</p>
              </div>
            )}
            {form.currentMedications && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Medications
                </p>
                <p className="text-sm text-foreground">
                  {form.currentMedications}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Invoice tab ───────────────────────────────────────────────────────────────

function Invoices({ clientId }: { clientId: string }) {
  const { data, isLoading } = useClientInvoices(clientId);
  const invoices = (data as any)?.data ?? [];

  if (isLoading)
    return <div className="h-32 rounded-xl bg-muted/50 animate-pulse" />;
  if (!invoices.length) {
    return (
      <div className="flex flex-col items-center justify-center h-32 gap-2 border border-dashed border-border rounded-xl">
        <Receipt className="w-8 h-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">No invoices yet</p>
      </div>
    );
  }

  const STATUS_STYLE: Record<string, string> = {
    PAID: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    DRAFT: "bg-muted text-muted-foreground",
    ISSUED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    PARTIALLY_PAID:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    VOID: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500",
  };

  return (
    <div className="space-y-2">
      {invoices.map((inv: any) => (
        <Link
          key={inv.id}
          href={`/invoices/${inv.id}`}
          className="flex items-center gap-4 p-3.5 border border-border rounded-xl hover:bg-muted/30 transition-colors"
        >
          <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">
              {inv.invoiceNumber}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDate(inv.createdAt)}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-semibold text-foreground">
              {formatCurrency(inv.totalAmount, inv.currency)}
            </p>
            <span
              className={cn(
                "text-xs px-2 py-0.5 rounded-full",
                STATUS_STYLE[inv.status] ?? "",
              )}
            >
              {inv.status}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function ClientProfilePage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const { data: client, isLoading } = useClient(id);
  const updateClient = useUpdateClient(id);
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");

  const canEdit = usePermission("clients:update");
  const canMedical = usePermission("clients:view_medical");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-muted-foreground">Client not found</p>
        <button
          onClick={() => router.back()}
          className="text-sm text-primary hover:underline"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Clients
      </button>

      {/* Profile header card */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold shrink-0"
            style={{
              backgroundColor: "var(--brand-gold)",
              color: "var(--brand-navy)",
            }}
          >
            {getInitials(client.fullName)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  {client.fullName}
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Client since {formatDate(client.createdAt)}
                </p>
              </div>
              {canEdit && !editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border hover:bg-muted transition-colors shrink-0"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit
                </button>
              )}
            </div>

            {/* Quick info pills */}
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Phone className="w-3.5 h-3.5" />
                {client.phoneNumber}
              </span>
              {client.email && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Mail className="w-3.5 h-3.5" />
                  {client.email}
                </span>
              )}
              {client.dateOfBirth && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(client.dateOfBirth)}
                </span>
              )}
              {client.gender && (
                <span className="text-xs text-muted-foreground">
                  {client.gender.label}
                </span>
              )}
              {client.skinType && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {client.skinType.label}
                </span>
              )}
              {client.noShowCount > 0 && (
                <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {client.noShowCount} no-show
                  {client.noShowCount > 1 ? "s" : ""}
                </span>
              )}
              {!client.isActive && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                  Inactive
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Edit form inline */}
        {editing && (
          <div className="mt-5 pt-5 border-t border-border">
            <ClientForm
              client={client}
              isLoading={updateClient.isPending}
              onCancel={() => setEditing(false)}
              onSubmit={async (data) => {
                await updateClient.mutateAsync(data as any);
                setEditing(false);
              }}
            />
          </div>
        )}
      </div>

      {/* Photo consent */}
      <PhotoConsentToggle
        clientId={id}
        photoConsentGiven={client.photoConsentGiven}
        photoConsentAt={client.photoConsentAt}
      />

      {/* Medical alerts */}
      {canMedical && (client.allergies || client.medicalNotes) && (
        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/40 rounded-2xl p-4 space-y-3">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4" />
            Medical Information
          </p>
          {client.allergies && (
            <div>
              <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-0.5">
                Allergies
              </p>
              <p className="text-sm text-foreground">{client.allergies}</p>
            </div>
          )}
          {client.medicalNotes && (
            <div>
              <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-0.5">
                Medical notes
              </p>
              <p className="text-sm text-foreground">{client.medicalNotes}</p>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {/* Tab headers */}
        <div className="flex border-b border-border overflow-x-auto">
          {TABS.map(({ id: tabId, label, icon: Icon }) => (
            <button
              key={tabId}
              onClick={() => setTab(tabId)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px",
                tab === tabId
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab body */}
        <div className="p-5">
          {tab === "overview" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/30 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground mb-1">
                    Photo consent
                  </p>
                  <div className="flex items-center gap-1.5">
                    {client.photoConsentGiven ? (
                      <ShieldCheck className="w-4 h-4 text-green-600" />
                    ) : (
                      <ShieldOff className="w-4 h-4 text-amber-500" />
                    )}
                    <span className="text-sm font-medium text-foreground">
                      {client.photoConsentGiven ? "Given" : "Not given"}
                    </span>
                  </div>
                </div>
                <div className="bg-muted/30 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground mb-1">
                    No-show count
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {client.noShowCount}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/60">
                <p className="text-sm text-muted-foreground">
                  Book new appointment
                </p>
                <Link
                  href={`/appointments?clientId=${id}`}
                  className="text-xs font-medium hover:underline"
                  style={{ color: "var(--brand-gold)" }}
                >
                  Schedule →
                </Link>
              </div>
            </div>
          )}
          {tab === "history" && <TreatmentHistory clientId={id} />}
          {tab === "photos" && <PhotoGallery clientId={id} />}
          {tab === "intake" && <IntakeForms clientId={id} />}
          {tab === "invoices" && <Invoices clientId={id} />}
        </div>
      </div>
    </div>
  );
}
