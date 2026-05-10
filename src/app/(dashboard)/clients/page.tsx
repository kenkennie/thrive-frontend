"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useClientsList,
  useCreateClient,
} from "@/features/clients/hooks/useClients";
import type { Client } from "@/lib/api/clients";
import { ClientForm } from "@/features/clients/components/ClientForm";
import { getInitials, formatDate, cn } from "@/lib/utils";
import { usePermission } from "@/hooks/usePermission";
import { extractArray } from "@/lib/api/response";
import {
  Search,
  Plus,
  Phone,
  Mail,
  AlertCircle,
  X,
  UserCheck,
  UserX,
} from "lucide-react";

export default function ClientsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const canCreate = usePermission("clients:create");

  // Simple debounce
  const handleSearch = (v: string) => {
    setSearch(v);
    clearTimeout((window as any).__clientSearchTimeout);
    (window as any).__clientSearchTimeout = setTimeout(
      () => setDebouncedSearch(v),
      350,
    );
  };

  const { data, isLoading } = useClientsList({
    search: debouncedSearch || undefined,
    limit: 50,
  });
  const createClient = useCreateClient();

  const clients: Client[] = extractArray(data);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search name, phone, email…"
            className="w-full h-9 pl-8 pr-3 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
          {search && (
            <button
              onClick={() => {
                setSearch("");
                setDebouncedSearch("");
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <span className="text-sm text-muted-foreground ml-1">
          {data?.meta.total ?? 0} clients
        </span>

        {canCreate && (
          <button
            onClick={() => setShowNew(true)}
            className="ml-auto flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              backgroundColor: "var(--brand-gold)",
              color: "var(--brand-navy)",
            }}
          >
            <Plus className="w-4 h-4" />
            New Client
          </button>
        )}
      </div>

      {/* New client form */}
      {showNew && (
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-foreground">
              New Client
            </h2>
            <button
              onClick={() => setShowNew(false)}
              className="p-1 rounded-md hover:bg-muted transition-colors text-muted-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <ClientForm
            isLoading={createClient.isPending}
            onCancel={() => setShowNew(false)}
            onSubmit={async (data) => {
              await createClient.mutateAsync(data as any);
              setShowNew(false);
            }}
          />
        </div>
      )}

      {/* Client list */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-4 animate-pulse"
              >
                <div className="w-10 h-10 rounded-full bg-muted shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 bg-muted rounded" />
                  <div className="h-3 w-28 bg-muted/60 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2">
            <Search className="w-10 h-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              {debouncedSearch
                ? "No clients match your search"
                : "No clients yet"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {clients.map((client) => (
              <button
                key={client.id}
                onClick={() => router.push(`/clients/${client.id}`)}
                className="w-full flex items-center gap-4 px-4 py-3.5 text-left hover:bg-muted/30 transition-colors group"
              >
                {/* Avatar */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
                  style={{
                    backgroundColor: "var(--brand-gold)",
                    color: "var(--brand-navy)",
                  }}
                >
                  {getInitials(client.fullName)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground">
                      {client.fullName}
                    </span>
                    {!client.isActive && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        Inactive
                      </span>
                    )}
                    {client.noShowCount > 1 && (
                      <span className="flex items-center gap-0.5 text-xs text-amber-600 dark:text-amber-400">
                        <AlertCircle className="w-3 h-3" />
                        {client.noShowCount} no-shows
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Phone className="w-3 h-3" />
                      {client.phoneNumber}
                    </span>
                    {client.email && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                        <Mail className="w-3 h-3" />
                        {client.email}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right side */}
                <div className="shrink-0 flex items-center gap-3 text-right">
                  <div className="hidden sm:block">
                    <p className="text-xs text-muted-foreground">Since</p>
                    <p className="text-xs font-medium text-foreground">
                      {formatDate(client.createdAt)}
                    </p>
                  </div>
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full",
                      client.photoConsentGiven
                        ? "bg-green-500"
                        : "bg-amber-400",
                    )}
                    title={
                      client.photoConsentGiven
                        ? "Photo consent given"
                        : "No photo consent"
                    }
                  />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {data && data.meta.totalPages > 1 && (
        <p className="text-xs text-muted-foreground text-center">
          Showing {clients.length} of {data.meta.total}
        </p>
      )}
    </div>
  );
}
