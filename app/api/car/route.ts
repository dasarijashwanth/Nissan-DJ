import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";
import { getOrCreateCar } from "@/lib/carQueries";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const car = await getOrCreateCar(user.id);
  return NextResponse.json(car);
}

type CarUpdateBody = {
  make?: string;
  model?: string;
  year?: number | string;
  color?: string;
  licensePlate?: string | null;
  photoUrl?: string | null;
  purchasePrice?: number | string | null;
  purchaseDate?: string | null;
  startOdometer?: number | string | null;
};

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as CarUpdateBody;

  await getOrCreateCar(user.id);

  const car = await prisma.car.update({
    where: { userId: user.id },
    data: {
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

  return NextResponse.json({
    ...car,
    purchaseDate: car.purchaseDate?.toISOString() ?? null,
    createdAt: car.createdAt.toISOString(),
  });
}
