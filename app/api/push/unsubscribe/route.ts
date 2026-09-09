import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase";
import { deleteSubscription } from "@/lib/pushQueries";

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { endpoint: string };
  if (!body.endpoint) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  await deleteSubscription(body.endpoint);
  return NextResponse.json({ success: true });
}
