import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";
import { getVehicleById, serializeVehicle, setPrimaryVehicle } from "@/lib/vehicleQueries";

export async function GET(_request: Request, { params }: { params: Promise<{ vehicleId: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { vehicleId } = await params;
  const vehicle = await getVehicleById(vehicleId);
  if (!vehicle || vehicle.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(vehicle);
}

type VehicleUpdateBody = {
  nickname?: string;
  make?: string;
  model?: string;
  year?: number | string;
  color?: string;
  licensePlate?: string | null;
  photoUrl?: string | null;
  purchasePrice?: number | string | null;
  purchaseDate?: string | null;
  startOdometer?: number | string | null;
  isPrimary?: boolean;
};

export async function PUT(request: Request, { params }: { params: Promise<{ vehicleId: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { vehicleId } = await params;
  const existing = await getVehicleById(vehicleId);
  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await request.json()) as VehicleUpdateBody;

  if (body.isPrimary) {
    await setPrimaryVehicle(user.id, vehicleId);
  }

  const vehicle = await prisma.vehicle.update({
    where: { id: vehicleId },
    data: {
      ...(body.nickname !== undefined ? { nickname: body.nickname } : {}),
      ...(body.make !== undefined ? { make: body.make } : {}),
      ...(body.model !== undefined ? { model: body.model } : {}),
      ...(body.year !== undefined ? { year: Number(body.year) } : {}),
      ...(body.color !== undefined ? { color: body.color } : {}),
      ...(body.licensePlate !== undefined ? { licensePlate: body.licensePlate || null } : {}),
      ...(body.photoUrl !== undefined ? { photoUrl: body.photoUrl || null } : {}),
      ...(body.purchasePrice !== undefined
        ? { purchasePrice: body.purchasePrice === null || body.purchasePrice === "" ? null : Number(body.purchasePrice) }
        : {}),
      ...(body.purchaseDate !== undefined
        ? { purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : null }
        : {}),
      ...(body.startOdometer !== undefined
        ? { startOdometer: body.startOdometer === null || body.startOdometer === "" ? null : Number(body.startOdometer) }
        : {}),
    },
  });

  return NextResponse.json(serializeVehicle(vehicle));
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ vehicleId: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { vehicleId } = await params;
  const existing = await getVehicleById(vehicleId);
  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.vehicle.update({ where: { id: vehicleId }, data: { isActive: false, isPrimary: false } });

  if (existing.isPrimary) {
    const next = await prisma.vehicle.findFirst({
      where: { userId: user.id, isActive: true },
      orderBy: { createdAt: "asc" },
    });
    if (next) {
      await prisma.vehicle.update({ where: { id: next.id }, data: { isPrimary: true } });
    }
  }

  return NextResponse.json({ success: true });
}
