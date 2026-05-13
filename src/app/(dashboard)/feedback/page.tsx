// src/app/(dashboard)/feedback/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useFeedbackList,
  useFeedbackStats,
  useRespondToFeedback,
} from "@/features/feedback/hooks/useFeedback";
import { Pagination } from "@/components/ui/Pagination";
import { formatDate, cn } from "@/lib/utils";
import {
  Star,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  X,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Search,
  TrendingUp,
  Users,
  Award,
  Building2,
  Loader2,
} from "lucide-react";

const LIMIT = 20;

// ── Star display ──────────────────────────────────────────────────────────────

function Stars({
  rating,
  max = 5,
  size = "sm",
}: {
  rating: number;
  max?: number;
  size?: "sm" | "lg";
}) {
  return (
    <div
      className={cn("flex items-center gap-0.5", size === "lg" ? "gap-1" : "")}
    >
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            size === "lg" ? "w-5 h-5" : "w-3.5 h-3.5",
            i < rating
              ? "text-amber-400 fill-amber-400"
              : "text-muted-foreground/30",
          )}
        />
      ))}
    </div>
  );
}

// ── Rating distribution bar ───────────────────────────────────────────────────

function RatingBar({
  rating,
  count,
  total,
}: {
  rating: number;
  count: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-muted-foreground w-4 text-right">{rating}</span>
      <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-amber-400 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-muted-foreground w-6 text-right">{count}</span>
    </div>
  );
}

// ── Stat chip ─────────────────────────────────────────────────────────────────

