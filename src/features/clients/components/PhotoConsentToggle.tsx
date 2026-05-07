"use client";

import { useRecordPhotoConsent } from "../hooks/useClients";
import { Camera, Loader2, ShieldCheck, ShieldOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";

interface Props {
  clientId: string;
  photoConsentGiven: boolean;
  photoConsentAt?: string;
}

export function PhotoConsentToggle({
  clientId,
  photoConsentGiven,
  photoConsentAt,
}: Props) {
  const consent = useRecordPhotoConsent(clientId);

  return (
    <div
      className={cn(
        "flex items-center gap-4 p-4 rounded-xl border transition-colors",
        photoConsentGiven
          ? "border-green-200 bg-green-50 dark:border-green-800/40 dark:bg-green-900/10"
          : "border-amber-200 bg-amber-50 dark:border-amber-800/40 dark:bg-amber-900/10",
      )}
    >
      <div
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
          photoConsentGiven
            ? "bg-green-100 dark:bg-green-900/30"
            : "bg-amber-100 dark:bg-amber-900/30",
        )}
      >
        {photoConsentGiven ? (
          <ShieldCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
        ) : (
          <ShieldOff className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">Photo consent</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {photoConsentGiven
            ? `Given${photoConsentAt ? ` · ${formatDate(photoConsentAt)}` : ""}`
            : "Not yet given — required before uploading before/after photos"}
        </p>
      </div>

      <button
        onClick={() => consent.mutate(!photoConsentGiven)}
        disabled={consent.isPending}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50 shrink-0",
          photoConsentGiven
            ? "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
            : "bg-green-600 text-white hover:bg-green-700",
        )}
      >
        {consent.isPending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Camera className="w-3.5 h-3.5" />
        )}
        {photoConsentGiven ? "Revoke" : "Record Consent"}
      </button>
    </div>
  );
}
