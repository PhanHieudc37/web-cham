import "server-only";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { OrderAdminDetailDTO } from "@/types/dto";
import { defaultSettings } from "@/lib/validation/settings";
const mocks = vi.hoisted(() => ({ env: vi.fn() }));
vi.mock("@/server/env", () => ({ getServerEnv: mocks.env }));
import { notifyNewContact, notifyOrderCreated, notifyOrderShipped } from "./notification.service";
import { newContact } from "@/server/emails/new-contact";
import { orderConfirmation } from "@/server/emails/order-confirmation";
import { newOrder } from "@/server/emails/new-order";

const order: OrderAdminDetailDTO = { id: "order-id", code: "CS2610281234", createdAt: "2026-10-28T00:00:00Z", status: "pending", paymentMethod: "bank_transfer", paymentStatus: "unpaid", customerName: "PRIVATE_NAME<script>", customerPhone: "PRIVATE_PHONE", customerEmail: "private@example.test", province: "PRIVATE_PROVINCE", ward: "PRIVATE_WARD", addressLine: "PRIVATE_ADDRESS", note: "PRIVATE_NOTE<script>", adminNote: null, paidAt: null, subtotal: 199000, discountAmount: 0, shippingFee: 30000, total: 229000, carrier: null, trackingCode: null, cancelReason: null, events: [], bank: { ...defaultSettings.bank, bankBin: "970436", bankName: "Ngân hàng thử", accountNo: "123456", accountName: "CHU TAI KHOAN" }, items: [{ id: "item-id", productId: null, productSlug: "ao-thun", productName: "Áo <script>alert(1)</script>", colorName: "Đen", size: "M", sku: "CS01-DEN-M", imageUrl: null, unitPrice: 199000, quantity: 1, lineTotal: 199000 }] };
const baseEnv = { NEXT_PUBLIC_SITE_URL: "https://example.test", RESEND_API_KEY: "private-api-key", EMAIL_FROM: "Shop <sender@example.test>", SHOP_NOTIFY_EMAIL: "shop@example.test", TELEGRAM_BOT_TOKEN: "", TELEGRAM_CHAT_ID: "" };
describe("order notifications and email privacy", () => {
  beforeEach(() => { vi.restoreAllMocks(); mocks.env.mockReturnValue({ ...baseEnv }); vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 200 }))); vi.spyOn(console, "info").mockImplementation(() => undefined); vi.spyOn(console, "error").mockImplementation(() => undefined); });
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
  it("notifies only the shop about a contact with escaped text and a private admin link", async () => {
    const message = { id: "contact-id", name: "PRIVATE_NAME<script>", phone: "0912345678", email: "private@example.test", message: "PRIVATE_MESSAGE<script>\nDòng hai", status: "new" as const, createdAt: new Date().toISOString(), handledAt: null, handledByName: null };
    const template = newContact(message, "Cham.stu", "https://example.test/admin/messages"); expect(template.html).not.toContain("<script>"); expect(template.html).toContain("&lt;script&gt;"); expect(template.text).toContain("Dòng hai");
    await notifyNewContact(message, "Cham.stu"); expect(fetch).toHaveBeenCalledTimes(1); const init = vi.mocked(fetch).mock.calls[0][1]; const body = JSON.parse(String(init?.body));
    expect(body.to).toBe("shop@example.test"); expect(body.text).toContain("/admin/messages"); expect(new Headers(init?.headers).get("Idempotency-Key")).toBe("new-contact/contact-id");
    vi.mocked(fetch).mockClear(); mocks.env.mockReturnValue({ ...baseEnv, RESEND_API_KEY: undefined, SHOP_NOTIFY_EMAIL: undefined }); await notifyNewContact(message, "Cham.stu"); expect(fetch).not.toHaveBeenCalled(); const logs = JSON.stringify(vi.mocked(console.info).mock.calls); expect(logs).not.toContain("PRIVATE"); expect(logs).not.toContain(message.phone); expect(logs).toContain(message.id);
  });
  it("contact delivery failures are private and do not reject the saved message", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response("PRIVATE_PROVIDER_ERROR", { status: 422 }));
    await expect(notifyNewContact({ id: "contact-id", name: "PRIVATE", phone: "PRIVATE", email: "private@example.test", message: "PRIVATE", status: "new", createdAt: new Date().toISOString(), handledAt: null, handledByName: null }, "Cham.stu")).resolves.toBeUndefined();
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain("PRIVATE");
  });
  it("sends escaped shipping tracking to the customer with a stable idempotency key", async () => {
    await notifyOrderShipped({ ...order, status: "shipping", carrier: "GHN<script>", trackingCode: "TRACK<10>" }, "Cham.stu");
    expect(fetch).toHaveBeenCalledTimes(1);
    const init = vi.mocked(fetch).mock.calls[0][1]; expect(new Headers(init?.headers).get("Idempotency-Key")).toBe("order-shipped/order-id");
    const body = JSON.parse(String(init?.body)); expect(body.to).toBe(order.customerEmail); expect(body.text).toContain("TRACK<10>"); expect(body.html).toContain("TRACK&lt;10&gt;"); expect(body.html).not.toContain("<script>");
    expect(console.info).not.toHaveBeenCalled(); expect(console.error).not.toHaveBeenCalled();
  });
  it("skips shipping without a customer email or tracking, and keeps provider failures private", async () => {
    await notifyOrderShipped(order, "Cham.stu"); await notifyOrderShipped({ ...order, customerEmail: null, trackingCode: "TRACK" }, "Cham.stu"); expect(fetch).not.toHaveBeenCalled();
    vi.mocked(fetch).mockResolvedValue(new Response("PRIVATE_PROVIDER_RESPONSE", { status: 422 }));
    await expect(notifyOrderShipped({ ...order, trackingCode: "TRACK" }, "Cham.stu")).resolves.toBeUndefined();
    const logs = JSON.stringify(vi.mocked(console.error).mock.calls); expect(logs).toContain(order.code); expect(logs).not.toContain("PRIVATE"); expect(logs).not.toContain(order.customerEmail);
  });
  it("escapes shop/product/customer HTML and includes server totals, bank instructions and the proper links", () => {
    const customer = orderConfirmation(order, "Cham <stu>", "https://example.test/checkout/success?code=CS&t=TOKEN");
    expect(customer.html).not.toContain("<script>"); expect(customer.html).toContain("&lt;script&gt;"); expect(customer.text).toContain("229.000₫"); expect(customer.text).toContain(order.code); expect(customer.text).toContain("Nội dung chuyển khoản");
    const shop = newOrder(order, "Cham.stu", "https://example.test/admin/orders/order-id"); expect(shop.html).not.toContain("<script>"); expect(shop.text).toContain("/admin/orders/"); expect(shop.text).not.toContain("checkout/success");
  });
  it("sends two Resend HTTP requests with distinct idempotency keys and no log of recipients or tokens", async () => {
    await notifyOrderCreated(order, "Cham.stu", "PRIVATE_TOKEN");
    const fetchMock = vi.mocked(fetch); expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toBe("https://api.resend.com/emails");
    const headers = new Headers(fetchMock.mock.calls[0][1]?.headers); expect(headers.get("Idempotency-Key")).toBe("order-confirmation/order-id"); expect(headers.get("Authorization")).toBe("Bearer private-api-key");
    const customer = JSON.parse(String(fetchMock.mock.calls[0][1]?.body)); expect(customer.to).toBe(order.customerEmail); expect(customer.text).toContain("t=PRIVATE_TOKEN");
    const shop = JSON.parse(String(fetchMock.mock.calls[1][1]?.body)); expect(shop.to).toBe("shop@example.test"); expect(shop.text).not.toContain("PRIVATE_TOKEN"); expect(console.error).not.toHaveBeenCalled();
  });
  it("skips absent customer email and sends optional Telegram without personal data", async () => {
    mocks.env.mockReturnValue({ ...baseEnv, TELEGRAM_BOT_TOKEN: "bot-secret", TELEGRAM_CHAT_ID: "chat-id" });
    await notifyOrderCreated({ ...order, customerEmail: null }, "Cham.stu", "PRIVATE_TOKEN");
    expect(fetch).toHaveBeenCalledTimes(2); const telegram = vi.mocked(fetch).mock.calls.find(([url]) => String(url).includes("telegram.org")); expect(telegram).toBeDefined();
    expect(String(telegram?.[1]?.body)).toContain(order.code); expect(String(telegram?.[1]?.body)).not.toContain(order.customerPhone);
  });
  it("logs safe dev summaries and never logs personal information or bearer tokens", async () => {
    mocks.env.mockReturnValue({ ...baseEnv, RESEND_API_KEY: undefined, EMAIL_FROM: undefined, SHOP_NOTIFY_EMAIL: undefined });
    await notifyOrderCreated(order, "Cham.stu", "PRIVATE_TOKEN"); expect(fetch).not.toHaveBeenCalled(); expect(console.info).toHaveBeenCalledTimes(2);
    const log = JSON.stringify(vi.mocked(console.info).mock.calls); for (const value of [order.customerEmail, order.customerPhone, order.customerName, order.addressLine, "PRIVATE_TOKEN"]) expect(log).not.toContain(value); expect(log).toContain(order.code);
  });
  it("isolates provider failures and logs only the order code", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response("PRIVATE_PROVIDER_RESPONSE", { status: 422 }));
    await expect(notifyOrderCreated(order, "Cham.stu", "PRIVATE_TOKEN")).resolves.toBeUndefined(); expect(console.error).toHaveBeenCalledTimes(2);
    const log = JSON.stringify(vi.mocked(console.error).mock.calls); expect(log).not.toContain("PRIVATE"); expect(log).toContain(order.code);
  });
  it("disables every email even when provider credentials exist, without logging delivery or personal data", async () => {
    mocks.env.mockReturnValue({ ...baseEnv, EMAIL_DELIVERY: "disabled" });
    await notifyOrderCreated(order, "Cham.stu", "PRIVATE_TOKEN");
    await notifyOrderShipped({ ...order, trackingCode: "TRACK" }, "Cham.stu");
    await notifyNewContact({ id: "contact-id", name: "PRIVATE", phone: "PRIVATE", email: "private@example.test", message: "PRIVATE", status: "new", createdAt: new Date().toISOString(), handledAt: null, handledByName: null }, "Cham.stu");
    expect(fetch).not.toHaveBeenCalled(); expect(console.info).not.toHaveBeenCalled(); expect(console.error).not.toHaveBeenCalled();
  });
  it("keeps optional Telegram notifications working while email is disabled", async () => {
    mocks.env.mockReturnValue({ ...baseEnv, EMAIL_DELIVERY: "disabled", TELEGRAM_BOT_TOKEN: "bot-secret", TELEGRAM_CHAT_ID: "chat-id" });
    await notifyOrderCreated(order, "Cham.stu", "PRIVATE_TOKEN");
    expect(fetch).toHaveBeenCalledTimes(1); expect(String(vi.mocked(fetch).mock.calls[0][0])).toContain("api.telegram.org");
    expect(String(vi.mocked(fetch).mock.calls[0][1]?.body)).not.toContain(order.customerEmail);
  });
});
