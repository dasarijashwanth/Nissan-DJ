import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";
import { isVehicleOwnedBy } from "@/lib/vehicleQueries";
import { validateFuelLog, type FuelLogFormValues } from "@/lib/vehicleValidation";

export async function PUT(request: Request, { params }: { params: Promise<{ vehicleId: string; fuelLogId: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { vehicleId, fuelLogId } = await params;
  if (!(await isVehicleOwnedBy(vehicleId, user.id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const existing = await prisma.fuelLog.findUnique({ where: { id: fuelLogId } });
  if (!existing || existing.vehicleId !== vehicleId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await request.json()) as Partial<FuelLogFormValues>;
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

  // Editing always uses the per-fill-shaped fields (they cover every column a FuelLog has), but
  // the row's original `type` — per_fill vs weekly_summary — is left untouched, since this isn't
  // meant to reclassify a weekly summary into a per-fill entry or vice versa.
  const log = await prisma.fuelLog.update({
    where: { id: fuelLogId },
    data: {
      date: new Date(values.date),
      gallons: Number(values.gallons),
      pricePerGallon: Number(values.pricePerGallon),
      totalCost: Number(values.totalCost),
      odometer: Number(values.odometer),
      station: values.station.trim() || null,
      notes: values.notes.trim() || null,
      isFullTank: values.isFullTank,
    },
  });

  return NextResponse.json(log);
}
