import { toNextJsHandler } from "better-auth/next-js";
import { getAuth } from "@/server/auth/auth";

// Administrative mutations must use our guarded actions and their invariants.
async function handle(request: Request) {
  const path = new URL(request.url).pathname;
  if (!(request.method === "GET" && path === "/api/auth/get-session")) {
    return Response.json({ ok: false, error: { code: "FORBIDDEN", message: "Thao tác này không được phép." } }, { status: 403 });
  }
  return toNextJsHandler(getAuth()).GET(request);
}
export const GET = handle;
export const POST = handle;
