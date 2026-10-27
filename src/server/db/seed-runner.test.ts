import "server-only";

import { describe, expect, it } from "vitest";
import { assertSeedAllowed } from "./seed-runner";

describe("sample seed protection", () => {
  it("rejects production sample seeding before connecting to a database", () => {
    expect(() => assertSeedAllowed({ sample: true, environment: "production" })).toThrow("production");
  });
  it("allows regular production seed and development samples", () => {
    expect(() => assertSeedAllowed({ sample: false, environment: "production" })).not.toThrow();
    expect(() => assertSeedAllowed({ sample: true, environment: "development" })).not.toThrow();
  });
});
