"use client";

import { useState } from "react";
import type { BeforeAfterPhoto } from "@/lib/api/clients";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { ImageOff, X, ZoomIn } from "lucide-react";
import { useClientPhotos } from "../hooks/useClients";

const TYPE_LABELS: Record<string, string> = {
  BEFORE: "Before",
  AFTER: "After",
  PROGRESS: "Progress",
};

const TYPE_STYLES: Record<string, string> = {
  BEFORE: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  AFTER: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  PROGRESS:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

interface LightboxProps {
  photo: BeforeAfterPhoto;
  onClose: () => void;
}

function Lightbox({ photo, onClose }: LightboxProps) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors">
        <X className="w-5 h-5" />
      </button>
      <div className="max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
        <img
          src={photo.photoUrl}
          alt={photo.caption ?? photo.type}
          className="w-full max-h-[80vh] object-contain rounded-xl"
        />
        <div className="mt-3 flex items-center gap-3">
          <span
            className={cn(
              "text-xs px-2 py-0.5 rounded-full font-medium",
              TYPE_STYLES[photo.type],
            )}
          >
            {TYPE_LABELS[photo.type]}
          </span>
          {photo.caption && (
            <p className="text-sm text-gray-300">{photo.caption}</p>
          )}
          <span className="ml-auto text-xs text-gray-400">
            {formatDate(photo.uploadedAt)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function PhotoGallery({ clientId }: { clientId: string }) {
  const { data, isLoading } = useClientPhotos(clientId);
  const [lightbox, setLightbox] = useState<BeforeAfterPhoto | null>(null);
  const [filter, setFilter] = useState<string>("ALL");

  const photos = data?.data ?? [];
  const visible =
    filter === "ALL" ? photos : photos.filter((p) => p.type === filter);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square rounded-xl bg-muted animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex items-center gap-1.5">
        {["ALL", "BEFORE", "AFTER", "PROGRESS"].map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={cn(
              "px-3 py-1 rounded-lg text-xs font-medium transition-colors",
              filter === t
                ? "text-brand-navy"
                : "text-muted-foreground hover:bg-muted",
            )}
            style={
              filter === t
                ? { backgroundColor: "var(--brand-gold)" }
                : undefined
            }
          >
            {t === "ALL" ? "All" : TYPE_LABELS[t]}
            {t === "ALL" && photos.length > 0 && (
              <span className="ml-1.5 text-[10px] opacity-70">
                ({photos.length})
              </span>
            )}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-32 gap-2 border border-dashed border-border rounded-xl">
          <ImageOff className="w-8 h-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No photos yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {visible.map((photo) => (
            <div
              key={photo.id}
              onClick={() => setLightbox(photo)}
              className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer border border-border hover:border-primary/40 transition-all"
            >
              <img
                src={photo.thumbnailUrl ?? photo.photoUrl}
                alt={photo.caption ?? photo.type}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              {/* Type badge */}
              <span
                className={cn(
                  "absolute top-1.5 left-1.5 text-[10px] px-1.5 py-0.5 rounded-md font-medium",
                  TYPE_STYLES[photo.type],
                )}
              >
                {TYPE_LABELS[photo.type]}
              </span>
              {!photo.consentGiven && (
                <span className="absolute top-1.5 right-1.5 text-[10px] px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
                  No consent
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {lightbox && (
        <Lightbox photo={lightbox} onClose={() => setLightbox(null)} />
      )}
    </div>
  );
}
