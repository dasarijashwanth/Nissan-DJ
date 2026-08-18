"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Target } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { BudgetCard } from "@/components/budgets/BudgetCard";
import { BudgetForm } from "@/components/budgets/BudgetForm";
import type { BudgetWithSpending } from "@/lib/budgetQueries";

export function BudgetOverviewGrid({
  budgets,
  month,
  year,
}: {
  budgets: BudgetWithSpending[];
  month: number;
  year: number;
}) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("Remove this budget?")) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/budgets/${id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  if (budgets.length === 0) {
    return (
      <>
        <Card className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-slate-100">
            <Target className="size-6 text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-700">No budgets set for this month</p>
          <p className="max-w-xs text-sm text-slate-500">
            Set a monthly limit per category to start tracking your spending.
          </p>
          <Button onClick={() => setFormOpen(true)} className="mt-2">
            <Plus className="size-4" />
            Add Budget
          </Button>
        </Card>
        <BudgetForm key={formOpen ? "open" : "closed"} open={formOpen} onClose={() => setFormOpen(false)} month={month} year={year} />
      </>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="size-4" />
          Add Budget
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {budgets.map((b) => (
          <BudgetCard
            key={b.id}
            budget={b}
            onDelete={() => handleDelete(b.id)}
            deleting={deletingId === b.id}
          />
        ))}
      </div>

      <BudgetForm key={formOpen ? "open" : "closed"} open={formOpen} onClose={() => setFormOpen(false)} month={month} year={year} />
    </div>
  );
}
