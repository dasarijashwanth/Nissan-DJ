import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";
import { getVehiclesForUser, createVehicle } from "@/lib/vehicleQueries";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const vehicles = await getVehiclesForUser(user.id);
  return NextResponse.json(vehicles);
}

type NewVehicleBody = {
  nickname?: string;
  make?: string;
  model?: string;
  year?: number | string;
  color?: string;
  licensePlate?: string | null;
  purchasePrice?: number | string | null;
  purchaseDate?: string | null;
  startOdometer?: number | string | null;
  insurance?: {
    provider?: string;
    monthlyCost?: number | string;
    startDate?: string;
    renewalDate?: string;
    coverageType?: string;
  };
};

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as NewVehicleBody;

  if (!body.nickname?.trim() || !body.make?.trim() || !body.model?.trim() || !body.year || !body.color?.trim()) {
    return NextResponse.json({ error: "Nickname, make, model, year, and color are required." }, { status: 400 });
  }

  const vehicle = await createVehicle(user.id, {
    nickname: body.nickname.trim(),
    make: body.make.trim(),
    model: body.model.trim(),
    year: Number(body.year),
    color: body.color.trim(),
    licensePlate: body.licensePlate?.trim() || null,
    purchasePrice: body.purchasePrice === null || body.purchasePrice === "" || body.purchasePrice === undefined ? null : Number(body.purchasePrice),
    purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : null,
    startOdometer: body.startOdometer === null || body.startOdometer === "" || body.startOdometer === undefined ? null : Number(body.startOdometer),
  });

  if (body.insurance?.provider?.trim() && body.insurance.monthlyCost && body.insurance.startDate && body.insurance.renewalDate) {
    await prisma.insurance.create({
      data: {
        vehicleId: vehicle.id,
        provider: body.insurance.provider.trim(),
        monthlyCost: Number(body.insurance.monthlyCost),
        startDate: new Date(body.insurance.startDate),
        renewalDate: new Date(body.insurance.renewalDate),
        coverageType: body.insurance.coverageType || "Liability",
      },
    });
  }

  return NextResponse.json(vehicle, { status: 201 });
}
