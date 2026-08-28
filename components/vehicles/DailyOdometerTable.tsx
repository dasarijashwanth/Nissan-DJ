"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { formatDate, formatMiles } from "@/lib/utils";
import type { DailyOdometer } from "@/lib/types";

export function DailyOdometerTable({
  entries,
  onSave,
  onDelete,
  submitting,
}: {
  entries: DailyOdometer[];
  onSave: (date: string, miles: number) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  submitting: boolean;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (entries.length === 0) return null;

  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30);

  function startEdit(entry: DailyOdometer) {
    setEditingId(entry.id);
    setEditValue(String(entry.miles));
  }

  async function saveEdit(entry: DailyOdometer) {
    if (editValue === "" || Number.isNaN(Number(editValue))) return;
    const ok = await onSave(entry.date, Number(editValue));
    if (ok) setEditingId(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this day's odometer entry? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Card className="overflow-hidden p-0">
      <p className="px-4 pt-4 text-sm font-medium text-text-secondary">Recent Entries</p>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/[0.08] text-left text-xs font-medium uppercase tracking-wide text-text-muted">
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 text-right">Odometer</th>
              <th className="px-4 py-3 text-right">Driven</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((entry) => {
              const isEditing = editingId === entry.id;
              return (
                <tr key={entry.id} className="border-b border-black/[0.08] last:border-0 hover:bg-black/[0.04]">
                  <td className="px-4 py-3 text-text-primary">{formatDate(entry.date)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {isEditing ? (
                      <Input
                        type="number"
                        min="0"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="ml-auto w-28"
                      />
                    ) : (
                      formatMiles(entry.miles)
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-text-muted">{formatMiles(entry.driven)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      {isEditing ? (
                        <>
                          <Button size="sm" onClick={() => saveEdit(entry)} loading={submitting}>
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(entry)}
                            aria-label={`Edit ${formatDate(entry.date)}`}
                            className="rounded-md p-1.5 text-text-muted hover:bg-black/[0.06] hover:text-text-secondary"
                          >
                            <Pencil className="size-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(entry.id)}
                            disabled={deletingId === entry.id}
                            aria-label={`Delete ${formatDate(entry.date)}`}
                            className="rounded-md p-1.5 text-text-muted hover:bg-red-500/10 hover:text-red-600 disabled:opacity-50"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
