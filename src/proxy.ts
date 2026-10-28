import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set("x-admin-path", request.nextUrl.pathname);
  if (request.nextUrl.pathname !== "/admin/login" && !request.headers.has("next-action") && !getSessionCookie(request)) {
    const url = new URL("/admin/login", request.url);
    url.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(url);
  }
  return NextResponse.next({ request: { headers } });
}
export const config = { matcher: ["/admin/:path*"] };
