"use client";

import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useUiStore } from "@/stores/ui.store";
import { useAuthStore } from "@/stores/auth.store";
import { getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  Menu,
  Sun,
  Moon,
  Monitor,
  Bell,
  Search,
  ChevronDown,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

// ── Route → title map ─────────────────────────────────────────────────────────

const ROUTE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/appointments": "Appointments",
  "/clients": "Clients",
  "/clinical/sessions": "Treatment Sessions",
  "/clinical/treatment-plans": "Treatment Plans",
  "/services": "Services",
  "/invoices": "Invoices",
  "/quotes": "Quotes",
  "/payments": "Payments",
  "/reports": "Reports",
  "/waitlist": "Waitlist",
  "/feedback": "Feedback",
  "/staff": "Staff",
  "/notifications": "Notifications",
  "/settings": "Settings",
};

function usePageTitle(): string {
  const pathname = usePathname();
  // Exact match first
  if (ROUTE_TITLES[pathname]) return ROUTE_TITLES[pathname];
  // Prefix match
  const prefix = Object.keys(ROUTE_TITLES)
    .filter((k) => k !== "/" && pathname.startsWith(k))
    .sort((a, b) => b.length - a.length)[0];
  return prefix ? ROUTE_TITLES[prefix] : "Thrive Aesthetics";
}

// ── Theme toggle ──────────────────────────────────────────────────────────────

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const Icon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;

  return (
    <div
      ref={ref}
      className="relative"
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
      >
        <Icon className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-36 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
          {(["light", "dark", "system"] as const).map((t) => {
            const T = t === "dark" ? Moon : t === "light" ? Sun : Monitor;
            return (
              <button
                key={t}
                onClick={() => {
                  setTheme(t);
                  setOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors",
                  theme === t
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <T className="w-3.5 h-3.5" />
                <span className="capitalize">{t}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── User menu ─────────────────────────────────────────────────────────────────

function UserMenu() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!user) return null;

  return (
    <div
      ref={ref}
      className="relative"
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-muted transition-colors"
      >
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold"
          style={{
            backgroundColor: "var(--brand-gold)",
            color: "var(--brand-navy)",
          }}
        >
          {getInitials(user.fullName)}
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-sm font-medium text-foreground leading-none">
            {user.fullName.split(" ")[0]}
          </p>
          <p className="text-xs text-muted-foreground capitalize leading-none mt-0.5">
            {user.roles?.[0]?.replace("_", " ") ?? "Staff"}
          </p>
        </div>
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-48 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden py-1">
          <div className="px-3 py-2 border-b border-border">
            <p className="text-sm font-medium text-foreground truncate">
              {user.fullName}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
          <div className="py-1">
            <a
              href="/settings/profile"
              className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
              onClick={() => setOpen(false)}
            >
              Profile & Password
            </a>
          </div>
          <div className="border-t border-border py-1">
            <button
              onClick={() => {
                setOpen(false);
                logout();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/5 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export function Topbar() {
  const title = usePageTitle();
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);

  return (
    <header className="h-16 shrink-0 flex items-center gap-4 px-4 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-30">
      {/* Sidebar toggle — shown when collapsed */}
      {!sidebarOpen && (
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <Menu className="w-4 h-4" />
        </button>
      )}

      {/* Page title */}
      <h1 className="text-base font-semibold text-foreground truncate flex-1">
        {title}
      </h1>

      {/* Right actions */}
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
