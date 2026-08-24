import { prisma } from "@/lib/prisma";
import type { ChitFund, ChitFundEntryType, ChitFundPlan } from "@/lib/types";
import { monthRange, shortMonthLabel } from "@/lib/utils";

export async function getChitFunds(userId: string): Promise<ChitFund[]> {
  const contributions = await prisma.chitFund.findMany({
    where: { userId },
    orderBy: { date: "desc" },
  });

  return contributions.map((c) => ({
    ...c,
    type: c.type as ChitFundEntryType,
    date: c.date.toISOString(),
    createdAt: c.createdAt.toISOString(),
  }));
}

export async function isChitFundOwnedBy(id: string, userId: string): Promise<boolean> {
  const c = await prisma.chitFund.findUnique({ where: { id }, select: { userId: true } });
  return c?.userId === userId;
}

/** Total contributed per month, last N months — for the monthly contribution chart. Paid entries only; "received" money (e.g. loan interest) is tracked separately. */
export function getChitFundMonthlyTrend(
  contributions: ChitFund[],
  months: number
): { month: string; amount: number }[] {
  const paid = contributions.filter((c) => c.type === "paid");
  const now = new Date();
  const buckets = Array.from({ length: months }, (_, i) => {
    const offset = months - 1 - i;
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1));
    return { year: date.getUTCFullYear(), month: date.getUTCMonth() };
  });

  return buckets.map(({ year, month }) => {
    const { start, end } = monthRange(year, month);
    const amount = paid
      .filter((c) => {
        const d = new Date(c.date);
        return d >= start && d < end;
      })
      .reduce((sum, c) => sum + c.amount, 0);
    return { month: shortMonthLabel(year, month), amount };
  });
}

/** Running total saved as of the end of each of the last N months — shows the savings trajectory. Paid entries only. */
export function getChitFundCumulativeTrend(
  contributions: ChitFund[],
  months: number
): { month: string; total: number }[] {
  const paid = contributions.filter((c) => c.type === "paid");
  const now = new Date();
  const buckets = Array.from({ length: months }, (_, i) => {
    const offset = months - 1 - i;
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1));
    return { year: date.getUTCFullYear(), month: date.getUTCMonth() };
  });

  return buckets.map(({ year, month }) => {
    const { end } = monthRange(year, month);
    const total = paid
      .filter((c) => new Date(c.date) < end)
      .reduce((sum, c) => sum + c.amount, 0);
    return { month: shortMonthLabel(year, month), total };
  });
}

/** Total contributed per chit group, largest first — for the by-group breakdown. Paid entries only. */
export function groupChitFundsByGroup(contributions: ChitFund[]): { groupName: string; amount: number }[] {
  const totals: Record<string, number> = {};
  for (const c of contributions.filter((c) => c.type === "paid")) {
    totals[c.groupName] = (totals[c.groupName] ?? 0) + c.amount;
  }
  return Object.entries(totals)
    .map(([groupName, amount]) => ({ groupName, amount }))
    .sort((a, b) => b.amount - a.amount);
}

// ---- Recurring plans (auto-post a ChitFund row each month a plan is due) ----

export async function getChitFundPlans(userId: string): Promise<ChitFundPlan[]> {
  const plans = await prisma.chitFundPlan.findMany({
    where: { userId },
    orderBy: { nextDueDate: "asc" },
  });

  return plans.map((p) => ({
    ...p,
    type: p.type as ChitFundEntryType,
    startDate: p.startDate.toISOString(),
    nextDueDate: p.nextDueDate.toISOString(),
    lastCreated: p.lastCreated?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
  }));
}

export async function isChitFundPlanOwnedBy(id: string, userId: string): Promise<boolean> {
  const p = await prisma.chitFundPlan.findUnique({ where: { id }, select: { userId: true } });
  return p?.userId === userId;
}

/**
 * Creates this month's ChitFund contribution for a due plan, advances nextDueDate by a month, and
 * deactivates the plan once periodMonths payments have posted — mirrors postRecurringTransaction.
 */
export async function postChitFundPlan(planId: string) {
  const plan = await prisma.chitFundPlan.findUnique({ where: { id: planId } });
  if (!plan || !plan.isActive) return null;

  const now = new Date();
  const contribution = await prisma.chitFund.create({
    data: {
      userId: plan.userId,
      groupName: plan.groupName,
      amount: plan.amount,
      type: plan.type,
      date: plan.nextDueDate,
      notes: plan.notes,
    },
  });

  const monthsPosted = plan.monthsPosted + 1;
  const nextDueDate = new Date(plan.nextDueDate);
  nextDueDate.setUTCMonth(nextDueDate.getUTCMonth() + 1);
  const completed = monthsPosted >= plan.periodMonths;

  await prisma.chitFundPlan.update({
    where: { id: plan.id },
    data: { monthsPosted, nextDueDate, lastCreated: now, isActive: !completed },
  });

  return contribution;
}
