import { appendFileSync } from "node:fs";
const database = process.env.DATABASE_URL;
if (process.env.PHASE12_E2E !== "1" || !database || !new URL(database).pathname.endsWith("_test") || database !== process.env.TEST_DATABASE_URL) throw new Error("Notification stub chỉ dùng với database test riêng");
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = new URL(input instanceof Request ? input.url : String(input));
  if (url.hostname === "api.resend.com" || url.hostname === "api.telegram.org") {
    const headers = new Headers(init?.headers);
    appendFileSync("test-results/phase12-notifications.jsonl", JSON.stringify({ provider: url.hostname, key: headers.get("Idempotency-Key") }) + "\n");
    return Response.json({ id: "test-delivery" });
  }
  return originalFetch(input, init);
};
