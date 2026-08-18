import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";
import { getAlerts } from "@/lib/alertQueries";

export async function GET(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? undefined;

  const alerts = await getAlerts(user.id, type);
  return NextResponse.json(alerts);
}

/** Bulk "mark all as read". */
export async function PATCH() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.alert.updateMany({ where: { userId: user.id, isRead: false }, data: { isRead: true } });
  return NextResponse.json({ success: true });
}
