import { describe, it, expect } from "vitest";
import { buildFuelSegments, buildOpeningFillSegments, calcAvgMPG } from "@/lib/vehicleUtils";
import type { FuelLog } from "@/lib/types";

// Real fill-up history from this app's production data (vehicle 17702cb0...), used throughout
// the session to verify both MPG conventions. Aug 26 is a genuine partial (not-to-full) top-off.
function makeLog(overrides: Partial<FuelLog>): FuelLog {
  return {
    id: "id",
    vehicleId: "v1",
    date: "2026-01-01T00:00:00.000Z",
    gallons: 10,
    pricePerGallon: 3.5,
    totalCost: 35,
    odometer: 0,
    station: null,
    notes: null,
    type: "per_fill",
    isFullTank: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

const FILLS: FuelLog[] = [
  makeLog({ id: "aug18", date: "2026-08-18T00:00:00.000Z", odometer: 102280, gallons: 10.21, isFullTank: true }),
  makeLog({ id: "aug20", date: "2026-08-20T00:00:00.000Z", odometer: 102511, gallons: 10.442, isFullTank: true }),
  makeLog({ id: "aug23", date: "2026-08-23T00:00:00.000Z", odometer: 102794, gallons: 11.494, isFullTank: true }),
  makeLog({ id: "aug26", date: "2026-08-26T00:00:00.000Z", odometer: 103114, gallons: 6.857, isFullTank: false }),
  makeLog({ id: "aug28", date: "2026-08-28T00:00:00.000Z", odometer: 103326, gallons: 10.672, isFullTank: true }),
];

describe("buildFuelSegments (full-tank-aware — chart + Avg/Best/Worst MPG)", () => {
  it("gives the first fill no MPG (no prior baseline)", () => {
    const segments = buildFuelSegments(FILLS);
    expect(segments[0].log.id).toBe("aug18");
    expect(segments[0].mpg).toBeNull();
  });

  it("computes plain segment MPG between two consecutive full-tank fills", () => {
    const segments = buildFuelSegments(FILLS);
    const aug20 = segments.find((s) => s.log.id === "aug20")!;
    expect(aug20.mpg).toBeCloseTo(231 / 10.442, 2);
  });

  it("rolls a partial fill's gallons forward instead of giving it its own segment", () => {
    const segments = buildFuelSegments(FILLS);
    const aug26 = segments.find((s) => s.log.id === "aug26")!;
    expect(aug26.mpg).toBeNull();
  });

  it("merges the partial fill's gallons into the next full-tank close, matching hand-verified math", () => {
    const segments = buildFuelSegments(FILLS);
    const aug28 = segments.find((s) => s.log.id === "aug28")!;
    // Aug 23 -> Aug 28: 532 miles on 6.857 + 10.672 = 17.529 gallons combined.
    expect(aug28.miles).toBe(532);
    expect(aug28.gallons).toBeCloseTo(17.529, 3);
    expect(aug28.mpg).toBeCloseTo(532 / 17.529, 2);
  });

  it("never produces the skewed per-fill values a naive split would (46.7 / 19.9)", () => {
    const segments = buildFuelSegments(FILLS);
    const mpgs = segments.map((s) => s.mpg).filter((m): m is number => m != null);
    for (const mpg of mpgs) {
      expect(mpg).toBeLessThan(40);
      expect(mpg).toBeGreaterThan(15);
    }
  });
});

describe("calcAvgMPG", () => {
  it("weights by total miles / total gallons across all closed segments", () => {
    const totalMiles = 231 + 283 + 532; // aug18->20, aug20->23, aug23->28 (partial rolled in)
    const totalGallons = 10.442 + 11.494 + 6.857 + 10.672;
    expect(calcAvgMPG(FILLS)).toBeCloseTo(totalMiles / totalGallons, 2);
  });
});

describe("buildOpeningFillSegments (per-row MPG for the Odometer table)", () => {
  it("pairs each fill's own gallons with the distance to the NEXT fill, shown on the opening row", () => {
    const segments = buildOpeningFillSegments(FILLS);
    const byId = new Map(segments.map((s) => [s.log.id, s]));

    // Exact numbers hand-verified against real data and confirmed by the user.
    expect(byId.get("aug18")!.mpg).toBeCloseTo(231 / 10.21, 2);
    expect(byId.get("aug20")!.mpg).toBeCloseTo(283 / 10.442, 2);
    expect(byId.get("aug23")!.mpg).toBeCloseTo(320 / 11.494, 2);
  });

  it("still computes a value for a partial opening fill, using only its own gallons", () => {
    const segments = buildOpeningFillSegments(FILLS);
    const aug26 = segments.find((s) => s.log.id === "aug26")!;
    expect(aug26.mpg).toBeCloseTo(212 / 6.857, 2);
  });

  it("gives the most recent fill no MPG yet (no next reading to measure against)", () => {
    const segments = buildOpeningFillSegments(FILLS);
    const aug28 = segments.find((s) => s.log.id === "aug28")!;
    expect(aug28.mpg).toBeNull();
  });
});
