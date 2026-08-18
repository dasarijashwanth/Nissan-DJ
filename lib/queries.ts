import { prisma } from "@/lib/prisma";
import { monthRange, shortMonthLabel } from "@/lib/utils";
import type { Transaction, TransactionType } from "@/lib/types";

export async function getTransactions(
  userId: string,
  start?: Date,
  end?: Date
): Promise<Transaction[]> {
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      ...(start && end ? { date: { gte: start, lt: end } } : {}),
    },
    orderBy: { date: "desc" },
  });

  return transactions.map((t) => ({
    ...t,
    type: t.type as TransactionType,
    date: t.date.toISOString(),
    createdAt: t.createdAt.toISOString(),
  }));
}

export async function getSummary(userId: string, start: Date, end: Date) {
  const [income, expense] = await Promise.all([
    prisma.transaction.aggregate({
      where: { userId, type: "income", date: { gte: start, lt: end } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, type: "expense", date: { gte: start, lt: end } },
      _sum: { amount: true },
    }),
  ]);

  const totalIncome = income._sum.amount ?? 0;
  const totalExpenses = expense._sum.amount ?? 0;

  return { totalIncome, totalExpenses, netBalance: totalIncome - totalExpenses };
}

export async function getMonthlyChartData(userId: string, months = 6) {
  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth();

  const buckets = Array.from({ length: months }, (_, i) => {
    const offset = months - 1 - i;
    const date = new Date(Date.UTC(currentYear, currentMonth - offset, 1));
    return { year: date.getUTCFullYear(), month: date.getUTCMonth() };
  });

  const { start } = monthRange(buckets[0].year, buckets[0].month);
  const { end } = monthRange(buckets[buckets.length - 1].year, buckets[buckets.length - 1].month);

  const transactions = await prisma.transaction.findMany({
    where: { userId, date: { gte: start, lt: end } },
    select: { date: true, amount: true, type: true },
  });

  return buckets.map(({ year, month }) => {
    const { start: bucketStart, end: bucketEnd } = monthRange(year, month);
    let income = 0;
    let expense = 0;

    for (const t of transactions) {
      if (t.date >= bucketStart && t.date < bucketEnd) {
        if (t.type === "income") income += t.amount;
        else expense += t.amount;
      }
    }

    return { month: shortMonthLabel(year, month), income, expense };
  });
}

export async function getCategoryTotals(userId: string, start: Date, end: Date) {
  const totals = await prisma.transaction.groupBy({
    by: ["category", "type"],
    where: { userId, date: { gte: start, lt: end } },
    _sum: { amount: true },
  });

  return totals
    .map((t) => ({
      category: t.category,
      type: t.type,
      total: t._sum.amount ?? 0,
    }))
    .sort((a, b) => b.total - a.total);
}
