"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api/client";
import { toast } from "sonner";

interface Props {
  url: string;
  label?: string;
  variant?: "default" | "ghost" | "outline";
  className?: string;
}

export function PdfButton({
  url,
  label = "Download PDF",
  variant = "outline",
  className,
}: Props) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const response = await api.get(url, { responseType: "blob" });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const objectUrl = URL.createObjectURL(blob);

      // Open in new tab
      const win = window.open(objectUrl, "_blank");
      if (!win) {
        // Fallback: trigger download if popup was blocked
        const a = document.createElement("a");
        a.href = objectUrl;
        a.download = label.toLowerCase().replace(/\s+/g, "-") + ".pdf";
        a.click();
      }

      setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000);
    } catch {
      toast.error("Failed to load PDF. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        variant === "outline" &&
          "border border-border text-muted-foreground hover:bg-muted hover:text-foreground",
        variant === "ghost" &&
          "text-muted-foreground hover:bg-muted hover:text-foreground",
        variant === "default" && "text-brand-navy",
        className,
      )}
      style={
        variant === "default"
          ? { backgroundColor: "var(--brand-gold)" }
          : undefined
      }
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Download className="w-3.5 h-3.5" />
      )}
      {label}
    </button>
  );
}
