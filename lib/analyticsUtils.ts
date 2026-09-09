import type { Transaction, BudgetStatus } from "@/lib/types";
import { monthRange, shortMonthLabel, nowInAppTimezone } from "@/lib/utils";

export function calcSavingsRate(income: number, expenses: number): number {
  if (income <= 0) return 0;
  return ((income - expenses) / income) * 100;
}

export function calcMoMChange(
  current: number,
  previous: number
): { amount: number; percentage: number; direction: "up" | "down" | "flat" } {
  const amount = current - previous;
  const direction: "up" | "down" | "flat" = amount > 0 ? "up" : amount < 0 ? "down" : "flat";
  const percentage = previous !== 0 ? (amount / Math.abs(previous)) * 100 : current !== 0 ? 100 : 0;
  return { amount, percentage, direction };
}

export function groupByCategory(transactions: Transaction[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const t of transactions) {
    result[t.category] = (result[t.category] ?? 0) + t.amount;
  }
  return result;
}

/**
 * `anchor` is the last month the trend should end on — defaults to the current month, but a
 * custom analytics range needs the buckets to end at the picked end date instead of always today.
 */
export function getMonthlyTrend(
  transactions: Transaction[],
  months: number,
  anchor: Date = nowInAppTimezone()
): { month: string; income: number; expenses: number }[] {
  const buckets = Array.from({ length: months }, (_, i) => {
    const offset = months - 1 - i;
    const date = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() - offset, 1));
    return { year: date.getUTCFullYear(), month: date.getUTCMonth() };
  });

  return buckets.map(({ year, month }) => {
    const { start, end } = monthRange(year, month);
    let income = 0;
    let expenses = 0;

    for (const t of transactions) {
      const d = new Date(t.date);
      if (d >= start && d < end) {
        if (t.type === "income") income += t.amount;
        else expenses += t.amount;
      }
    }

    return { month: shortMonthLabel(year, month), income, expenses };
  });
}

export function getTopCategories(
  transactions: Transaction[],
  n: number
): { category: string; amount: number; percentage: number }[] {
  const grouped = groupByCategory(transactions);
  const total = Object.values(grouped).reduce((sum, v) => sum + v, 0);

  return Object.entries(grouped)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: total > 0 ? (amount / total) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, n);
}

export type AnalyticsPeriod = "month" | "3m" | "6m" | "year" | "all" | "custom";

/**
 * `customRange` is required (and only used) when period is "custom" — an inclusive start/end date
 * picked by the user. `end` here is exclusive (bumped to the day after the picked end date) to
 * match every other date-range boundary in the app (`d >= start && d < end`). `anchor` returned
 * is the last calendar month in range, for callers that build monthly trend buckets ending there
 * instead of always ending on today's month.
 */
export function getPeriodRange(
  period: AnalyticsPeriod,
  earliestDate?: Date,
  customRange?: { start: Date; end: Date }
) {
  const now = nowInAppTimezone();
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  if (period === "month") {
    return { start: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)), end, months: 1, anchor: now };
  }
  if (period === "3m") {
    return { start: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 2, 1)), end, months: 3, anchor: now };
  }
  if (period === "6m") {
    return { start: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1)), end, months: 6, anchor: now };
  }
  if (period === "year") {
    return {
      start: new Date(Date.UTC(now.getUTCFullYear(), 0, 1)),
      end,
      months: now.getUTCMonth() + 1,
      anchor: now,
    };
  }
  if (period === "custom" && customRange) {
    const { start, end: pickedEnd } = customRange;
    const exclusiveEnd = new Date(pickedEnd.getTime() + 24 * 60 * 60 * 1000);
    // Calendar months touched by the range, inclusive of both ends' months.
    const months = Math.max(
      1,
      (pickedEnd.getUTCFullYear() - start.getUTCFullYear()) * 12 + (pickedEnd.getUTCMonth() - start.getUTCMonth()) + 1
    );
    return { start, end: exclusiveEnd, months, anchor: pickedEnd };
  }

  const start = earliestDate ? new Date(Date.UTC(earliestDate.getUTCFullYear(), earliestDate.getUTCMonth(), 1)) : end;
  const months = Math.max(
    1,
    (end.getUTCFullYear() - start.getUTCFullYear()) * 12 + (end.getUTCMonth() - start.getUTCMonth())
  );
  return { start, end, months, anchor: now };
}

export function getBudgetStatus(spent: number, budget: number): BudgetStatus {
  if (budget <= 0) return "on_track";
  const pct = (spent / budget) * 100;
  if (pct >= 100) return "exceeded";
  if (pct >= 70) return "warning";
  return "on_track";
}
