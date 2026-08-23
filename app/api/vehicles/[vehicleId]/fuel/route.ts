import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";
import { isVehicleOwnedBy, getFuelLogs, createVehicleTransaction } from "@/lib/vehicleQueries";
import {
  validateFuelLog,
  validateWeeklyFuelLog,
  type FuelLogFormValues,
  type WeeklyFuelFormValues,
} from "@/lib/vehicleValidation";

const FALLBACK_PRICE_PER_GALLON = 3.5;

/** Weekly summaries don't ask for gallons directly, so estimate them from recent per-fill prices. */
async function getReferencePricePerGallon(vehicleId: string): Promise<number> {
  const recent = await prisma.fuelLog.findMany({
    where: { vehicleId, type: "per_fill" },
    orderBy: { date: "desc" },
    take: 5,
  });
  if (recent.length === 0) return FALLBACK_PRICE_PER_GALLON;
  return recent.reduce((sum, l) => sum + l.pricePerGallon, 0) / recent.length;
}

export async function GET(_request: Request, { params }: { params: Promise<{ vehicleId: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { vehicleId } = await params;
  if (!(await isVehicleOwnedBy(vehicleId, user.id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(await getFuelLogs(vehicleId));
}

export async function POST(request: Request, { params }: { params: Promise<{ vehicleId: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { vehicleId } = await params;
  if (!(await isVehicleOwnedBy(vehicleId, user.id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await request.json()) as { type?: string } & Partial<FuelLogFormValues> & Partial<WeeklyFuelFormValues>;

  if (body.type === "weekly_summary") {
    const values: WeeklyFuelFormValues = {
      weekStart: body.weekStart ?? "",
      weekEnd: body.weekEnd ?? "",
      totalCost: body.totalCost ?? "",
      startOdometer: body.startOdometer ?? "",
      endOdometer: body.endOdometer ?? "",
      milesDriven: body.milesDriven ?? "",
      fillUpCount: body.fillUpCount ?? "",
      notes: body.notes ?? "",
    };

    const { valid, errors } = validateWeeklyFuelLog(values);
    if (!valid) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    const date = new Date(values.weekEnd);
    const totalCost = Number(values.totalCost);
    const pricePerGallon = await getReferencePricePerGallon(vehicleId);
    const gallons = pricePerGallon > 0 ? totalCost / pricePerGallon : 0;

    const noteParts = [
      `Weekly summary (${values.weekStart} to ${values.weekEnd})`,
      values.fillUpCount ? `${values.fillUpCount} fill-up${Number(values.fillUpCount) === 1 ? "" : "s"}` : null,
      values.notes.trim() || null,
    ].filter(Boolean);

    const log = await prisma.fuelLog.create({
      data: {
        vehicleId,
        date,
        gallons,
        pricePerGallon,
        totalCost,
        odometer: Number(values.endOdometer),
        station: null,
        notes: noteParts.join(" — "),
        type: "weekly_summary",
      },
    });

    await createVehicleTransaction(user.id, "fuel", `Fuel — week of ${values.weekStart}`, totalCost, date);

    return NextResponse.json(log, { status: 201 });
  }

  const values: FuelLogFormValues = {
    date: body.date ?? "",
    station: body.station ?? "",
    gallons: body.gallons ?? "",
    pricePerGallon: body.pricePerGallon ?? "",
    totalCost: body.totalCost ?? "",
    odometer: body.odometer ?? "",
    notes: body.notes ?? "",
    isFullTank: body.isFullTank ?? true,
  };

  const { valid, errors } = validateFuelLog(values);
  if (!valid) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  const date = new Date(values.date);
  const totalCost = Number(values.totalCost);

  const log = await prisma.fuelLog.create({
    data: {
      vehicleId,
      date,
      gallons: Number(values.gallons),
      pricePerGallon: Number(values.pricePerGallon),
      totalCost,
      odometer: Number(values.odometer),
      station: values.station.trim() || null,
      notes: values.notes.trim() || null,
      type: "per_fill",
      isFullTank: values.isFullTank,
    },
  });

  await createVehicleTransaction(
    user.id,
    "fuel",
    values.station.trim() ? `Fuel at ${values.station.trim()}` : "Fuel fill-up",
    totalCost,
    date
  );

  return NextResponse.json(log, { status: 201 });
}
