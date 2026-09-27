import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";

/** Google (or any future OAuth provider) redirects here with a one-time code after consent. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Mirror into our own User table, same as the email/password signup path — a Google
      // sign-in never goes through signup(), so this is the only place a first-time Google
      // user's row gets created for Transaction/Vehicle etc. to reference.
      await prisma.user.upsert({
        where: { id: data.user.id },
        update: { email: data.user.email! },
        create: { id: data.user.id, email: data.user.email! },
      });

      return NextResponse.redirect(`${origin}/`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("Google sign-in failed. Please try again.")}`);
}
