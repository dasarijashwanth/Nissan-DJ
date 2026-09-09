import { describe, it, expect } from "vitest";
import { getWeeklyStats } from "@/lib/vehicleAnalytics";
import type { FuelLog, OdometerLog } from "@/lib/types";

function odo(date: string, miles: number): OdometerLog {
  return { id: date, vehicleId: "v1", date, miles, notes: null, createdAt: date };
}

describe("getWeeklyStats week boundary", () => {
  const odometerLogs: OdometerLog[] = [
    odo("2026-08-24T00:00:00.000Z", 102945), // Monday
    odo("2026-08-28T00:00:00.000Z", 103394), // Friday
    odo("2026-08-29T00:00:00.000Z", 103591), // Saturday
  ];
  const fuelLogs: FuelLog[] = [];

  it("treats the week as Monday through Sunday night, not Sunday through Saturday", () => {
    // Sunday 2026-08-30 at 01:47 UTC-equivalent "now" — still within the Mon Aug24-Sun Aug30 week.
    const now = new Date("2026-08-30T01:47:00.000Z");
    const stats = getWeeklyStats(fuelLogs, [], [], odometerLogs, now, 98650);
    // Baseline before Monday Aug 24 is the last reading before it (none in this fixture -> startOdometer).
    expect(stats.milesThisWeek).toBe(103591 - 98650);
  });

  it("does not reset to zero at Sunday midnight UTC when it's still Saturday in effect", () => {
    // A Saturday-evening moment should NOT be treated as the start of a new (empty) week.
    const saturdayEvening = new Date("2026-08-29T23:00:00.000Z");
    const stats = getWeeklyStats(fuelLogs, [], [], odometerLogs, saturdayEvening, 98650);
    expect(stats.milesThisWeek).toBeGreaterThan(0);
  });

  it("starts a fresh week on Monday, not Sunday", () => {
    // Monday 2026-08-31 — a new week; nothing logged yet in it, so miles driven this week is 0.
    const monday = new Date("2026-08-31T12:00:00.000Z");
    const stats = getWeeklyStats(fuelLogs, [], [], odometerLogs, monday, 98650);
    expect(stats.milesThisWeek).toBe(0);
  });
});
