import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";
import { idSchema } from "@/lib/validation/common";

function privateResponse(response: NextResponse, noStore = true) {
  // Some adapters finish proxy redirects before applying next.config headers.
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (noStore) response.headers.set("Cache-Control", "private, no-store");
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
  // Reject malformed resource IDs before a loading boundary commits HTTP 200.
  // This only checks public URL syntax; all real resources still use DB guards.
  const resource = /^\/admin\/(orders|products|collections)\/([^/]+)(?:\/print)?\/?$/.exec(request.nextUrl.pathname);
  if ((request.method === "GET" || request.method === "HEAD") && resource && !(resource[2] === "new" && resource[1] !== "orders") && !idSchema.safeParse(resource[2]).success) {
    return privateResponse(NextResponse.rewrite(new URL("/404", request.url), { status: 404 }));
  }
  return privateResponse(NextResponse.next({ request: { headers } }), !(request.nextUrl.pathname === "/admin/login" && request.method === "GET"));
}
export const config = { matcher: ["/admin/:path*"] };
