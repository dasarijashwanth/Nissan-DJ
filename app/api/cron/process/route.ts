import { NextResponse } from "next/server";
import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { postRecurringTransaction } from "@/lib/recurringQueries";
import { postChitFundPlan } from "@/lib/chitFundQueries";
import { createAlertIfNotDuplicate } from "@/lib/alertQueries";
import { getCurrentOdometer, getFuelLogs } from "@/lib/vehicleQueries";
import { daysUntil, calcAvgMPGInRange, calcAvgPricePerGallonInRange } from "@/lib/vehicleUtils";
import { monthRange } from "@/lib/utils";
import type { AlertType, UserPreferences } from "@/lib/types";

const MAINTENANCE_DUE_DAYS = 14;
const OIL_CHANGE_DUE_MILES = 500;
const INSURANCE_DUE_DAYS = 30;
const MPG_DROP_THRESHOLD = 0.85; // alert if this month's MPG is below 85% of last month's
const FUEL_PRICE_SPIKE_THRESHOLD = 1.1; // alert if this month's avg price/gallon is above 110% of last month's

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
  let chitFundsPosted = 0;
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

  const dueChitFundPlans = await prisma.chitFundPlan.findMany({
    where: { isActive: true, nextDueDate: { lte: new Date() } },
  });
  for (const plan of dueChitFundPlans) {
    const posted = await postChitFundPlan(plan.id);
    if (posted) chitFundsPosted++;
  }

  const vehicles = await prisma.vehicle.findMany();
  for (const vehicle of vehicles) {
    const [maintenanceLogs, latestPolicy, currentOdometer, fuelLogs] = await Promise.all([
      prisma.maintenanceLog.findMany({ where: { vehicleId: vehicle.id } }),
      prisma.insurance.findFirst({ where: { vehicleId: vehicle.id }, orderBy: { renewalDate: "desc" } }),
      getCurrentOdometer(vehicle.id),
      getFuelLogs(vehicle.id),
    ]);

    for (const log of maintenanceLogs) {
      if (log.nextDueMiles != null && currentOdometer >= log.nextDueMiles - OIL_CHANGE_DUE_MILES) {
        const remaining = Math.max(0, Math.round(log.nextDueMiles - currentOdometer));
        const created = await createAlertIfNotDuplicate(
          vehicle.userId,
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
            vehicle.userId,
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
          vehicle.userId,
          "insurance_due" satisfies AlertType,
          `${latestPolicy.provider} insurance renewal`,
          days <= 0 ? `${latestPolicy.provider} insurance has renewed` : `Insurance renews in ${days} days`,
          "/sentra/insurance"
        );
        if (created) alertsCreated++;
      }
    }

    const thisMonth = monthRange(now.getUTCFullYear(), now.getUTCMonth());
    const lastMonthDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    const lastMonth = monthRange(lastMonthDate.getUTCFullYear(), lastMonthDate.getUTCMonth());

    const thisMonthMPG = calcAvgMPGInRange(fuelLogs, thisMonth.start, thisMonth.end);
    const lastMonthMPG = calcAvgMPGInRange(fuelLogs, lastMonth.start, lastMonth.end);
    if (thisMonthMPG > 0 && lastMonthMPG > 0 && thisMonthMPG < lastMonthMPG * MPG_DROP_THRESHOLD) {
      const dropPercent = Math.round((1 - thisMonthMPG / lastMonthMPG) * 100);
      const created = await createAlertIfNotDuplicate(
        vehicle.userId,
        "mpg_drop" satisfies AlertType,
        "MPG has dropped",
        `Your average MPG is down ${dropPercent}% this month (${thisMonthMPG.toFixed(1)} vs ${lastMonthMPG.toFixed(1)} last month)`,
        `/vehicles/${vehicle.id}/fuel`
      );
      if (created) alertsCreated++;
    }

    const thisMonthPrice = calcAvgPricePerGallonInRange(fuelLogs, thisMonth.start, thisMonth.end);
    const lastMonthPrice = calcAvgPricePerGallonInRange(fuelLogs, lastMonth.start, lastMonth.end);
    if (thisMonthPrice > 0 && lastMonthPrice > 0 && thisMonthPrice > lastMonthPrice * FUEL_PRICE_SPIKE_THRESHOLD) {
      const increasePercent = Math.round((thisMonthPrice / lastMonthPrice - 1) * 100);
      const created = await createAlertIfNotDuplicate(
        vehicle.userId,
        "fuel_price_spike" satisfies AlertType,
        "Fuel prices are up",
        `You're paying ${increasePercent}% more per gallon this month ($${thisMonthPrice.toFixed(2)} vs $${lastMonthPrice.toFixed(2)} last month)`,
        `/vehicles/${vehicle.id}/fuel`
      );
      if (created) alertsCreated++;
    }
  }

  return NextResponse.json({ success: true, recurringPosted, chitFundsPosted, alertsCreated, budgetsCreated });
}
