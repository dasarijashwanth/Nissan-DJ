"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import type { UserPreferences } from "@/lib/types";

const TOGGLES: { key: keyof UserPreferences["notifications"]; label: string; description: string }[] = [
  {
    key: "budgetWarnings",
    label: "Budget warning alerts",
    description: "Notify when spending approaches or exceeds a budget.",
  },
  {
    key: "carMaintenanceAlerts",
    label: "Car maintenance alerts",
    description: "Notify when maintenance or insurance renewal is due soon.",
  },
  {
    key: "recurringReminders",
    label: "Recurring transaction reminders",
    description: "Notify when a recurring transaction is posted.",
  },
];

export function NotificationsSection({ notifications }: { notifications: UserPreferences["notifications"] }) {
  const [values, setValues] = useState(notifications);

  async function toggle(key: keyof UserPreferences["notifications"]) {
    const next = { ...values, [key]: !values[key] };
    setValues(next);
    await fetch("/api/settings/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notifications: next }),
    });
  }

  return (
    <Card className="p-5">
      <p className="mb-4 text-sm font-semibold text-slate-900">Notifications</p>
      <div className="space-y-4">
        {TOGGLES.map((t) => (
          <div key={t.key} className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-900">{t.label}</p>
              <p className="text-xs text-slate-500">{t.description}</p>
            </div>
            <button
              onClick={() => toggle(t.key)}
              aria-label={t.label}
              aria-pressed={values[t.key]}
              className={cn(
                "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                values[t.key] ? "bg-indigo-600" : "bg-slate-200"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform",
                  values[t.key] ? "translate-x-5" : "translate-x-0.5"
                )}
              />
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}
