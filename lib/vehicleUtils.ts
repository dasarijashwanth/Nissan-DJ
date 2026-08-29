import { monthRange } from "@/lib/utils";
import type { FuelLog, Insurance, MaintenanceLog, RepairLog } from "@/lib/types";

const DAY_MS = 24 * 60 * 60 * 1000;
const MONTH_MS = 30 * DAY_MS;

/** Miles per gallon for a single fill, given the odometer reading of the previous fill. */
export function calcFillMPG(
  currentOdometer: number,
  previousOdometer: number,
  gallons: number
): number {
  const miles = currentOdometer - previousOdometer;
  if (miles <= 0 || gallons <= 0) return 0;
  return miles / gallons;
}

export type FuelSegment = {
  log: FuelLog;
  /** null for the very first fill (no prior baseline) and for any partial fill that hasn't closed a segment yet. */
  mpg: number | null;
  miles: number;
  gallons: number;
};

/**
 * Walks per-fill fuel logs in odometer order (odometer only ever increases, so it's a reliable
 * sequence even when two fills share a calendar date) and closes an MPG segment only at a
 * full-tank fill. A partial top-off's gallons roll forward and get added to whichever full-tank
 * fill comes next, instead of forming their own artificially short, low-MPG segment. Weekly
 * summaries are excluded — they track mileage/cost directly, not via odometer deltas between fills.
 */
export function buildFuelSegments(fuelLogs: FuelLog[]): FuelSegment[] {
  const sorted = [...fuelLogs]
    .filter((l) => l.type === "per_fill")
    .sort((a, b) => a.odometer - b.odometer);

  const segments: FuelSegment[] = [];
  let baselineOdometer: number | null = null;
  let pendingGallons = 0;

  for (const log of sorted) {
    if (baselineOdometer === null) {
      baselineOdometer = log.odometer;
      segments.push({ log, mpg: null, miles: 0, gallons: 0 });
      continue;
    }

    pendingGallons += log.gallons;

    if (log.isFullTank) {
      const miles = log.odometer - baselineOdometer;
      const mpg = miles > 0 && pendingGallons > 0 ? miles / pendingGallons : null;
      segments.push({ log, mpg, miles: Math.max(miles, 0), gallons: pendingGallons });
      baselineOdometer = log.odometer;
      pendingGallons = 0;
    } else {
      segments.push({ log, mpg: null, miles: 0, gallons: 0 });
    }
  }

  return segments;
}

/**
 * Simple back-to-back MPG for every fill — (this fill's odometer - the previous fill's odometer)
 * / this fill's own gallons, with no full-tank merging. This is what the user explicitly asked
 * for on the "MPG per Fill-up" chart specifically (one bar per fill, including partial top-offs),
 * even knowing a partial fill can show a misleadingly low value for that one segment. Every other
 * MPG figure in the app (Avg/Best/Worst MPG, the efficiency insight, the weekly trend) keeps using
 * buildFuelSegments' full-tank-aware math — do not swap those to this.
 */
export function buildSimpleFuelSegments(fuelLogs: FuelLog[]): FuelSegment[] {
  const sorted = [...fuelLogs]
    .filter((l) => l.type === "per_fill")
    .sort((a, b) => a.odometer - b.odometer);

  return sorted.map((log, i) => {
    if (i === 0) return { log, mpg: null, miles: 0, gallons: 0 };

    const miles = log.odometer - sorted[i - 1].odometer;
    const mpg = miles > 0 && log.gallons > 0 ? miles / log.gallons : null;
    return { log, mpg, miles: Math.max(miles, 0), gallons: log.gallons };
  });
}

/** Average MPG across all completed full-tank segments: total miles / total gallons. */
export function calcAvgMPG(fuelLogs: FuelLog[]): number {
  const segments = buildFuelSegments(fuelLogs);
  let milesSum = 0;
  let gallonsSum = 0;

  for (const s of segments) {
    if (s.mpg == null) continue;
    milesSum += s.miles;
    gallonsSum += s.gallons;
  }

  return gallonsSum > 0 ? milesSum / gallonsSum : 0;
}

export type FuelEfficiencyInsight = {
  latestMPG: number | null;
  avgMPG: number | null;
  deltaPercent: number | null;
};

/**
 * Compares the most recent fill's MPG against the average of every fill *before* it, for the "how
 * am I doing" prompt shown right after logging fuel. Deliberately excludes the latest fill from
 * that average — comparing a fill against a number that already includes itself mutes the delta
 * and makes it mathematically impossible to differ at exactly 2 logs. avgMPG is null until there's
 * at least one prior MPG data point to average (i.e. at least 3 total fills).
 */
export function getFuelEfficiencyInsight(fuelLogs: FuelLog[]): FuelEfficiencyInsight {
  const completed = buildFuelSegments(fuelLogs).filter((s) => s.mpg != null);

  if (completed.length === 0) {
    return { latestMPG: null, avgMPG: null, deltaPercent: null };
  }

  const latest = completed[completed.length - 1];
  const latestMPG = latest.mpg;

  const prior = completed.slice(0, -1);
  const priorGallons = prior.reduce((sum, s) => sum + s.gallons, 0);
  const priorMiles = prior.reduce((sum, s) => sum + s.miles, 0);
  const avgMPG = priorGallons > 0 ? priorMiles / priorGallons : null;

  const deltaPercent = latestMPG != null && avgMPG != null ? ((latestMPG - avgMPG) / avgMPG) * 100 : null;

  return { latestMPG, avgMPG, deltaPercent };
}

