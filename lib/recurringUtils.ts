import type { RecurringFrequency } from "@/lib/types";

const DAY_MS = 24 * 60 * 60 * 1000;

export function computeNextDueDate(date: Date, frequency: RecurringFrequency): Date {
  const next = new Date(date);
  switch (frequency) {
    case "weekly":
      next.setUTCDate(next.getUTCDate() + 7);
      break;
    case "biweekly":
      next.setUTCDate(next.getUTCDate() + 14);
      break;
    case "monthly":
      next.setUTCMonth(next.getUTCMonth() + 1);
      break;
    case "yearly":
      next.setUTCFullYear(next.getUTCFullYear() + 1);
      break;
  }
  return next;
}

export function daysUntilDue(nextDueDate: string): number {
  return Math.ceil((new Date(nextDueDate).getTime() - Date.now()) / DAY_MS);
}

export function dueBadgeColor(days: number): "green" | "amber" | "red" {
  if (days <= 2) return "red";
  if (days <= 7) return "amber";
  return "green";
}
