import "server-only";

export type EmailContent = { subject: string; html: string; text: string };
export const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
export function emailLayout(shopName: string, title: string, body: string) {
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#f5f3f0;font-family:Arial,sans-serif;color:#111"><table role="presentation" style="width:100%;max-width:600px;margin:24px auto;background:white;border-collapse:collapse;table-layout:fixed"><tr><td style="padding:28px 24px;border-bottom:1px solid #eee;font-size:22px;font-weight:bold">${escapeHtml(shopName)}</td></tr><tr><td style="padding:24px;font-size:14px;line-height:1.7;overflow-wrap:anywhere;word-break:break-word"><h1 style="font-size:20px">${escapeHtml(title)}</h1>${body}</td></tr></table></body></html>`;
}
