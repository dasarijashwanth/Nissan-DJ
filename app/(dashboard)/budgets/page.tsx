import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getAuthUser } from "@/lib/supabase";
import { getBudgetsWithSpending } from "@/lib/budgetQueries";
import { monthLabel, formatCurrency } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { BudgetOverviewGrid } from "@/components/budgets/BudgetOverviewGrid";

export default async function BudgetsPage({ searchParams }: PageProps<"/budgets">) {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const now = new Date();
  const year = Number(params.year) || now.getUTCFullYear();
  const month = params.month ? Number(params.month) : now.getUTCMonth() + 1;

  const budgets = await getBudgetsWithSpending(user.id, month, year);

  const totalBudgeted = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);

  const prev = shiftMonth(year, month, -1);
  const next = shiftMonth(year, month, 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Budgets</h1>
          <p className="text-sm text-text-muted">Set monthly limits and track your progress.</p>
        </div>
        <div className="flex items-center gap-1">
          <Link
            href={`/budgets?year=${prev.year}&month=${prev.month}`}
            className="rounded-md p-1.5 text-text-muted hover:bg-slate-100"
            aria-label="Previous month"
          >
            <ChevronLeft className="size-5" />
          </Link>
          <span className="w-36 text-center text-sm font-medium text-text-primary">
            {monthLabel(year, month - 1)}
          </span>
          <Link
            href={`/budgets?year=${next.year}&month=${next.month}`}
            className="rounded-md p-1.5 text-text-muted hover:bg-slate-100"
            aria-label="Next month"
          >
            <ChevronRight className="size-5" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs font-medium text-text-muted">Total Budgeted</p>
          <p className="mt-1 text-lg font-semibold text-text-primary tabular-nums">
            {formatCurrency(totalBudgeted)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-text-muted">Total Spent</p>
          <p className="mt-1 text-lg font-semibold text-text-primary tabular-nums">
            {formatCurrency(totalSpent)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-text-muted">Remaining</p>
          <p className="mt-1 text-lg font-semibold text-indigo-600 tabular-nums">
            {formatCurrency(totalBudgeted - totalSpent)}
          </p>
        </Card>
      </div>

      <BudgetOverviewGrid budgets={budgets} month={month} year={year} />
    </div>
  );
}

function shiftMonth(year: number, month: number, delta: number) {
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };
}
