"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Play } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { daysUntilDue, dueBadgeColor } from "@/lib/recurringUtils";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { RecurringTransaction } from "@/lib/types";

const FREQUENCY_LABEL: Record<string, string> = {
  weekly: "Weekly",
  biweekly: "Bi-weekly",
  monthly: "Monthly",
  yearly: "Yearly",
};

export function RecurringCard({
  recurring,
  onEdit,
}: {
  recurring: RecurringTransaction;
  onEdit: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const days = daysUntilDue(recurring.nextDueDate);

  async function toggleActive() {
    setBusy(true);
    try {
      const res = await fetch(`/api/recurring/${recurring.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !recurring.isActive }),
      });
      if (res.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function postNow() {
    setBusy(true);
    try {
      const res = await fetch(`/api/recurring/${recurring.id}`, { method: "POST" });
      if (res.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${recurring.title}"? This cannot be undone.`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/recurring/${recurring.id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className={cn("p-5", !recurring.isActive && "opacity-60")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-text-primary">{recurring.title}</p>
          <p
            className={cn(
              "text-lg font-semibold tabular-nums",
              recurring.type === "income" ? "text-emerald-600" : "text-red-600"
            )}
          >
            {recurring.type === "income" ? "+" : "-"}
            {formatCurrency(recurring.amount)}
          </p>
        </div>
        <div className="flex shrink-0 gap-1">
          <button onClick={onEdit} aria-label="Edit" className="rounded-md p-1.5 text-text-muted hover:bg-black/[0.06] hover:text-text-secondary">
            <Pencil className="size-4" />
          </button>
          <button
            onClick={handleDelete}
            disabled={busy}
            aria-label="Delete"
            className="rounded-md p-1.5 text-text-muted hover:bg-red-500/10 hover:text-red-600 disabled:opacity-50"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge color="slate">{FREQUENCY_LABEL[recurring.frequency] ?? recurring.frequency}</Badge>
        <Badge color={dueBadgeColor(days)}>
          {days < 0 ? "Overdue" : days === 0 ? "Due today" : `Due in ${days}d`}
        </Badge>
      </div>

      <p className="mt-2 text-xs text-text-muted">Next: {formatDate(recurring.nextDueDate)}</p>

      <div className="mt-4 flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={toggleActive} disabled={busy}>
          {recurring.isActive ? "Pause" : "Resume"}
        </Button>
        <Button size="sm" className="flex-1" onClick={postNow} disabled={busy || !recurring.isActive}>
          <Play className="size-3.5" />
          Post now
        </Button>
      </div>
    </Card>
  );
}
