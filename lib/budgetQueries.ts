import { prisma } from "@/lib/prisma";
import { monthRange } from "@/lib/utils";
import type { Budget } from "@/lib/types";

export async function getBudgets(userId: string, month: number, year: number): Promise<Budget[]> {
  const budgets = await prisma.budget.findMany({
    where: { userId, month, year },
    orderBy: { category: "asc" },
  });
  return budgets.map((b) => ({ ...b, createdAt: b.createdAt.toISOString() }));
}

/** Budget.month is 1-12; monthRange expects the 0-11 JS convention. */
export async function getSpendingByCategory(
  userId: string,
  month: number,
  year: number
): Promise<Record<string, number>> {
  const { start, end } = monthRange(year, month - 1);

  const totals = await prisma.transaction.groupBy({
    by: ["category"],
    where: { userId, type: "expense", date: { gte: start, lt: end } },
    _sum: { amount: true },
  });

  const result: Record<string, number> = {};
  for (const t of totals) result[t.category] = t._sum.amount ?? 0;
  return result;
}

export type BudgetWithSpending = Budget & { spent: number };

export async function getBudgetsWithSpending(
  userId: string,
  month: number,
  year: number
): Promise<BudgetWithSpending[]> {
  const [budgets, spending] = await Promise.all([
    getBudgets(userId, month, year),
    getSpendingByCategory(userId, month, year),
  ]);

  return budgets.map((b) => ({ ...b, spent: spending[b.category] ?? 0 }));
}

export async function isBudgetOwnedBy(budgetId: string, userId: string): Promise<boolean> {
  const budget = await prisma.budget.findUnique({ where: { id: budgetId }, select: { userId: true } });
  return budget?.userId === userId;
}
