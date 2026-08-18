import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";

/** Danger zone: delete every Transaction for this user (does not touch car logs, budgets, etc). */
export async function DELETE() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { count } = await prisma.transaction.deleteMany({ where: { userId: user.id } });
  return NextResponse.json({ success: true, deleted: count });
}
