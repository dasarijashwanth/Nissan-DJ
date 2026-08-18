"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Input";
import type { UserPreferences } from "@/lib/types";

export function PreferencesSection({ preferences }: { preferences: UserPreferences }) {
  const [values, setValues] = useState(preferences);
  const [saving, setSaving] = useState(false);

  async function update<K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) {
    const next = { ...values, [key]: value };
    setValues(next);
    setSaving(true);
    try {
      await fetch("/api/settings/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-900">Preferences</p>
        {saving && <span className="text-xs text-slate-400">Saving…</span>}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          label="Currency symbol"
          value={values.currencySymbol}
          onChange={(e) => update("currencySymbol", e.target.value)}
        >
          <option value="$">$ (USD)</option>
          <option value="€">€ (EUR)</option>
          <option value="£">£ (GBP)</option>
          <option value="¥">¥ (JPY)</option>
        </Select>
        <Select
          label="Date format"
          value={values.dateFormat}
          onChange={(e) => update("dateFormat", e.target.value as UserPreferences["dateFormat"])}
        >
          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
        </Select>
        <Select
          label="Week starts on"
          value={values.weekStartsOn}
          onChange={(e) => update("weekStartsOn", e.target.value as UserPreferences["weekStartsOn"])}
        >
          <option value="sunday">Sunday</option>
          <option value="monday">Monday</option>
        </Select>
        <Select
          label="Default transaction type"
          value={values.defaultTransactionType}
          onChange={(e) => update("defaultTransactionType", e.target.value as UserPreferences["defaultTransactionType"])}
        >
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </Select>
      </div>
    </Card>
  );
}
