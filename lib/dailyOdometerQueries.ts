import { prisma } from "@/lib/prisma";
import { getCurrentOdometer } from "@/lib/vehicleQueries";
import type { DailyOdometer } from "@/lib/types";

function toDateOnlyString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function serializeEntry(entry: {
  id: string;
  vehicleId: string;
  date: Date;
  miles: number;
  driven: number;
  notes: string | null;
  createdAt: Date;
}): DailyOdometer {
  return {
    ...entry,
    date: toDateOnlyString(entry.date),
    createdAt: entry.createdAt.toISOString(),
  };
}

export async function getDailyOdometerEntries(vehicleId: string, from: Date, to: Date): Promise<DailyOdometer[]> {
  const entries = await prisma.dailyOdometer.findMany({
    where: { vehicleId, date: { gte: from, lte: to } },
    orderBy: { date: "asc" },
  });
  return entries.map(serializeEntry);
}

/** The reading a new entry's `driven` is measured against: the most recent prior daily log, or the vehicle's overall current odometer if this would be its first ever. */
async function getBaselineOdometer(vehicleId: string, beforeDate: Date): Promise<number> {
  const previous = await prisma.dailyOdometer.findFirst({
    where: { vehicleId, date: { lt: beforeDate } },
    orderBy: { date: "desc" },
  });
  if (previous) return previous.miles;
  return getCurrentOdometer(vehicleId);
}

export async function upsertDailyOdometer(
  vehicleId: string,
  date: Date,
  miles: number,
  notes: string | null
): Promise<DailyOdometer> {
  const baseline = await getBaselineOdometer(vehicleId, date);
  const driven = Math.max(0, miles - baseline);

  const entry = await prisma.dailyOdometer.upsert({
    where: { vehicleId_date: { vehicleId, date } },
    update: { miles, driven, notes },
    create: { vehicleId, date, miles, driven, notes },
  });

  return serializeEntry(entry);
}

export type DailyOdometerStats = {
  currentOdometer: number;
  todayMiles: number;
  weekMiles: number;
  monthMiles: number;
  avgMilesPerDay: number;
  maxDay: { date: string; driven: number } | null;
  minDay: { date: string; driven: number } | null;
  currentStreak: number;
  todayLogged: boolean;
  missingDays: string[];
};

function calculateStreak(loggedDates: Set<string>, today: Date): number {
  const cursor = new Date(today);
  if (!loggedDates.has(toDateOnlyString(cursor))) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  let streak = 0;
  while (loggedDates.has(toDateOnlyString(cursor))) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

export async function getDailyOdometerStats(vehicleId: string, today: Date): Promise<DailyOdometerStats> {
  const windowStart = new Date(today);
  windowStart.setUTCDate(windowStart.getUTCDate() - 29);

  const entries = await getDailyOdometerEntries(vehicleId, windowStart, today);
  const byDate = new Map(entries.map((e) => [e.date, e]));
  const todayStr = toDateOnlyString(today);

  const weekStartStr = (() => {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - 6);
    return toDateOnlyString(d);
  })();

  let weekMiles = 0;
  let monthMiles = 0;
  let maxDay: { date: string; driven: number } | null = null;
  let minDay: { date: string; driven: number } | null = null;

  for (const entry of entries) {
    monthMiles += entry.driven;
    if (entry.date >= weekStartStr) weekMiles += entry.driven;
    if (!maxDay || entry.driven > maxDay.driven) maxDay = { date: entry.date, driven: entry.driven };
    if (!minDay || entry.driven < minDay.driven) minDay = { date: entry.date, driven: entry.driven };
  }

  // A day only counts as "missed" if it falls on or after the first day this vehicle was ever
  // logged — otherwise a brand-new vehicle with zero history would show a week of false misses.
  const earliestLoggedDate = entries[0]?.date;
  const missingDays: string[] = [];
  if (earliestLoggedDate) {
    for (let i = 1; i <= 7; i++) {
      const d = new Date(today);
      d.setUTCDate(d.getUTCDate() - i);
      const dStr = toDateOnlyString(d);
      if (dStr >= earliestLoggedDate && !byDate.has(dStr)) missingDays.push(dStr);
    }
  }

  return {
    currentOdometer: await getCurrentOdometer(vehicleId),
    todayMiles: byDate.get(todayStr)?.driven ?? 0,
    weekMiles,
    monthMiles,
    avgMilesPerDay: entries.length > 0 ? monthMiles / entries.length : 0,
    maxDay,
    minDay,
    currentStreak: calculateStreak(new Set(byDate.keys()), today),
    todayLogged: byDate.has(todayStr),
    missingDays,
  };
}
