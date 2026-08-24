"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Play } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { daysUntilDue, dueBadgeColor } from "@/lib/recurringUtils";
import { cn, formatINR, formatCurrency, formatDate } from "@/lib/utils";
import type { ChitFundPlan } from "@/lib/types";

export function ChitFundPlanCard({
  plan,
  usdRate,
  onEdit,
}: {
  plan: ChitFundPlan;
  usdRate: number;
  onEdit: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const days = daysUntilDue(plan.nextDueDate);
  const completed = plan.monthsPosted >= plan.periodMonths;

  async function toggleActive() {
    setBusy(true);
    try {
      const res = await fetch(`/api/chit-fund-plans/${plan.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !plan.isActive }),
      });
      if (res.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function postNow() {
    setBusy(true);
    try {
      const res = await fetch(`/api/chit-fund-plans/${plan.id}`, { method: "POST" });
      if (res.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete the "${plan.groupName}" plan? This cannot be undone (past contributions stay logged).`))
      return;
    setBusy(true);
    try {
      const res = await fetch(`/api/chit-fund-plans/${plan.id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className={cn("p-5", (!plan.isActive || completed) && "opacity-60")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-text-primary">{plan.groupName}</p>
          <p className="text-lg font-semibold tabular-nums text-emerald-600">{formatINR(plan.amount)}/mo</p>
          <p className="text-xs text-text-muted">≈ {formatCurrency(plan.amount / usdRate)}/mo</p>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            onClick={onEdit}
            aria-label="Edit"
            className="rounded-md p-1.5 text-text-muted hover:bg-black/[0.06] hover:text-text-secondary"
          >
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
        <Badge color="indigo">
          {plan.monthsPosted}/{plan.periodMonths} months
        </Badge>
        {completed ? (
          <Badge color="green">Completed</Badge>
        ) : (
          <Badge color={dueBadgeColor(days)}>
            {days < 0 ? "Overdue" : days === 0 ? "Due today" : `Due in ${days}d`}
          </Badge>
        )}
      </div>

      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-black/[0.06]">
        <div
          className="h-full rounded-full bg-emerald-500"
          style={{ width: `${Math.min(100, (plan.monthsPosted / plan.periodMonths) * 100)}%` }}
        />
      </div>

      {!completed && <p className="mt-2 text-xs text-text-muted">Next: {formatDate(plan.nextDueDate)}</p>}

      {!completed && (
        <div className="mt-4 flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={toggleActive} disabled={busy}>
            {plan.isActive ? "Pause" : "Resume"}
          </Button>
          <Button size="sm" className="flex-1" onClick={postNow} disabled={busy || !plan.isActive}>
            <Play className="size-3.5" />
            Post now
          </Button>
        </div>
      )}
    </Card>
  );
}
