"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useServicesList } from "@/features/services/hooks/useServices";
import { CategoryManager } from "@/features/services/components/categoryManager";
import { Pagination } from "@/components/ui/Pagination";
import { usePermission } from "@/hooks/usePermission";
import { formatCurrency, cn } from "@/lib/utils";
import { Plus, Search, X, Clock, ToggleLeft, ToggleRight } from "lucide-react";

const LIMIT = 20;

export default function ServicesPage() {
  const router = useRouter();
  const canCreate = usePermission("services:create");

  const [category, setCategory] = useState<string | undefined>();
  const [search, setSearch] = useState("");
  const [active, setActive] = useState<boolean | undefined>(true);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useServicesList({
    categoryId: category,
    search: search || undefined,
    isActive: active,
    page,
    limit: LIMIT,
  });

  const services = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="flex gap-5 h-full">
      {/* Sidebar — categories */}
      <div className="w-52 shrink-0">
        <CategoryManager
          selected={category}
          onSelect={(id) => {
            setCategory(id);
            setPage(1);
          }}
        />
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        {/* Toolbar */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search services…"
              className="h-9 pl-8 pr-3 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 w-52"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Active toggle */}
          <div className="flex items-center bg-muted rounded-lg p-1">
            {[
              { label: "Active", value: true },
              { label: "All", value: undefined },
              { label: "Inactive", value: false },
            ].map(({ label, value }) => (
              <button
                key={label}
                onClick={() => {
                  setActive(value);
                  setPage(1);
                }}
                className={cn(
                  "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                  active === value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <span className="text-xs text-muted-foreground">
            {meta?.total ?? services.length} services
          </span>

          {canCreate && (
            <button
              onClick={() => router.push("/services/new")}
              className="ml-auto flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium"
              style={{
                backgroundColor: "var(--brand-gold)",
                color: "var(--brand-navy)",
              }}
            >
              <Plus className="w-4 h-4" />
              New Service
            </button>
          )}
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-40 rounded-2xl bg-muted/50 animate-pulse"
                />
              ))}
            </div>
          ) : services.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2">
              <p className="text-sm text-muted-foreground">No services found</p>
              {canCreate && (
                <button
                  onClick={() => router.push("/services/new")}
                  className="text-xs hover:underline"
                  style={{ color: "var(--brand-gold)" }}
                >
                  Create your first service →
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((svc: any) => (
                <button
                  key={svc.id}
                  onClick={() => router.push(`/services/${svc.id}`)}
                  className="bg-card rounded-2xl border border-border p-4 text-left hover:shadow-md hover:border-primary/30 transition-all group relative overflow-hidden"
                >
                  {/* Color strip */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{ backgroundColor: svc.color ?? "#C8A96E" }}
                  />

                  <div className="pt-1">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {svc.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {svc.category?.name}
                        </p>
                      </div>
                      {!svc.isActive && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                          Inactive
                        </span>
                      )}
                    </div>

                    {svc.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                        {svc.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-border/60">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {svc.durationMin} min
                      </span>
                      <span className="text-sm font-semibold text-foreground">
                        {formatCurrency(svc.price, svc.currency)}
                      </span>
                    </div>

                    {svc.variants?.length > 0 && (
                      <p className="text-[10px] text-muted-foreground mt-1.5">
                        +{svc.variants.length} variant
                        {svc.variants.length > 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {meta && meta.totalPages > 1 && (
          <Pagination
            page={page}
            totalPages={meta.totalPages}
            total={meta.total}
            limit={LIMIT}
            onPageChange={setPage}
          />
        )}
      </div>
    </div>
  );
}
