"use client";

import { useSSEConnection, useSSEToasts } from "@/lib/sse/hooks";
import { useUiStore } from "@/stores/ui.store";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { Breadcrumbs } from "./Breadcrumbs";
import { cn } from "@/lib/utils";

interface ShellProps {
  children: React.ReactNode;
}

export function Shell({ children }: ShellProps) {
  // Boot SSE connection and wire up global toast notifications
  useSSEConnection();
  useSSEToasts();

  const sidebarOpen = useUiStore((s) => s.sidebarOpen);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar />
        <Breadcrumbs />

        <main className={cn("flex-1 overflow-y-auto", "p-6")}>{children}</main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => useUiStore.getState().setSidebar(false)}
        />
      )}
    </div>
  );
}
