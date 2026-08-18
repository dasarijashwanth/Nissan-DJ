import { prisma } from "@/lib/prisma";
import type { Alert, AlertType } from "@/lib/types";

export async function getAlerts(userId: string, type?: string, limit?: number): Promise<Alert[]> {
  const alerts = await prisma.alert.findMany({
    where: { userId, ...(type && type !== "all" ? { type } : {}) },
    orderBy: { createdAt: "desc" },
    ...(limit ? { take: limit } : {}),
  });
  return alerts.map((a) => ({
    ...a,
    type: a.type as AlertType,
    createdAt: a.createdAt.toISOString(),
  }));
}

export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.alert.count({ where: { userId, isRead: false } });
}

export async function isAlertOwnedBy(alertId: string, userId: string): Promise<boolean> {
  const alert = await prisma.alert.findUnique({ where: { id: alertId }, select: { userId: true } });
  return alert?.userId === userId;
}

/** Skips creation if the same type+title alert was already created today, to avoid daily duplicates. */
export async function createAlertIfNotDuplicate(
  userId: string,
  type: AlertType,
  title: string,
  message: string,
  link?: string | null
) {
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const existing = await prisma.alert.findFirst({
    where: { userId, type, title, createdAt: { gte: startOfDay } },
    select: { id: true },
  });
  if (existing) return null;

  return prisma.alert.create({
    data: { userId, type, title, message, link: link ?? null },
  });
}
