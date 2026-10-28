import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCartStore } from "./cart";

const entries = new Map<string, string>();
beforeEach(() => {
  entries.clear();
  vi.stubGlobal("localStorage", { getItem: (key: string) => entries.get(key) ?? null, setItem: (key: string, value: string) => entries.set(key, value), removeItem: (key: string) => entries.delete(key) });
  useCartStore.setState({ lines: [], note: "", discountCode: "", hasHydrated: true });
});
describe("persisted cart boundaries", () => {
  it("merges the same variant and clamps quantities to server and global limits", () => {
    const id = randomUUID();
    expect(useCartStore.getState().add(id, 2, 5)).toBeNull();
    useCartStore.getState().add(id, 4, 5);
    expect(useCartStore.getState().lines).toEqual([{ variantId: id, quantity: 5 }]);
    useCartStore.getState().setQuantity(id, 500, 500);
    expect(useCartStore.getState().lines[0].quantity).toBe(10);
    useCartStore.getState().setQuantity(id, -2, 5);
    expect(useCartStore.getState().lines[0].quantity).toBe(1);
    useCartStore.getState().setQuantity(id, Number.NaN, 5);
    expect(useCartStore.getState().lines[0].quantity).toBe(1);
    expect(useCartStore.getState().add(randomUUID(), 1, 0)).toBeTruthy();
    expect(useCartStore.getState().add("invalid", 1, 5)).toBeTruthy();
  });
  it("caps new lines at 20 while still permitting edits to existing lines", () => {
    const ids = Array.from({ length: 21 }, () => randomUUID());
    for (const id of ids.slice(0, 20)) expect(useCartStore.getState().add(id, 1, 5)).toBeNull();
    expect(useCartStore.getState().add(ids[20], 1, 5)).toContain("20");
    expect(useCartStore.getState().add(ids[0], 1, 5)).toBeNull();
    expect(useCartStore.getState().lines).toHaveLength(20);
    expect(useCartStore.getState().lines[0].quantity).toBe(2);
  });
  it("persists only ids, quantities and notes, restores explicitly, and never restores actions or prices", async () => {
    const id = randomUUID();
    useCartStore.getState().add(id, 2, 5);
    useCartStore.getState().setNote("Giao buổi sáng");
    const saved = entries.get("cham-cart-v1")!;
    expect(JSON.parse(saved)).toEqual({ state: { lines: [{ variantId: id, quantity: 2 }], note: "Giao buổi sáng", discountCode: "" }, version: 1 });
    useCartStore.setState({ lines: [], note: "", hasHydrated: false });
    entries.set("cham-cart-v1", saved.replace('"discountCode":""', '"discountCode":"","add":"tampered","price":1,"hasHydrated":true'));
    await useCartStore.persist.rehydrate();
    expect(useCartStore.getState().lines).toEqual([{ variantId: id, quantity: 2 }]);
    expect(useCartStore.getState().note).toBe("Giao buổi sáng");
    expect(useCartStore.getState().hasHydrated).toBe(false);
    expect(typeof useCartStore.getState().add).toBe("function");
    expect(useCartStore.getState()).not.toHaveProperty("price");
  });
  it("discards corrupted or duplicate persisted lines and tolerates broken JSON", async () => {
    const id = randomUUID();
    for (const lines of [[{ variantId: id, quantity: 999 }], [{ variantId: id, quantity: 1 }, { variantId: id, quantity: 1 }], [{ variantId: "bad", quantity: 1 }]]) {
      entries.set("cham-cart-v1", JSON.stringify({ state: { lines, note: "" }, version: 1 }));
      await useCartStore.persist.rehydrate(); expect(useCartStore.getState().lines).toEqual([]);
    }
    entries.set("cham-cart-v1", "{broken");
    await expect(Promise.resolve(useCartStore.persist.rehydrate())).resolves.toBeUndefined();
  });
  it("limits notes, removes lines, and clears every persisted checkout field", () => {
    const id = randomUUID(); useCartStore.getState().add(id, 1, 2);
    useCartStore.getState().setNote("x".repeat(600)); expect(useCartStore.getState().note).toHaveLength(500);
    useCartStore.getState().setDiscountCode("NOT-SUPPORTED"); expect(useCartStore.getState().discountCode).toBe("");
    useCartStore.getState().remove(id); expect(useCartStore.getState().lines).toEqual([]);
    useCartStore.getState().clear(); expect(useCartStore.getState().note).toBe("");
  });
});
