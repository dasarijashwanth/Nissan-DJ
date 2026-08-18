import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase";
import { getUserPreferences, updateUserPreferences } from "@/lib/preferencesQueries";
import type { UserPreferences } from "@/lib/types";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(await getUserPreferences(user.id));
}

export async function PUT(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as Partial<UserPreferences>;
  const preferences = await updateUserPreferences(user.id, body);
  return NextResponse.json(preferences);
}
