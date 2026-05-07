"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Building2,
  Calendar,
  CreditCard,
  Bell,
  ToggleLeft,
  List,
  User,
  RefreshCw,
} from "lucide-react";

const NAV = [
  { href: "/settings/profile", label: "My Profile", icon: User },
  { href: "/settings/clinic", label: "Clinic", icon: Building2 },
  { href: "/settings/booking", label: "Booking Rules", icon: Calendar },
  { href: "/settings/finance", label: "Finance", icon: CreditCard },
  { href: "/settings/notifications", label: "Notifications", icon: Bell },
  { href: "/settings/features", label: "Feature Toggles", icon: ToggleLeft },
  {
    href: "/settings/exchange-rates",
    label: "Exchange Rates",
    icon: RefreshCw,
  },
  { href: "/settings/lookups", label: "Lookups", icon: List },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex gap-6 h-full">
      {/* Sidebar nav */}
      <aside className="w-52 shrink-0">
        <div className="bg-card rounded-2xl border border-border overflow-hidden sticky top-0">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Settings
            </p>
          </div>
          <nav className="p-2 space-y-0.5">
            {NAV.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "text-brand-navy"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted",
                  )}
                  style={
                    isActive
                      ? { backgroundColor: "var(--brand-gold)" }
                      : undefined
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Page content */}
      <div className="flex-1 min-w-0 overflow-y-auto space-y-5 pb-8">
        {children}
      </div>
    </div>
  );
}