function StatChip({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: any;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="bg-muted/30 rounded-xl p-4 space-y-1">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        <Icon className="w-4 h-4" />
        <span className="text-xs font-medium uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

// ── Respond form ──────────────────────────────────────────────────────────────

function RespondForm({
  feedbackId,
  existingResponse,
  onDone,
}: {
  feedbackId: string;
  existingResponse?: string;
  onDone: () => void;
}) {
  const respond = useRespondToFeedback();
  const [text, setText] = useState(existingResponse ?? "");
  const [pub, setPub] = useState(true);

  return (
    <div className="space-y-3 mt-3 pt-3 border-t border-border/60">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        {existingResponse ? "Update response" : "Write a response"}
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder="Thank you for your feedback…"
        className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring/30"
        autoFocus
      />
      <label className="flex items-center gap-2 cursor-pointer select-none text-sm">
        <div
          className={cn(
            "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0",
            pub ? "border-transparent" : "border-input",
          )}
          style={pub ? { backgroundColor: "var(--brand-gold)" } : undefined}
          onClick={() => setPub(!pub)}
        >
          {pub && (
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
        <span className="text-foreground font-medium">
          Make response public
        </span>
        <span className="text-muted-foreground">
          (visible on client portal)
        </span>
      </label>
      <div className="flex gap-2">
        <button
          onClick={() =>
            respond.mutate({ id: feedbackId, response: text, isPublic: pub })
          }
          disabled={respond.isPending || !text.trim()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium disabled:opacity-50"
          style={{
            backgroundColor: "var(--brand-gold)",
            color: "var(--brand-navy)",
          }}
        >
          {respond.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
          {existingResponse ? "Update" : "Post response"}
        </button>
        <button
          onClick={onDone}
          className="px-4 py-2 rounded-lg text-xs border border-border hover:bg-muted transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function FeedbackPage() {
  const router = useRouter();
  const [minRating, setMinRating] = useState<number | undefined>();
  const [hasResponse, setHasResponse] = useState<boolean | undefined>();
  const [recommend, setRecommend] = useState<boolean | undefined>();
  const [page, setPage] = useState(1);
  const [expandId, setExpandId] = useState<string | null>(null);
  const [respondId, setRespondId] = useState<string | null>(null);

  const { data, isLoading } = useFeedbackList({
    minRating: minRating,
    wouldRecommend: recommend,
    hasResponse: hasResponse,
    page,
    limit: LIMIT,
  });

  const { data: stats } = useFeedbackStats();

  const entries = data?.data ?? [];
  const meta = data?.meta;

  const totalEntries = stats?.totalSubmissions ?? 0;
  const distTotal =
    stats?.ratingDistribution?.reduce((s: number, r: any) => s + r.count, 0) ??
    0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Client Feedback</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {totalEntries} total reviews
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatChip
            icon={Star}
            label="Overall"
            value={
              stats.averages?.overall ? `${stats.averages.overall}/5` : "—"
            }
            sub="Average rating"
          />
          <StatChip
            icon={Users}
            label="Staff"
            value={stats.averages?.staff ? `${stats.averages.staff}/5` : "—"}
            sub="Avg staff rating"
          />
          <StatChip
            icon={Award}
            label="Service"
            value={
              stats.averages?.service ? `${stats.averages.service}/5` : "—"
            }
            sub="Avg service rating"
          />
          <StatChip
            icon={ThumbsUp}
            label="Recommend"
            value={
              stats.recommendationRate != null
                ? `${stats.recommendationRate}%`
                : "—"
            }
            sub="Would recommend"
          />
        </div>
      )}

      {/* Rating distribution */}
      {stats?.ratingDistribution?.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Rating breakdown
          </p>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((r) => {
              const found = stats.ratingDistribution.find(
                (d: any) => d.rating === r,
              );
              return (
                <RatingBar
                  key={r}
                  rating={r}
                  count={found?.count ?? 0}
                  total={distTotal}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs font-medium text-muted-foreground">
          Filter:
        </span>

        {/* Min rating */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          {[undefined, 4, 3, 2, 1].map((r) => (
            <button
              key={String(r)}
              onClick={() => {
                setMinRating(r);
                setPage(1);
              }}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all",
                minRating === r
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {r === undefined ? (
                "All ratings"
              ) : (
                <>
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  {r}+
                </>
              )}
            </button>
          ))}
        </div>

        {/* Response filter */}
        <div className="flex items-center bg-muted rounded-lg p-1">
          {[
            { v: undefined, l: "All" },
            { v: false, l: "No reply" },
            { v: true, l: "Replied" },
          ].map(({ v, l }) => (
            <button
              key={String(v)}
              onClick={() => {
                setHasResponse(v);
                setPage(1);
              }}
              className={cn(
                "px-2.5 py-1 rounded-md text-xs font-medium transition-all",
                hasResponse === v
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {l}
            </button>
          ))}
        </div>

        {/* Recommend filter */}
        <div className="flex items-center bg-muted rounded-lg p-1">
          {[
            { v: undefined, l: "All" },
            { v: true, l: "Recommend" },
            { v: false, l: "Not recommend" },
          ].map(({ v, l }) => (
            <button
              key={String(v)}
              onClick={() => {
                setRecommend(v);
                setPage(1);
              }}
              className={cn(
                "px-2.5 py-1 rounded-md text-xs font-medium transition-all",
                recommend === v
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Feedback list */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="bg-card rounded-2xl border border-border p-5 animate-pulse space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-muted shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 w-36 bg-muted rounded" />
                  <div className="h-3 w-24 bg-muted/60 rounded" />
                </div>
              </div>
              <div className="h-4 w-full bg-muted/40 rounded" />
            </div>
          ))
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3 bg-card rounded-2xl border border-border">
            <MessageSquare className="w-10 h-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No feedback found</p>
          </div>
        ) : (
          entries.map((fb: any) => {
            const isExpanded = expandId === fb.id;
            const isResponding = respondId === fb.id;
            const service = fb.appointment?.appointmentServices?.[0];

            return (
              <div
                key={fb.id}
                className="bg-card rounded-2xl border border-border overflow-hidden"
              >
                <div className="p-5">
                  {/* Header row */}
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                      style={{
                        backgroundColor: "var(--brand-gold)",
                        color: "var(--brand-navy)",
                      }}
                    >
                      {fb.client?.fullName
                        .split(" ")
                        .map((n: string) => n[0])
                        .slice(0, 2)
                        .join("")}
                    </div>

                    {/* Client + appointment */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <button
                            onClick={() =>
                              router.push(`/clients/${fb.client.id}`)
                            }
                            className="text-sm font-semibold text-foreground hover:underline"
                          >
                            {fb.client?.fullName}
                          </button>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <Stars rating={fb.overallRating} />
                            <span className="text-xs text-muted-foreground">
                              {fb.overallRating}/5
                            </span>
                            {fb.wouldRecommend === true && (
                              <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                                <ThumbsUp className="w-3 h-3" />
                                Recommends
                              </span>
                            )}
                            {fb.wouldRecommend === false && (
                              <span className="flex items-center gap-1 text-xs text-red-500">
                                <ThumbsDown className="w-3 h-3" />
                                Doesn't recommend
                              </span>
                            )}
                          </div>
                          {fb.appointment && (
                            <button
                              onClick={() =>
                                router.push(
                                  `/appointments/${fb.appointment.id}`,
                                )
                              }
                              className="text-xs text-muted-foreground hover:text-foreground mt-0.5 flex items-center gap-1 transition-colors"
                            >
                              {service?.service?.name} ·{" "}
                              {formatDate(fb.appointment.date)} · Dr.{" "}
                              {fb.appointment.doctor?.fullName}
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-muted-foreground">
                            {formatDate(fb.submittedAt)}
                          </span>
                          {fb.adminResponse && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-medium">
                              Replied
                            </span>
                          )}
                          <button
                            onClick={() =>
                              setExpandId(isExpanded ? null : fb.id)
                            }
                            className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Comment */}
                      {fb.comment && (
                        <p className="text-sm text-foreground mt-2 leading-relaxed">
                          {fb.comment}
                        </p>
                      )}

                      {/* Expanded: sub-ratings + admin response + respond button */}
                      {isExpanded && (
                        <div className="mt-3 space-y-3">
                          {/* Sub-ratings */}
                          {(fb.serviceRating ||
                            fb.staffRating ||
                            fb.facilityRating) && (
                            <div className="grid grid-cols-3 gap-3">
                              {fb.serviceRating != null && (
                                <div className="bg-muted/30 rounded-xl p-3 text-center">
                                  <p className="text-xs text-muted-foreground mb-1">
                                    Service
                                  </p>
                                  <Stars
                                    rating={fb.serviceRating}
                                    size="sm"
                                  />
                                  <p className="text-sm font-bold mt-1">
                                    {fb.serviceRating}/5
                                  </p>
                                </div>
                              )}
                              {fb.staffRating != null && (
                                <div className="bg-muted/30 rounded-xl p-3 text-center">
                                  <p className="text-xs text-muted-foreground mb-1">
                                    Staff
                                  </p>
                                  <Stars
                                    rating={fb.staffRating}
                                    size="sm"
                                  />
                                  <p className="text-sm font-bold mt-1">
                                    {fb.staffRating}/5
                                  </p>
                                </div>
                              )}
                              {fb.facilityRating != null && (
                                <div className="bg-muted/30 rounded-xl p-3 text-center">
                                  <p className="text-xs text-muted-foreground mb-1">
                                    Facility
                                  </p>
                                  <Stars
                                    rating={fb.facilityRating}
                                    size="sm"
                                  />
                                  <p className="text-sm font-bold mt-1">
                                    {fb.facilityRating}/5
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Admin response */}
                          {fb.adminResponse && !isResponding && (
                            <div className="p-3.5 bg-muted/30 border border-border rounded-xl">
                              <p className="text-xs font-semibold text-muted-foreground mb-1">
                                Our response
                              </p>
                              <p className="text-sm text-foreground">
                                {fb.adminResponse}
                              </p>
                              {fb.isPublic && (
                                <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Public response
                                </p>
                              )}
                            </div>
                          )}

                          {/* Respond button / form */}
                          {!isResponding && (
                            <button
                              onClick={() => setRespondId(fb.id)}
                              className="flex items-center gap-1.5 text-xs font-medium hover:underline transition-colors"
                              style={{ color: "var(--brand-gold)" }}
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              {fb.adminResponse
                                ? "Update response"
                                : "Write response"}
                            </button>
                          )}

                          {isResponding && (
                            <RespondForm
                              feedbackId={fb.id}
                              existingResponse={fb.adminResponse}
                              onDone={() => setRespondId(null)}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {meta && meta.totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={meta.totalPages}
          total={meta.total}
          limit={LIMIT}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
