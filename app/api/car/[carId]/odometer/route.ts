import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";
import { isCarOwnedBy, getOdometerLogs } from "@/lib/carQueries";
import { validateOdometerLog, type OdometerFormValues } from "@/lib/carValidation";

export async function GET(_request: Request, { params }: { params: Promise<{ carId: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { carId } = await params;
  if (!(await isCarOwnedBy(carId, user.id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(await getOdometerLogs(carId));
}

export async function POST(request: Request, { params }: { params: Promise<{ carId: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { carId } = await params;
  if (!(await isCarOwnedBy(carId, user.id))) {
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
      carId,
      date: new Date(values.date),
      miles: Number(values.miles),
      notes: values.notes.trim() || null,
    },
  });

  return NextResponse.json(log, { status: 201 });
}
