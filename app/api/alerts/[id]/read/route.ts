import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";
import { isAlertOwnedBy } from "@/lib/alertQueries";

export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!(await isAlertOwnedBy(id, user.id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const alert = await prisma.alert.update({ where: { id }, data: { isRead: true } });
  return NextResponse.json(alert);
}
