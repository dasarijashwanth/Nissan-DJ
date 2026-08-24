import { prisma } from "@/lib/prisma";
import type { IndiaTransfer } from "@/lib/types";
import { monthRange, shortMonthLabel } from "@/lib/utils";

export async function getIndiaTransfers(userId: string): Promise<IndiaTransfer[]> {
  const transfers = await prisma.indiaTransfer.findMany({
    where: { userId },
    orderBy: { date: "desc" },
  });

  return transfers.map((t) => ({
    ...t,
    date: t.date.toISOString(),
    createdAt: t.createdAt.toISOString(),
  }));
}

export async function isIndiaTransferOwnedBy(id: string, userId: string): Promise<boolean> {
  const t = await prisma.indiaTransfer.findUnique({ where: { id }, select: { userId: true } });
  return t?.userId === userId;
}

/** Total sent per month, last N months — for the trend chart. */
export function getIndiaTransferMonthlyTrend(
  transfers: IndiaTransfer[],
  months: number
): { month: string; amount: number }[] {
  const now = new Date();
  const buckets = Array.from({ length: months }, (_, i) => {
    const offset = months - 1 - i;
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1));
    return { year: date.getUTCFullYear(), month: date.getUTCMonth() };
  });

  return buckets.map(({ year, month }) => {
    const { start, end } = monthRange(year, month);
    const amount = transfers
      .filter((t) => {
        const d = new Date(t.date);
        return d >= start && d < end;
      })
      .reduce((sum, t) => sum + t.amount, 0);
    return { month: shortMonthLabel(year, month), amount };
  });
}

/** Total sent per recipient, largest first — for the by-recipient breakdown. */
export function groupIndiaTransfersByRecipient(transfers: IndiaTransfer[]): { recipient: string; amount: number }[] {
  const totals: Record<string, number> = {};
  for (const t of transfers) {
    totals[t.recipient] = (totals[t.recipient] ?? 0) + t.amount;
  }
  return Object.entries(totals)
    .map(([recipient, amount]) => ({ recipient, amount }))
    .sort((a, b) => b.amount - a.amount);
}
