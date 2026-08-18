import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";
import { isVehicleOwnedBy, getOdometerLogs } from "@/lib/vehicleQueries";
import { validateOdometerLog, type OdometerFormValues } from "@/lib/vehicleValidation";

export async function GET(_request: Request, { params }: { params: Promise<{ vehicleId: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { vehicleId } = await params;
  if (!(await isVehicleOwnedBy(vehicleId, user.id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(await getOdometerLogs(vehicleId));
}

export async function POST(request: Request, { params }: { params: Promise<{ vehicleId: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { vehicleId } = await params;
  if (!(await isVehicleOwnedBy(vehicleId, user.id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await request.json()) as Partial<OdometerFormValues>;
  const values: OdometerFormValues = {
    date: body.date ?? "",
    miles: body.miles ?? "",
    notes: body.notes ?? "",
  };

  const { valid, errors } = validateOdometerLog(values);
  if (!valid) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  const log = await prisma.odometerLog.create({
    data: {
      vehicleId,
      date: new Date(values.date),
      miles: Number(values.miles),
      notes: values.notes.trim() || null,
    },
  });

  return NextResponse.json(log, { status: 201 });
}
