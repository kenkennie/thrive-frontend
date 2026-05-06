"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { usePermissionsStore } from "@/stores/permissions.store";
import { useSettingsStore } from "@/stores/settings.store";
import { useUiStore } from "@/stores/ui.store";
import { useAuthStore } from "@/stores/auth.store";
import { useClinicName } from "@/stores/settings.store";
import { NAV_GROUPS, type NavItem } from "./nav-config";
import { Sparkles, ChevronLeft, LogOut } from "lucide-react";
import { getInitials } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────

function useNavFilter() {
  const hasAny = usePermissionsStore((s) => s.hasAny);
  const isEnabled = useSettingsStore((s) => s.isEnabled);
  const isSuperAdmin = useAuthStore((s) => s.user?.isSuperAdmin ?? false);

  return (item: NavItem): boolean => {
    if (isSuperAdmin) return true;
    if (item.featureFlag && !isEnabled(item.featureFlag as any)) return false;
    if (item.permissions && !hasAny(item.permissions)) return false;
    return true;
  };
}

// ─────────────────────────────────────────────────────────────────────────────

function NavLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const pathname = usePathname();
  const isActive =
    pathname === item.href ||
    (item.href !== "/" && pathname.startsWith(item.href));
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={cn(
        "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
        isActive
          ? "bg-brand-gold/15 text-brand-gold"
          : "text-sidebar-fg hover:bg-white/5 hover:text-brand-gold",
      )}
    >
      <Icon
        className={cn(
          "shrink-0 transition-colors",
          collapsed ? "w-5 h-5" : "w-4 h-4",
          isActive
            ? "text-brand-gold"
            : "text-sidebar-muted group-hover:text-brand-gold",
        )}
      />
      {!collapsed && <span className="truncate">{item.label}</span>}
      {!collapsed && item.badge && (
        <span className="ml-auto text-xs bg-brand-gold text-brand-navy px-1.5 py-0.5 rounded-full font-semibold">
          {item.badge}
        </span>
      )}
      {/* Active indicator */}
      {isActive && (
        <span className="ml-auto w-1 h-1 rounded-full bg-brand-gold shrink-0" />
      )}
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export function Sidebar() {
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const clinicName = useClinicName();
  const filterNav = useNavFilter();

  const collapsed = !sidebarOpen;

  const filteredGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter(filterNav),
  })).filter((group) => group.items.length > 0);

  return (
    <aside
      className={cn(
        "flex flex-col h-full transition-all duration-300 ease-in-out",
        "border-r border-sidebar-border",
        collapsed ? "w-[60px]" : "w-[230px]",
      )}
      style={{ backgroundColor: "hsl(var(--sidebar-bg))" }}
    >
      {/* ── Header ── */}
      <div
        className={cn(
          "flex items-center h-16 px-4 border-b border-sidebar-border shrink-0",
          collapsed ? "justify-center" : "justify-between",
        )}
      >
        {!collapsed && (
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
              style={{ backgroundColor: "var(--brand-gold)" }}
            >
              <Sparkles
                className="w-3.5 h-3.5"
                style={{ color: "var(--brand-navy)" }}
              />
            </div>
            <div className="min-w-0">
              <p
                className="text-sm font-semibold truncate"
                style={{ color: "var(--brand-gold)" }}
              >
                {clinicName}
              </p>
            </div>
          </div>
        )}

        {collapsed && (
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center"
            style={{ backgroundColor: "var(--brand-gold)" }}
          >
            <Sparkles
              className="w-3.5 h-3.5"
              style={{ color: "var(--brand-navy)" }}
            />
          </div>
        )}

        {!collapsed && (
          <button
            onClick={toggleSidebar}
            className="p-1 rounded-md hover:bg-white/5 transition-colors shrink-0"
            style={{ color: "hsl(var(--sidebar-muted))" }}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {filteredGroups.map((group) => (
          <div
            key={group.label}
            className="mb-3"
          >
            {!collapsed && (
              <p
                className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: "hsl(var(--sidebar-muted))" }}
              >
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  collapsed={collapsed}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Footer / User ── */}
      <div className={cn("shrink-0 border-t border-sidebar-border p-3")}>
        {collapsed ? (
          <button
            onClick={() => logout()}
            title="Sign out"
            className="w-full flex justify-center p-2 rounded-lg hover:bg-white/5 transition-colors"
            style={{ color: "hsl(var(--sidebar-muted))" }}
          >
            <LogOut className="w-4 h-4" />
          </button>
        ) : (
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
              style={{
                backgroundColor: "var(--brand-gold)",
                color: "var(--brand-navy)",
              }}
            >
              {user ? getInitials(user.fullName) : "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-medium truncate"
                style={{ color: "hsl(var(--sidebar-fg))" }}
              >
                {user?.fullName}
              </p>
              <p
                className="text-xs truncate capitalize"
                style={{ color: "hsl(var(--sidebar-muted))" }}
              >
                {user?.roles?.[0]?.replace("_", " ") ?? "Staff"}
              </p>
            </div>
            <button
              onClick={() => logout()}
              title="Sign out"
              className="p-1.5 rounded-md hover:bg-white/5 transition-colors shrink-0"
              style={{ color: "hsl(var(--sidebar-muted))" }}
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
