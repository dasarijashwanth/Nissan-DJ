import { Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { AnimatedAmount } from "@/components/ui/AnimatedAmount";
import { BudgetProgressBar } from "@/components/budgets/BudgetProgressBar";
import { formatCurrency } from "@/lib/utils";
import type { BudgetWithSpending } from "@/lib/budgetQueries";

export function BudgetCard({
  budget,
  onDelete,
  deleting = false,
}: {
  budget: BudgetWithSpending;
  onDelete: () => void;
  deleting?: boolean;
}) {
  const remaining = budget.amount - budget.spent;
  const isOver = remaining < 0;

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <p className="text-sm font-semibold text-text-primary">{budget.category}</p>
        <button
          onClick={onDelete}
          disabled={deleting}
          aria-label={`Remove ${budget.category} budget`}
          className="rounded-md p-1 text-slate-300 hover:bg-red-500/10 hover:text-red-600 disabled:opacity-50"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>

      <div className="mt-3">
        <BudgetProgressBar spent={budget.spent} budget={budget.amount} />
      </div>

      <p className="mt-2 text-sm text-text-muted">
        You&apos;ve spent <AnimatedAmount value={budget.spent} format={formatCurrency} /> of{" "}
        <AnimatedAmount value={budget.amount} format={formatCurrency} /> this month
      </p>
      <p className={isOver ? "text-sm font-medium text-red-600" : "text-sm font-medium text-emerald-600"}>
        <AnimatedAmount value={isOver ? -remaining : remaining} format={formatCurrency} />{" "}
        {isOver ? "over budget" : "remaining"}
      </p>
    </Card>
  );
}