export function calcCostPerMile(
  totalSpend: number,
  startOdometer: number,
  currentOdometer: number
): number {
  const miles = currentOdometer - startOdometer;
  return miles > 0 ? totalSpend / miles : 0;
}

/** Insurance has no per-entry cost, only a recurring monthlyCost — prorate by elapsed months. */
function calcInsuranceSpend(policy: Insurance, asOf: Date): number {
  const start = new Date(policy.startDate);
  const end = new Date(policy.renewalDate) < asOf ? new Date(policy.renewalDate) : asOf;
  if (end <= start) return 0;
  const months = (end.getTime() - start.getTime()) / MONTH_MS;
  return months * policy.monthlyCost;
}

export function calcTotalVehicleSpend(
  fuelLogs: FuelLog[],
  maintenanceLogs: MaintenanceLog[],
  repairLogs: RepairLog[],
  insuranceLogs: Insurance[]
): number {
  const now = new Date();
  const fuelTotal = fuelLogs.reduce((sum, l) => sum + l.totalCost, 0);
  const maintenanceTotal = maintenanceLogs.reduce((sum, l) => sum + l.cost, 0);
  const repairTotal = repairLogs.reduce((sum, l) => sum + l.cost, 0);
  const insuranceTotal = insuranceLogs.reduce((sum, l) => sum + calcInsuranceSpend(l, now), 0);
  return fuelTotal + maintenanceTotal + repairTotal + insuranceTotal;
}

export function calcMonthVehicleCost(
  fuelLogs: FuelLog[],
  maintenanceLogs: MaintenanceLog[],
  repairLogs: RepairLog[],
  insuranceLogs: Insurance[],
  month: Date
): number {
  const { start, end } = monthRange(month.getUTCFullYear(), month.getUTCMonth());
  const inMonth = (date: string) => {
    const d = new Date(date);
    return d >= start && d < end;
  };

  const fuelTotal = fuelLogs.filter((l) => inMonth(l.date)).reduce((sum, l) => sum + l.totalCost, 0);
  const maintenanceTotal = maintenanceLogs
    .filter((l) => inMonth(l.date))
    .reduce((sum, l) => sum + l.cost, 0);
  const repairTotal = repairLogs.filter((l) => inMonth(l.date)).reduce((sum, l) => sum + l.cost, 0);
  const insuranceTotal = insuranceLogs
    .filter((p) => new Date(p.startDate) < end && new Date(p.renewalDate) >= start)
    .reduce((sum, p) => sum + p.monthlyCost, 0);

  return fuelTotal + maintenanceTotal + repairTotal + insuranceTotal;
}

export function isMaintenanceDueSoon(log: MaintenanceLog, currentOdometer: number): boolean {
  const dueByDate = log.nextDueDate
    ? new Date(log.nextDueDate).getTime() <= Date.now() + 30 * DAY_MS
    : false;
  const dueByMiles = log.nextDueMiles != null ? currentOdometer >= log.nextDueMiles - 500 : false;
  return dueByDate || dueByMiles;
}

export function isInsuranceRenewalSoon(policy: Insurance): boolean {
  return new Date(policy.renewalDate).getTime() <= Date.now() + 30 * DAY_MS;
}

export function daysUntil(date: string): number {
  return Math.ceil((new Date(date).getTime() - Date.now()) / DAY_MS);
}

/** Most recent maintenance log of a given type — older due-date/due-mileage fields for that type are stale. */
export function findLatestMaintenanceByType(logs: MaintenanceLog[], type: string): MaintenanceLog | null {
  const matches = logs
    .filter((l) => l.type === type)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return matches[0] ?? null;
}

/** Same full-tank-segment math as calcAvgMPG, but only counting segments whose closing (full-tank) fill landed in [start, end) — the odometer baseline still comes from each segment's actual previous full tank, even if that prior fill was outside the range. */
export function calcAvgMPGInRange(fuelLogs: FuelLog[], start: Date, end: Date): number {
  let milesSum = 0;
  let gallonsSum = 0;

  for (const s of buildFuelSegments(fuelLogs)) {
    if (s.mpg == null) continue;
    const fillDate = new Date(s.log.date);
    if (fillDate < start || fillDate >= end) continue;
    milesSum += s.miles;
    gallonsSum += s.gallons;
  }

  return gallonsSum > 0 ? milesSum / gallonsSum : 0;
}

export function calcAvgPricePerGallonInRange(fuelLogs: FuelLog[], start: Date, end: Date): number {
  const inRange = fuelLogs.filter((l) => {
    const d = new Date(l.date);
    return d >= start && d < end;
  });
  if (inRange.length === 0) return 0;
  return inRange.reduce((sum, l) => sum + l.pricePerGallon, 0) / inRange.length;
}
