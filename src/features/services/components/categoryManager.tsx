"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import { Plus, Pencil, Trash2, Check, X, Loader2 } from "lucide-react";
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "../hooks/useServices";

export function CategoryManager({
  onSelect,
  selected,
}: {
  onSelect?: (id: string | undefined) => void;
  selected?: string;
}) {
  const { data } = useCategories();
  const categories = Array.isArray(data) ? data : [];

  const create = useCreateCategory();
  const update = useUpdateCategory();
  const remove = useDeleteCategory();

  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#C8A96E");

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/20">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Categories
        </p>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="p-1 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="p-2 space-y-1">
        {/* All filter */}
        <button
          onClick={() => onSelect?.(undefined)}
          className={cn(
            "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
            !selected
              ? "text-brand-navy font-medium"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
          style={
            !selected ? { backgroundColor: "var(--brand-gold)" } : undefined
          }
        >
          All services
        </button>

        {categories.map((cat: any) => (
          <div key={cat.id} className="group flex items-center gap-1">
            {editId === cat.id ? (
              <div className="flex items-center gap-1.5 flex-1 px-2">
                <input
                  type="color"
                  value={editColor}
                  onChange={(e) => setEditColor(e.target.value)}
                  className="w-6 h-6 rounded cursor-pointer"
                />
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1 h-7 px-2 text-sm rounded-md border border-input bg-background focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={() => {
                    update.mutate({
                      id: cat.id,
                      name: editName,
                      color: editColor,
                    });
                    setEditId(null);
                  }}
                  className="p-1 rounded text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                >
                  <Check className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setEditId(null)}
                  className="p-1 rounded text-muted-foreground hover:bg-muted"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => onSelect?.(cat.id)}
                  className={cn(
                    "flex-1 flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left",
                    selected === cat.id
                      ? "text-brand-navy font-medium"
                      : "text-foreground hover:bg-muted",
                  )}
                  style={
                    selected === cat.id
                      ? { backgroundColor: "var(--brand-gold)" }
                      : undefined
                  }
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color ?? "#C8A96E" }}
                  />
                  <span className="truncate">{cat.name}</span>
                  <span className="ml-auto text-xs opacity-60">
                    {cat._count?.services ?? 0}
                  </span>
                </button>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={() => {
                      setEditId(cat.id);
                      setEditName(cat.name);
                      setEditColor(cat.color ?? "#C8A96E");
                    }}
                    className="p-1 rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${cat.name}"?`))
                        remove.mutate(cat.id);
                    }}
                    className="p-1 rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}

        {/* Add new */}
        {showAdd && (
          <div className="flex items-center gap-1.5 px-2 pt-1">
            <input
              type="color"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              className="w-6 h-6 rounded cursor-pointer shrink-0"
            />
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Category name…"
              className="flex-1 h-7 px-2 text-sm rounded-md border border-input bg-background focus:outline-none"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && newName.trim()) {
                  create.mutate({ name: newName.trim(), color: newColor });
                  setNewName("");
                  setShowAdd(false);
                }
              }}
            />
            <button
              onClick={() => {
                if (newName.trim()) {
                  create.mutate({ name: newName.trim(), color: newColor });
                  setNewName("");
                  setShowAdd(false);
                }
              }}
              disabled={create.isPending || !newName.trim()}
              className="p-1 rounded text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 disabled:opacity-40"
            >
              {create.isPending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Check className="w-3 h-3" />
              )}
            </button>
            <button
              onClick={() => {
                setShowAdd(false);
                setNewName("");
              }}
              className="p-1 rounded text-muted-foreground hover:bg-muted"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
