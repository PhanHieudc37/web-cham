import { describe, expect, it } from "vitest";
import { csvRow, dayStart, orderFiltersSchema, orderQuery, shiftDay, vietnamDay } from "./order-admin";
describe("admin order filters, Vietnamese days and CSV", () => {
  it("validates calendar dates, ranges, statuses and bounded pagination", () => {
    expect(orderFiltersSchema.parse({})).toMatchObject({ page: 1, q: "", status: "" });
    for (const value of [{ from: "2026-02-30" }, { from: "2026-10-29", to: "2026-10-28" }, { page: -1 }, { status: "unknown" }]) expect(orderFiltersSchema.safeParse(value).success).toBe(false);
    expect(orderQuery(orderFiltersSchema.parse({ q: "Khách Việt", status: "pending", page: 3 }), { status: "shipping", page: 1 })).toBe("q=Kh%C3%A1ch+Vi%E1%BB%87t&status=shipping");
  });
  it("uses Vietnam midnight and handles month/year boundaries", () => {
    expect(vietnamDay(new Date("2026-10-28T17:00:00Z"))).toBe("2026-10-29");
    expect(dayStart("2026-10-29").toISOString()).toBe("2026-10-28T17:00:00.000Z");
    expect(shiftDay("2027-01-01", -1)).toBe("2026-12-31");
  });
  it("escapes CSV delimiters and spreadsheet formulas, including leading whitespace", () => {
    expect(csvRow(['Tên, "khách"', "=HYPERLINK(1)", "  +SUM(1)", "@formula", "\tformula", 120000])).toBe('"Tên, ""khách""","\'=HYPERLINK(1)","\'  +SUM(1)","\'@formula","\'\tformula","120000"\r\n');
  });
});
