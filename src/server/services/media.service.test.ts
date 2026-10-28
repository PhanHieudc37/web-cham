import "server-only";
import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ upload: vi.fn(), remove: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({ createClient: () => ({ storage: { from: () => ({ upload: mocks.upload, remove: mocks.remove, getPublicUrl: (path: string) => ({ data: { publicUrl: `https://test.supabase.co/storage/v1/object/public/media/${path}` } }) }) } }) }));
import { uploadInputSchema } from "@/lib/validation/media";
import { assertStoredMedia, uploadMedia } from "./media.service";

describe("server image upload", () => {
  beforeEach(() => { vi.stubEnv("SUPABASE_URL", "https://test.supabase.co"); vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-secret-only"); mocks.upload.mockResolvedValue({ error: null }); });
  it("checks MIME and size, and rejects disguised content", async () => {
    expect(uploadInputSchema.safeParse({ folder: "products", file: new File(["x"], "x.svg", { type: "image/svg+xml" }) }).success).toBe(false);
    expect(uploadInputSchema.safeParse({ folder: "products", file: new File([new Uint8Array(2 * 1024 * 1024 + 1)], "large.png", { type: "image/png" }) }).success).toBe(false);
    await expect(uploadMedia(new File(["<script>"], "x.png", { type: "image/png" }), "products")).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });
  it("generates its own path and returns a public URL, never a client filename", async () => {
    const image = new File([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])], "../../unsafe.png", { type: "image/png" });
    const result = await uploadMedia(image, "products");
    expect(result.path).toMatch(/^products\/\d{4}\/\d{2}\/[a-f0-9-]{36}\.png$/); expect(result.url).not.toContain("unsafe");
    expect(mocks.upload).toHaveBeenCalledWith(result.path, expect.any(Uint8Array), expect.objectContaining({ contentType: "image/png", upsert: false }));
  });
  it("does not accept external URLs or traversal paths in product references", () => {
    expect(() => assertStoredMedia({ path: "products/../../secret.png", url: "https://evil.test/x" }, "products")).toThrow();
    expect(() => assertStoredMedia({ path: "products/2026/10/12345678-1234-1234-1234-123456789012.webp", url: "https://evil.test/x" }, "products")).toThrow();
  });
});
