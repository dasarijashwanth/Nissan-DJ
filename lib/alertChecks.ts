import { prisma } from "@/lib/prisma";
import { createAlertIfNotDuplicate } from "@/lib/alertQueries";
import { getBudgetStatus } from "@/lib/analyticsUtils";
import { monthRange, formatCurrency } from "@/lib/utils";

/** Call after creating an expense Transaction to raise a budget alert if it pushed spending past a threshold. */
export async function checkBudgetAlertForTransaction(userId: string, category: string, date: Date) {
  const month = date.getUTCMonth() + 1;
  const year = date.getUTCFullYear();

  const budget = await prisma.budget.findUnique({
    where: { userId_category_month_year: { userId, category, month, year } },
  });
  if (!budget) return;

  const { start, end } = monthRange(year, month - 1);
  const spentAgg = await prisma.transaction.aggregate({
    where: { userId, category, type: "expense", date: { gte: start, lt: end } },
    _sum: { amount: true },
  });
  const spent = spentAgg._sum.amount ?? 0;

  const status = getBudgetStatus(spent, budget.amount);
  if (status === "warning") {
    const pct = Math.round((spent / budget.amount) * 100);
    await createAlertIfNotDuplicate(
      userId,
      "budget_warning",
      `${category} budget warning`,
      `You've used ${pct}% of your ${category} budget`,
      "/budgets"
    );
  } else if (status === "exceeded") {
    const overage = spent - budget.amount;
    await createAlertIfNotDuplicate(
      userId,
      "budget_exceeded",
      `${category} budget exceeded`,
      `${category} budget exceeded by ${formatCurrency(overage)}`,
      "/budgets"
    );
  }
}
