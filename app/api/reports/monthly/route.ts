import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase";
import { getMonthlyReport } from "@/lib/reportQueries";

export async function GET(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const now = new Date();
  const month = Number(searchParams.get("month")) || now.getUTCMonth() + 1;
  const year = Number(searchParams.get("year")) || now.getUTCFullYear();

  const report = await getMonthlyReport(user.id, month, year);
  return NextResponse.json(report);
}
