import { prisma } from "@/lib/prisma";
import type { RecurringTransaction, RecurringFrequency, TransactionType } from "@/lib/types";
import { computeNextDueDate } from "@/lib/recurringUtils";
import { createAlertIfNotDuplicate } from "@/lib/alertQueries";
import { checkBudgetAlertForTransaction } from "@/lib/alertChecks";
import { formatCurrency } from "@/lib/utils";
import { VEHICLE_CATEGORIES } from "@/lib/trackingMode";
import type { categoryWhereForMode } from "@/lib/trackingMode";

type CategoryWhere = ReturnType<typeof categoryWhereForMode>;

export async function getRecurringTransactions(
  userId: string,
  categoryWhere?: CategoryWhere
): Promise<RecurringTransaction[]> {
  const items = await prisma.recurringTransaction.findMany({
    where: { userId, ...categoryWhere },
    orderBy: { nextDueDate: "asc" },
  });

  return items.map((r) => ({
    ...r,
    type: r.type as TransactionType,
    frequency: r.frequency as RecurringFrequency,
    startDate: r.startDate.toISOString(),
    nextDueDate: r.nextDueDate.toISOString(),
    lastCreated: r.lastCreated?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function isRecurringOwnedBy(id: string, userId: string): Promise<boolean> {
  const r = await prisma.recurringTransaction.findUnique({ where: { id }, select: { userId: true } });
  return r?.userId === userId;
}

export async function getDueTodayCount(userId: string, categoryWhere?: CategoryWhere): Promise<number> {
  const endOfToday = new Date();
  endOfToday.setUTCHours(23, 59, 59, 999);

  return prisma.recurringTransaction.count({
    where: { userId, isActive: true, nextDueDate: { lte: endOfToday }, ...categoryWhere },
  });
}

/**
 * Creates the Transaction, advances nextDueDate, and (for the cron path only) raises an alert —
 * manual "Post now" clicks skip the alert since the UI already confirms the action directly.
 */
export async function postRecurringTransaction(recurringId: string, options: { alert?: boolean } = {}) {
  const recurring = await prisma.recurringTransaction.findUnique({ where: { id: recurringId } });
  if (!recurring || !recurring.isActive) return null;

  const now = new Date();
  const scope = (VEHICLE_CATEGORIES as readonly string[]).includes(recurring.category) ? "vehicle" : "life";
  const transaction = await prisma.transaction.create({
    data: {
      userId: recurring.userId,
      title: recurring.title,
      amount: recurring.amount,
      type: recurring.type,
      category: recurring.category,
      scope,
      date: recurring.nextDueDate,
      notes: recurring.notes,
    },
  });

  const nextDueDate = computeNextDueDate(recurring.nextDueDate, recurring.frequency as RecurringFrequency);
  await prisma.recurringTransaction.update({
    where: { id: recurring.id },
    data: { nextDueDate, lastCreated: now },
  });

  if (recurring.type === "expense") {
    await checkBudgetAlertForTransaction(recurring.userId, recurring.category, transaction.date);
  }

  if (options.alert) {
    await createAlertIfNotDuplicate(
      recurring.userId,
      "recurring_due",
      `${recurring.title} posted`,
      `${recurring.title} of ${formatCurrency(recurring.amount)} was automatically posted today`,
      "/transactions"
    );
  }

  return transaction;
}
