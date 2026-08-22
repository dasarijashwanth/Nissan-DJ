import { cookies } from "next/headers";

// The exact four categories createVehicleTransaction() (lib/vehicleQueries.ts) mirrors car-cost
// logs into — fuel/maintenance/repair/insurance entries always land in one of these, whether
// created from a vehicle log or typed in directly.
export const VEHICLE_CATEGORIES = ["Fuel", "Insurance", "Maintenance", "Repair"] as const;

export type TrackingMode = "life" | "vehicle";

const COOKIE_NAME = "trackingMode";

export async function getTrackingMode(): Promise<TrackingMode> {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value === "vehicle" ? "vehicle" : "life";
}

/** A Prisma `category` where-fragment scoping a query to one side of the vehicle/life split. */
export function categoryWhereForMode(mode: TrackingMode) {
  return mode === "vehicle"
    ? { category: { in: [...VEHICLE_CATEGORIES] } }
    : { category: { notIn: [...VEHICLE_CATEGORIES] } };
}

/**
 * Transaction rows carry an explicit `scope` ("life" | "vehicle") set at creation time instead of
 * being inferred from category — category-based inference mis-buckets things like ride-share
 * income or a car purchase logged under "Other". This is the where-fragment for that field.
 */
export function scopeWhereForMode(mode: TrackingMode) {
  return { scope: mode };
}
