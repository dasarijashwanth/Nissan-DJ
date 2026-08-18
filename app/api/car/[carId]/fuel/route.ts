import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";
import { isCarOwnedBy, getFuelLogs, createCarTransaction } from "@/lib/carQueries";
import { validateFuelLog, type FuelLogFormValues } from "@/lib/carValidation";

export async function GET(_request: Request, { params }: { params: Promise<{ carId: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { carId } = await params;
  if (!(await isCarOwnedBy(carId, user.id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(await getFuelLogs(carId));
}

export async function POST(request: Request, { params }: { params: Promise<{ carId: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { carId } = await params;
  if (!(await isCarOwnedBy(carId, user.id))) {
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
  };

  const { valid, errors } = validateFuelLog(values);
  if (!valid) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  const date = new Date(values.date);
  const totalCost = Number(values.totalCost);

  const log = await prisma.fuelLog.create({
    data: {
      carId,
      date,
      gallons: Number(values.gallons),
      pricePerGallon: Number(values.pricePerGallon),
      totalCost,
      odometer: Number(values.odometer),
      station: values.station.trim() || null,
      notes: values.notes.trim() || null,
    },
  });

  await createCarTransaction(
    user.id,
    "fuel",
    values.station.trim() ? `Fuel at ${values.station.trim()}` : "Fuel fill-up",
    totalCost,
    date
  );

  return NextResponse.json(log, { status: 201 });
}
