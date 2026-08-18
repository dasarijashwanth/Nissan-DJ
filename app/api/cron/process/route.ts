import { NextResponse } from "next/server";
import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { postRecurringTransaction } from "@/lib/recurringQueries";
import { createAlertIfNotDuplicate } from "@/lib/alertQueries";
import { getCurrentOdometer } from "@/lib/carQueries";
import { daysUntil } from "@/lib/carUtils";
import type { AlertType, UserPreferences } from "@/lib/types";

const MAINTENANCE_DUE_DAYS = 14;
const OIL_CHANGE_DUE_MILES = 500;
const INSURANCE_DUE_DAYS = 30;

export async function GET(request: Request) {
  // Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` automatically; `x-cron-secret` is
  // kept as a fallback for manual triggering or a non-Vercel scheduler.
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const customHeader = request.headers.get("x-cron-secret");
  const provided = bearer || customHeader;

  if (!process.env.CRON_SECRET || provided !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let recurringPosted = 0;
  let alertsCreated = 0;
  let budgetsCreated = 0;

  const now = new Date();
  if (now.getUTCDate() === 1) {
    const usersWithPreferences = await prisma.user.findMany({ where: { preferences: { not: Prisma.DbNull } } });
    for (const u of usersWithPreferences) {
      const defaults = (u.preferences as Partial<UserPreferences> | null)?.defaultBudgets ?? {};
      for (const [category, amount] of Object.entries(defaults)) {
        await prisma.budget.upsert({
          where: {
            userId_category_month_year: {
              userId: u.id,
              category,
              month: now.getUTCMonth() + 1,
              year: now.getUTCFullYear(),
            },
          },
          update: {},
          create: { userId: u.id, category, amount, month: now.getUTCMonth() + 1, year: now.getUTCFullYear() },
        });
        budgetsCreated++;
      }
    }
  }

  const dueRecurring = await prisma.recurringTransaction.findMany({
    where: { isActive: true, nextDueDate: { lte: new Date() } },
  });
  for (const r of dueRecurring) {
    const posted = await postRecurringTransaction(r.id, { alert: true });
    if (posted) recurringPosted++;
  }

  const cars = await prisma.car.findMany();
  for (const car of cars) {
    const [maintenanceLogs, latestPolicy, currentOdometer] = await Promise.all([
      prisma.maintenanceLog.findMany({ where: { carId: car.id } }),
      prisma.insurance.findFirst({ where: { carId: car.id }, orderBy: { renewalDate: "desc" } }),
      getCurrentOdometer(car.id),
    ]);

    for (const log of maintenanceLogs) {
      if (log.nextDueMiles != null && currentOdometer >= log.nextDueMiles - OIL_CHANGE_DUE_MILES) {
        const remaining = Math.max(0, Math.round(log.nextDueMiles - currentOdometer));
        const created = await createAlertIfNotDuplicate(
          car.userId,
          "oil_change_due" satisfies AlertType,
          `${log.type} due soon`,
          `${log.type} due in ~${remaining} miles`,
          "/sentra/maintenance"
        );
        if (created) alertsCreated++;
      }

      if (log.nextDueDate) {
        const days = daysUntil(log.nextDueDate.toISOString());
        if (days <= MAINTENANCE_DUE_DAYS) {
          const created = await createAlertIfNotDuplicate(
            car.userId,
            "maintenance_due" satisfies AlertType,
            `${log.type} due soon`,
            days <= 0 ? `${log.type} is overdue` : `${log.type} due in ${days} days`,
            "/sentra/maintenance"
          );
          if (created) alertsCreated++;
        }
      }
    }

    if (latestPolicy) {
      const days = daysUntil(latestPolicy.renewalDate.toISOString());
      if (days <= INSURANCE_DUE_DAYS) {
        const created = await createAlertIfNotDuplicate(
          car.userId,
          "insurance_due" satisfies AlertType,
          `${latestPolicy.provider} insurance renewal`,
          days <= 0 ? `${latestPolicy.provider} insurance has renewed` : `Insurance renews in ${days} days`,
          "/sentra/insurance"
        );
        if (created) alertsCreated++;
      }
    }
  }

  return NextResponse.json({ success: true, recurringPosted, alertsCreated, budgetsCreated });
}
