"use client";

import { useAuthStore } from "@/stores/auth.store";
import { ShieldOff } from "lucide-react";

export default function NoAccessPage() {
  const logout = useAuthStore((s) => s.logout);
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-4">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
        <ShieldOff className="w-8 h-8 text-muted-foreground" />
      </div>
      <div className="text-center">
        <h1 className="text-xl font-bold text-foreground">No access</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-xs">
          Your account does not have permission to access any part of the
          system. Contact your administrator to have a role assigned.
        </p>
      </div>
      <button
        onClick={logout}
        className="px-6 py-2.5 rounded-xl text-sm font-medium border border-border hover:bg-muted transition-colors"
      >
        Sign out
      </button>
    </div>
  );
}
