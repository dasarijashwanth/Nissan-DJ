import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareClient } from "@/lib/supabase";

const PUBLIC_ROUTES = ["/login", "/signup"];

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });
  const supabase = createMiddlewareClient(request, response);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublicRoute = PUBLIC_ROUTES.includes(request.nextUrl.pathname);

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Every /api route already does its own getAuthUser()/secret-based auth and returns a proper
  // 401 JSON response — routing it through this cookie-session redirect first breaks any
  // unauthenticated machine caller (e.g. Vercel Cron hitting /api/cron/process with a bearer
  // token, no session cookie), since it gets redirected to /login before its own check runs.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|serwist/|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
