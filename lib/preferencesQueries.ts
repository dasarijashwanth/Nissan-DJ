import { prisma } from "@/lib/prisma";
import { DEFAULT_PREFERENCES, type UserPreferences } from "@/lib/types";

export async function getUserPreferences(userId: string): Promise<UserPreferences> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { preferences: true } });
  const stored = (user?.preferences as Partial<UserPreferences> | null) ?? {};

  return {
    ...DEFAULT_PREFERENCES,
    ...stored,
    notifications: { ...DEFAULT_PREFERENCES.notifications, ...stored.notifications },
    defaultBudgets: { ...DEFAULT_PREFERENCES.defaultBudgets, ...stored.defaultBudgets },
  };
}

export async function updateUserPreferences(
  userId: string,
  partial: Partial<UserPreferences>
): Promise<UserPreferences> {
  const current = await getUserPreferences(userId);
  const next: UserPreferences = {
    ...current,
    ...partial,
    notifications: { ...current.notifications, ...partial.notifications },
    defaultBudgets: { ...current.defaultBudgets, ...partial.defaultBudgets },
  };

  await prisma.user.update({ where: { id: userId }, data: { preferences: next } });
  return next;
}
