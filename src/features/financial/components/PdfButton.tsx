"use client";

import { Download } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const open = () => window.open(url, "_blank");

  return (
    <button
      onClick={open}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
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
      <Download className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}
