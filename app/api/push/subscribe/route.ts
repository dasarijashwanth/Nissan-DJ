import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase";
import { saveSubscription } from "@/lib/pushQueries";

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { endpoint: string; keys: { p256dh: string; auth: string } };
  if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }

  await saveSubscription(user.id, body);
  return NextResponse.json({ success: true });
}
