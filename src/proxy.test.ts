import { afterEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
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

it("returns a private 404 for malformed IDs before streaming without intercepting valid routes or actions", () => {
  vi.mocked(getSessionCookie).mockReturnValue("test-session");
  for (const path of ["/admin/orders/not-a-uuid", "/admin/orders/not-a-uuid/print", "/admin/products/bad", "/admin/collections/bad"]) {
    const response = proxy(new NextRequest(`https://shop.example.com${path}`));
    expect(response.status).toBe(404);
    expect(new URL(response.headers.get("x-middleware-rewrite")!).pathname).toBe("/404");
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  }
  for (const path of ["/admin/products/new", "/admin/collections/new", "/admin/orders/11111111-1111-4111-8111-111111111111"]) {
    expect(proxy(new NextRequest(`https://shop.example.com${path}`)).headers.get("x-middleware-rewrite")).toBeNull();
  }
  expect(proxy(new NextRequest("https://shop.example.com/admin/orders/bad", { method: "POST", headers: { "next-action": "test" } })).headers.get("x-middleware-rewrite")).toBeNull();
});
