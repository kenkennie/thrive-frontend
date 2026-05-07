"use client";

import { cn } from "@/lib/utils";
import { Loader2, Save } from "lucide-react";

// ── Section wrapper ───────────────────────────────────────────────────────────

export function SettingsSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-card rounded-2xl border border-border overflow-hidden",
        className,
      )}
    >
      <div className="px-6 py-4 border-b border-border bg-muted/20">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ── Form field ────────────────────────────────────────────────────────────────

export function Field({
  label,
  description,
  error,
  children,
  horizontal,
}: {
  label: string;
  description?: string;
  error?: string;
  children: React.ReactNode;
  horizontal?: boolean;
}) {
  if (horizontal) {
    return (
      <div className="flex items-center justify-between gap-6 py-3 border-b border-border/60 last:border-0">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{label}</p>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {description}
            </p>
          )}
          {error && <p className="text-xs text-destructive mt-0.5">{error}</p>}
        </div>
        <div className="shrink-0">{children}</div>
      </div>
    );
  }
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ── Input ─────────────────────────────────────────────────────────────────────

export const inputCls = (err?: string) =>
  cn(
    "w-full h-10 px-3 rounded-lg border bg-background text-sm text-foreground",
    "placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-shadow",
    err
      ? "border-destructive focus:ring-destructive/20"
      : "border-input focus:ring-ring/30",
  );

// ── Toggle switch ─────────────────────────────────────────────────────────────

export function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent",
        "transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ring/30",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        checked ? "" : "bg-input",
      )}
      style={checked ? { backgroundColor: "var(--brand-gold)" } : undefined}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transform transition-transform duration-200",
          checked ? "translate-x-5" : "translate-x-0",
        )}
      />
    </button>
  );
}

// ── Save button ───────────────────────────────────────────────────────────────

export function SaveButton({
  isLoading,
  label = "Save changes",
}: {
  isLoading?: boolean;
  label?: string;
}) {
  return (
    <button
      type="submit"
      disabled={isLoading}
      className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-60"
      style={{
        backgroundColor: "var(--brand-gold)",
        color: "var(--brand-navy)",
      }}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Save className="w-4 h-4" />
      )}
      {label}
    </button>
  );
}
