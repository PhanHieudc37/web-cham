import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

function privateResponse(response: NextResponse) {
  // Some adapters finish proxy redirects before applying next.config headers.
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set("x-admin-path", request.nextUrl.pathname);
  if (request.nextUrl.pathname !== "/admin/login" && !request.headers.has("next-action") && !getSessionCookie(request)) {
    const url = new URL("/admin/login", request.url);
    url.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return privateResponse(NextResponse.redirect(url));
  }
  return privateResponse(NextResponse.next({ request: { headers } }));
}
export const config = { matcher: ["/admin/:path*"] };
