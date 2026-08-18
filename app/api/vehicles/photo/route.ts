import { NextResponse } from "next/server";
import { getAuthUser, getServiceRoleClient } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";
import { getVehicleById } from "@/lib/vehicleQueries";

const BUCKET = "car-photos";

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  // A vehicleId means "attach this photo to that vehicle now". Omitting it (the /vehicles/new
  // flow, before the vehicle row exists) just uploads and hands back a URL to save later.
  const vehicleId = formData.get("vehicleId");
  if (typeof vehicleId === "string" && vehicleId) {
    const vehicle = await getVehicleById(vehicleId);
    if (!vehicle || vehicle.userId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }

  const extension = file.type === "image/png" ? "png" : "jpg";
  const path = `${user.id}/${Date.now()}.${extension}`;

  const supabase = getServiceRoleClient();
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, await file.arrayBuffer(), { contentType: file.type, upsert: true });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);

  if (typeof vehicleId === "string" && vehicleId) {
    await prisma.vehicle.update({ where: { id: vehicleId }, data: { photoUrl: publicUrl } });
  }

  return NextResponse.json({ photoUrl: publicUrl });
}
