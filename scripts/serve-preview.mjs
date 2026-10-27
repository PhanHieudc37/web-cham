import { createServer } from "node:http";
import { readFileSync, statSync } from "node:fs";
import { resolve, sep, extname } from "node:path";

const root = resolve(".preview-dist");
const port = Number(process.env.PREVIEW_PORT ?? 4173);
const contentTypes = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".ttf": "font/ttf", ".txt": "text/plain; charset=utf-8", ".json": "application/json" };
createServer((request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url ?? "/", "http://localhost").pathname);
    const localPath = pathname.replace(/^\/web-cham(?=\/|$)/, "");
    const file = resolve(root, `.${localPath === "/" || !localPath ? "/index.html" : localPath}`);
    if (!file.startsWith(`${root}${sep}`) || !statSync(file).isFile()) throw new Error("Not found");
    response.writeHead(200, { "Content-Type": contentTypes[extname(file)] ?? "application/octet-stream", "X-Content-Type-Options": "nosniff", "Cache-Control": "no-store" });
    response.end(readFileSync(file));
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Không tìm thấy trang");
  }
}).listen(port, "127.0.0.1", () => console.log(`Preview: http://localhost:${port}/web-cham/`));
