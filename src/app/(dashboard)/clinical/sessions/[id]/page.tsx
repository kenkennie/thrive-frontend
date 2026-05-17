"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useSession,
  useUpdateSessionNote,
  useDeletePhoto,
  useUploadPhoto,
} from "@/features/clinical/hooks/useClinical";
import { SessionNoteForm } from "@/features/clinical/components/SessionNoteForm";
import { usePermission } from "@/hooks/usePermission";
import { formatDate, formatTime, cn } from "@/lib/utils";
import {
  ArrowLeft,
  Edit2,
  X,
  Loader2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Camera,
  Trash2,
  Eye,
  EyeOff,
  Image,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

interface Props {
  params: Promise<{ id: string }>;
}

const PHOTO_TYPE_STYLES: Record<string, string> = {
  BEFORE:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  AFTER: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  OTHER: "bg-muted text-muted-foreground",
};

function SoapField({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="text-sm text-foreground whitespace-pre-wrap bg-muted/30 rounded-lg px-3 py-2.5">
        {value}
      </p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex justify-between py-2 border-b border-border/60 last:border-0 gap-4">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-medium text-foreground text-right">
        {value}
      </span>
    </div>
  );
}

export default function SessionDetailPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();

  const { data: session, isLoading } = useSession(id);
  const updateNote = useUpdateSessionNote();
  const deletePhoto = useDeletePhoto(session?.client?.id ?? "");

  const canEdit = usePermission("sessions:update");
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<"soap" | "treatment" | "photos">(
    "soap",
  );
  const [lightbox, setLightbox] = useState<string | null>(null);

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  if (!session)
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Session not found</p>
      </div>
    );

  const photos = session.photos ?? [];
  const before = photos.filter((p: any) => p.type === "BEFORE");
  const after = photos.filter((p: any) => p.type === "AFTER");
  const other = photos.filter((p: any) => p.type === "OTHER");

  const service = session.appointment?.appointmentServices?.[0];

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Back nav */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Sessions
      </button>

      {/* ── Header card ── */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div
          className="h-1.5 w-full"
          style={{ backgroundColor: "var(--brand-gold)" }}
        />
        <div className="p-6 space-y-4">
          {/* Status + meta */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                {session.status === "COMPLETED" ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                ) : session.status === "MISSED" ? (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                ) : (
                  <Clock className="w-5 h-5 text-muted-foreground" />
                )}
                <h1 className="text-xl font-bold text-foreground">
                  Session{" "}
                  {session.sessionNumber ? `#${session.sessionNumber}` : ""}
                </h1>
                <span
                  className={cn(
                    "text-xs px-2.5 py-1 rounded-full font-medium",
                    session.status === "COMPLETED"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : session.status === "MISSED"
                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        : "bg-muted text-muted-foreground",
                  )}
                >
                  {session.status}
                </span>
              </div>
              <div className="mt-1.5 space-y-0.5">
                {session.appointment && (
                  <p className="text-sm font-medium text-foreground">
                    {service?.service.name}
                    {service?.variant && (
                      <span className="text-muted-foreground font-normal">
                        {" "}
                        — {service.variant.name}
                      </span>
                    )}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {session.appointment
                    ? `${formatDate(session.appointment.date)} · ${formatTime(session.appointment.startTime)} — ${formatTime(session.appointment.endTime)}`
                    : formatDate(session.createdAt)}
                  {` · Dr. ${session.doctor.fullName}`}
                </p>
              </div>
            </div>

            {canEdit && !editing && (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-border hover:bg-muted transition-colors shrink-0"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit
              </button>
            )}
          </div>

          {/* Client + Appointment links */}
          <div className="flex flex-wrap gap-3 pt-2 border-t border-border/60">
            {session.client && (
              <Link
                href={`/clients/${session.client.id}`}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border hover:bg-muted/30 transition-colors group text-sm"
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    backgroundColor: "var(--brand-gold)",
                    color: "var(--brand-navy)",
                  }}
                >
                  {session.client.fullName
                    .split(" ")
                    .map((n: string) => n[0])
                    .slice(0, 2)
                    .join("")}
                </div>
                <span className="font-medium text-foreground">
                  {session.client.fullName}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground" />
              </Link>
            )}
            {session.appointment && (
              <Link
                href={`/appointments/${session.appointment.id}`}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border hover:bg-muted/30 transition-colors group text-sm"
              >
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground">View appointment</span>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground" />
              </Link>
            )}
            {session.treatmentPlan && (
              <Link
                href={`/clinical/treatment-plans/${session.treatmentPlan.id}`}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border hover:bg-muted/30 transition-colors group text-sm"
              >
                <span className="text-foreground">
                  {session.treatmentPlan.title}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({session.treatmentPlan.completedSessions}/
                  {session.treatmentPlan.totalSessions})
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground" />
              </Link>
            )}
          </div>

          {/* Visibility badge */}
          <div className="flex items-center gap-2">
            {session.visibleToClient ? (
              <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <Eye className="w-3.5 h-3.5" /> Visible to client
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <EyeOff className="w-3.5 h-3.5" /> Hidden from client
              </span>
            )}
            {session.followUpRequired && (
              <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 ml-3">
                <AlertCircle className="w-3.5 h-3.5" />
                Follow-up required
                {session.followUpDate
                  ? ` · ${formatDate(session.followUpDate)}`
                  : ""}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Edit form ── */}
      {editing && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-muted/30">
            <h3 className="text-sm font-semibold text-foreground">
              Edit Session Note
            </h3>
            <button
              onClick={() => setEditing(false)}
              className="p-1 rounded-md hover:bg-muted text-muted-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-5">
            <SessionNoteForm
              session={session}
              isLoading={updateNote.isPending}
              onCancel={() => setEditing(false)}
              onSubmit={async (data) => {
                await updateNote.mutateAsync({ sessionId: id, dto: data });
                setEditing(false);
              }}
            />
          </div>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="flex border-b border-border overflow-x-auto">
          {(
            [
              { id: "soap", label: "SOAP Notes" },
              { id: "treatment", label: "Treatment" },
              { id: "photos", label: `Photos (${photos.length})` },
            ] as const
          ).map(({ id: tabId, label }) => (
            <button
              key={tabId}
              onClick={() => setActiveTab(tabId)}
              className={cn(
                "flex-1 min-w-fit px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px",
                activeTab === tabId
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="p-5 space-y-4">
          {/* SOAP tab */}
          {activeTab === "soap" && (
            <div className="space-y-4">
              {!session.subjective &&
              !session.objective &&
              !session.assessment &&
              !session.plan ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No SOAP notes recorded.
                </p>
              ) : (
                <>
                  <SoapField
                    label="S — Subjective"
                    value={session.subjective}
                  />
                  <SoapField label="O — Objective" value={session.objective} />
                  <SoapField
                    label="A — Assessment"
                    value={session.assessment}
                  />
                  <SoapField label="P — Plan" value={session.plan} />
                </>
              )}
              {session.clientFeedbackDuringSession && (
                <SoapField
                  label="Client feedback"
                  value={session.clientFeedbackDuringSession}
                />
              )}
              {session.followUpNotes && (
                <div className="p-3.5 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/40 rounded-xl">
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">
                    Follow-up notes
                  </p>
                  <p className="text-sm text-amber-900 dark:text-amber-300">
                    {session.followUpNotes}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Treatment tab */}
          {activeTab === "treatment" && (
            <div className="space-y-4">
              {session.treatmentPerformed && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Treatment performed
                  </p>
                  <p className="text-sm text-foreground whitespace-pre-wrap bg-muted/30 rounded-lg px-3 py-2.5">
                    {session.treatmentPerformed}
                  </p>
                </div>
              )}

              <div className="space-y-0">
                <DetailRow label="Products used" value={session.productsUsed} />
                <DetailRow
                  label="Equipment used"
                  value={session.equipmentUsed}
                />
                <DetailRow
                  label="Device settings"
                  value={session.settingsUsed}
                />
                <DetailRow label="Skin reaction" value={session.skinReaction} />
              </div>

              {session.aftercareInstructions && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Aftercare instructions
                  </p>
                  <div className="p-3.5 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/40 rounded-xl">
                    <p className="text-sm text-blue-900 dark:text-blue-200 whitespace-pre-wrap">
                      {session.aftercareInstructions}
                    </p>
                  </div>
                </div>
              )}

              {!session.treatmentPerformed &&
                !session.productsUsed &&
                !session.aftercareInstructions && (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    No treatment details recorded.
                  </p>
                )}
            </div>
          )}

          {/* Photos tab */}
          {activeTab === "photos" && (
            <div className="space-y-5">
              {photos.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 gap-2">
                  <Image className="w-8 h-8 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">
                    No photos for this session
                  </p>
                </div>
              ) : (
                <>
                  {/* Before + After comparison */}
                  {(before.length > 0 || after.length > 0) && (
                    <div className="grid grid-cols-2 gap-4">
                      {(["BEFORE", "AFTER"] as const).map((type) => {
                        const typePhotos = type === "BEFORE" ? before : after;
                        return (
                          <div key={type}>
                            <p
                              className={cn(
                                "text-xs font-semibold uppercase tracking-wider mb-2 px-2 py-1 rounded-lg w-fit",
                                PHOTO_TYPE_STYLES[type],
                              )}
                            >
                              {type}
                            </p>
                            <div className="space-y-2">
                              {typePhotos.length === 0 ? (
                                <div className="h-32 rounded-xl border-2 border-dashed border-border flex items-center justify-center text-xs text-muted-foreground">
                                  No {type.toLowerCase()} photos
                                </div>
                              ) : (
                                typePhotos.map((p: any) => (
                                  <div
                                    key={p.id}
                                    className="relative group rounded-xl overflow-hidden border border-border"
                                  >
                                    <button
                                      onClick={() => setLightbox(p.photoUrl)}
                                      className="w-full"
                                    >
                                      <img
                                        src={p.thumbnailUrl ?? p.photoUrl}
                                        alt={p.caption ?? type}
                                        className="w-full h-40 object-cover hover:opacity-90 transition-opacity"
                                      />
                                    </button>
                                    {p.caption && (
                                      <p className="px-2 py-1.5 text-xs text-muted-foreground bg-muted/50 truncate">
                                        {p.caption}
                                      </p>
                                    )}
                                    {canEdit && (
                                      <button
                                        onClick={() => {
                                          if (confirm("Delete this photo?"))
                                            deletePhoto.mutate(p.id);
                                        }}
                                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-card/90 text-destructive hover:bg-destructive hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Other photos */}
                  {other.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                        Other photos
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {other.map((p: any) => (
                          <div
                            key={p.id}
                            className="relative group rounded-xl overflow-hidden border border-border"
                          >
                            <button
                              onClick={() => setLightbox(p.photoUrl)}
                              className="w-full"
                            >
                              <img
                                src={p.thumbnailUrl ?? p.photoUrl}
                                alt={p.caption ?? "Photo"}
                                className="w-full h-28 object-cover hover:opacity-90 transition-opacity"
                              />
                            </button>
                            {canEdit && (
                              <button
                                onClick={() => {
                                  if (confirm("Delete this photo?"))
                                    deletePhoto.mutate(p.id);
                                }}
                                className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-card/90 text-destructive hover:bg-destructive hover:text-white transition-all opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Upload hint */}
              <p className="text-xs text-muted-foreground text-center">
                Photos are uploaded via the client profile or appointment
                detail.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={lightbox}
            alt="Photo"
            className="max-w-full max-h-full rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
