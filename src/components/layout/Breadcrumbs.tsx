"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const SEGMENT_LABELS: Record<string, string> = {
  appointments: "Appointments",
  clients: "Clients",
  clinical: "Clinical",
  sessions: "Sessions",
  "treatment-plans": "Treatment Plans",
  services: "Services",
  invoices: "Invoices",
  quotes: "Quotes",
  payments: "Payments",
  reports: "Reports",
  waitlist: "Waitlist",
  feedback: "Feedback",
  staff: "Staff",
  notifications: "Notifications",
  settings: "Settings",
  new: "New",
  edit: "Edit",
};

function toLabel(segment: string): string {
  // If it looks like a CUID (long alphanum), treat as "Details"
  if (segment.length > 20 && /^[a-z0-9]+$/i.test(segment)) return "Details";
  return (
    SEGMENT_LABELS[segment] ??
    segment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

export function Breadcrumbs() {
  const pathname = usePathname();

  if (pathname === "/") return null;

  const segments = pathname.split("/").filter(Boolean);

  const crumbs = segments.map((seg, i) => ({
    label: toLabel(seg),
    href: "/" + segments.slice(0, i + 1).join("/"),
    isLast: i === segments.length - 1,
  }));

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1 px-6 py-2.5 border-b border-border/60 bg-muted/30 text-xs"
    >
      <Link
        href="/"
        className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
      >
        <Home className="w-3 h-3" />
      </Link>

      {crumbs.map((crumb) => (
        <span key={crumb.href} className="flex items-center gap-1">
          <ChevronRight className="w-3 h-3 text-muted-foreground/50" />
          {crumb.isLast ? (
            <span className="font-medium text-foreground">{crumb.label}</span>
          ) : (
            <Link
              href={crumb.href}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
