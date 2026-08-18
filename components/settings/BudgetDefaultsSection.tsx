"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { CATEGORIES } from "@/lib/types";

export function BudgetDefaultsSection({ defaultBudgets }: { defaultBudgets: Record<string, number> }) {
  const [values, setValues] = useState(defaultBudgets);
  const [saving, setSaving] = useState<string | null>(null);

  async function update(category: string, amount: string) {
    const next = { ...values };
    if (amount === "" || Number(amount) <= 0) {
      delete next[category];
    } else {
      next[category] = Number(amount);
    }
    setValues(next);
    setSaving(category);
    try {
      await fetch("/api/settings/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ defaultBudgets: next }),
      });
    } finally {
      setSaving(null);
    }
  }

  return (
    <Card className="p-5">
      <p className="mb-1 text-sm font-semibold text-slate-900">Budget Defaults</p>
      <p className="mb-4 text-xs text-slate-500">
        These amounts automatically create a budget for each category when a new month starts.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {CATEGORIES.map((category) => (
          <Input
            key={category}
            label={category}
            type="number"
            step="0.01"
            min="0"
            placeholder="No default"
            value={values[category] != null ? String(values[category]) : ""}
            onChange={(e) => update(category, e.target.value)}
          />
        ))}
      </div>
      {saving && <p className="mt-2 text-xs text-slate-400">Saving…</p>}
    </Card>
  );
}
