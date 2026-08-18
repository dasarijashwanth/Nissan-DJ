import { NextResponse } from "next/server";
import { getAuthUser, getServiceRoleClient } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";
import { getOrCreateCar } from "@/lib/carQueries";

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

  await getOrCreateCar(user.id);

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

  await prisma.car.update({ where: { userId: user.id }, data: { photoUrl: publicUrl } });

  return NextResponse.json({ photoUrl: publicUrl });
}
