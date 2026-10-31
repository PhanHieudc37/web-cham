import { afterEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "./proxy";

vi.mock("better-auth/cookies", () => ({ getSessionCookie: vi.fn(() => null) }));
afterEach(() => vi.restoreAllMocks());

it("keeps private security headers on admin redirects even when an adapter skips config headers", () => {
  const response = proxy(new NextRequest("https://shop.example.com/admin/orders?q=CS123"));
  expect(response.status).toBe(307);
  const location = new URL(response.headers.get("location")!);
  expect(location.pathname).toBe("/admin/login");
  expect(location.searchParams.get("next")).toBe("/admin/orders?q=CS123");
  expect(response.headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
  expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
  expect(response.headers.get("X-Frame-Options")).toBe("DENY");
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
});

it("forwards Server Actions to their own permission checks and keeps admin context and private headers", () => {
  const response = proxy(new NextRequest("https://shop.example.com/admin/orders", { headers: { "next-action": "test-action" } }));
  expect(response.headers.get("location")).toBeNull();
  expect(response.headers.get("x-middleware-request-x-admin-path")).toBe("/admin/orders");
  expect(response.headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
});
