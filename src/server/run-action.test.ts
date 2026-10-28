import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { AppError } from "./errors";
import { runAction } from "./run-action";

afterEach(() => vi.restoreAllMocks());
describe("action error boundary", () => {
  it("returns typed success data", async () => expect(await runAction(async () => ({ id: "test-id" }))).toEqual({ ok: true, data: { id: "test-id" } }));
  it("returns validation fields and structured business errors", async () => {
    const validation = await runAction(async () => z.object({ name: z.string().min(2, "Vui lòng nhập họ tên") }).parse({ name: "" }));
    expect(validation).toMatchObject({ ok: false, error: { code: "VALIDATION_ERROR", fields: { name: "Vui lòng nhập họ tên" } } });
    expect(await runAction(async () => { throw new AppError("OUT_OF_STOCK", undefined, [{ available: 0 }]); })).toMatchObject({ ok: false, error: { code: "OUT_OF_STOCK", details: [{ available: 0 }] } });
  });
  it("never exposes raw database errors in the response or log", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const result = await runAction(async () => { throw new Error("private-connection-and-customer-details"); });
    expect(result).toMatchObject({ ok: false, error: { code: "INTERNAL" } });
    expect(JSON.stringify(result)).not.toContain("private-connection");
    expect(JSON.stringify(log.mock.calls)).not.toContain("private-connection");
  });
});
