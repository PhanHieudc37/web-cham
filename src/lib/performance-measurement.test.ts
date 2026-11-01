import { describe, expect, it } from "vitest";
import { isApplicationRequest, percentile, summarizePerformance } from "./performance-measurement";

describe("performance measurement", () => {
  it("uses the median and nearest-rank p90 without mutating raw measurements", () => {
    const values = [2000, 10, 30, 20, 40];
    expect(percentile(values, 0.5)).toBe(30);
    expect(percentile(values, 0.9)).toBe(2000);
    expect(percentile([10, 20, 30, 40], 0.5)).toBe(25);
    expect(values[0]).toBe(2000);
    expect(() => percentile([Number.NaN], 0.9)).toThrow();
  });
  it("counts application navigation and RSC calls while excluding images, bundles and third parties", () => {
    const origin = "https://shop.example";
    expect(isApplicationRequest(`${origin}/admin?_rsc=123`, origin, "fetch")).toBe(true);
    expect(isApplicationRequest(`${origin}/api/cart/quote`, origin, "fetch")).toBe(true);
    expect(isApplicationRequest(`${origin}/`, origin, "document")).toBe(true);
    expect(isApplicationRequest(`${origin}/_next/static/chunk.js`, origin, "script")).toBe(false);
    expect(isApplicationRequest(`${origin}/_next/image?url=a`, origin, "fetch")).toBe(false);
    expect(isApplicationRequest(`${origin}/photo.webp`, origin, "image")).toBe(false);
    expect(isApplicationRequest("https://other.example/api", origin, "fetch")).toBe(false);
  });
  it("leaves missing navigation TTFB unknown instead of inventing zero for router cache hits", () => {
    const result = summarizePerformance([{ round: 1, ttfbMs: null, contentMs: 40, appRequests: 0, status: null, cacheStatus: null, age: null }]);
    expect(result.ttfbMedian).toBeNull();
    expect(result.contentMedian).toBe(40);
    expect(result.requestMedian).toBe(0);
    expect(percentile([], 0.9)).toBeNull();
  });
});
