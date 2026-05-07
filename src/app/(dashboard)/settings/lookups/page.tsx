"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  useLookups,
  useLookupMutations,
} from "@/features/settings/hooks/useSettings";
import { SettingsSection } from "@/features/settings/components/settingsSection";
import { cn } from "@/lib/utils";
import { Plus, Pencil, Trash2, Loader2, X, Check } from "lucide-react";

// ── Lookup section ────────────────────────────────────────────────────────────

function LookupManager({
  title,
  description,
  type,
  storeKey,
  allowCreate = true,
}: {
  title: string;
  description: string;
  type: string;
  storeKey: any;
  allowCreate?: boolean;
}) {
  const { data, isLoading } = useLookups(storeKey);
  const { create, update, remove } = useLookupMutations(type);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newName, setNewName] = useState("");

  const items = Array.isArray(data) ? data : [];

  return (
    <SettingsSection
      title={title}
      description={description}
    >
      <div className="space-y-2">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No items yet.
          </p>
        ) : (
          items.map((item: any) => (
            <div
              key={item.id}
              className="flex items-center gap-3 px-3 py-2.5 border border-border rounded-lg"
            >
              {item.color && (
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
              )}

              {editingId === item.id ? (
                <>
                  <input
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    className="flex-1 h-7 px-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring/30"
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      update.mutate({ id: item.id, label: editLabel });
                      setEditingId(null);
                    }}
                    className="p-1 rounded text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="p-1 rounded text-muted-foreground hover:bg-muted transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {item.label}
                    </p>
                    {item.name && item.name !== item.label && (
                      <p className="text-xs text-muted-foreground font-mono">
                        {item.name}
                      </p>
                    )}
                  </div>
                  {item.isSystem && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      system
                    </span>
                  )}
                  {!item.isSystem && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => {
                          setEditingId(item.id);
                          setEditLabel(item.label);
                        }}
                        className="p-1 rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Remove "${item.label}"?`))
                            remove.mutate(item.id);
                        }}
                        className="p-1 rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))
        )}

        {/* Add new */}
        {allowCreate &&
          (showAdd ? (
            <div className="flex items-center gap-2 pt-1">
              <input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Display label"
                className="flex-1 h-8 px-2.5 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring/30"
                autoFocus
              />
              <button
                onClick={() => {
                  if (!newLabel.trim()) return;
                  const name = newLabel
                    .trim()
                    .toLowerCase()
                    .replace(/\s+/g, "_");
                  create.mutate({ name, label: newLabel.trim() });
                  setNewLabel("");
                  setShowAdd(false);
                }}
                disabled={create.isPending || !newLabel.trim()}
                className="flex items-center gap-1 h-8 px-3 rounded-lg text-xs font-medium disabled:opacity-50"
                style={{
                  backgroundColor: "var(--brand-gold)",
                  color: "var(--brand-navy)",
                }}
              >
                {create.isPending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Check className="w-3 h-3" />
                )}
                Add
              </button>
              <button
                onClick={() => {
                  setShowAdd(false);
                  setNewLabel("");
                }}
                className="h-8 px-2 rounded-lg border border-border text-xs hover:bg-muted transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors pt-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Add item
            </button>
          ))}
      </div>
    </SettingsSection>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function LookupsPage() {
  return (
    <div className="space-y-5">
      <LookupManager
        title="Genders"
        description="Gender options shown on client profiles"
        type="genders"
        storeKey="genders"
      />
      <LookupManager
        title="Skin Types"
        description="Skin type classifications for client profiles and intake forms"
        type="skin-types"
        storeKey="skinTypes"
      />
      <LookupManager
        title="Booking Sources"
        description="Where clients find and book appointments (walk-in, Instagram, referral, etc.)"
        type="booking-sources"
        storeKey="sources"
      />
      <LookupManager
        title="Appointment Statuses"
        description="System appointment statuses — system statuses cannot be edited or deleted"
        type="appointment-statuses"
        storeKey="statuses"
        allowCreate={false}
      />
    </div>
  );
}
