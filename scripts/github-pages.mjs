import { execFileSync } from "node:child_process";

const repository = "PhanHieudc37/web-cham";
const operation = process.argv[2] ?? "status";
if (!["status", "enable", "dispatch"].includes(operation)) throw new Error("Expected status, enable, or dispatch");
const raw = execFileSync("git", ["credential", "fill"], {
  input: "protocol=https\nhost=github.com\n\n", encoding: "utf8", timeout: 10_000,
  env: { ...process.env, GIT_TERMINAL_PROMPT: "0", GCM_INTERACTIVE: "Never" }, stdio: ["pipe", "pipe", "pipe"],
});
const fields = Object.fromEntries(raw.trim().split(/\r?\n/).map((line) => {
  const position = line.indexOf("="); return [line.slice(0, position), line.slice(position + 1)];
}));
if (!fields.password) throw new Error("No authenticated GitHub credential");
const headers = { Authorization: `Bearer ${fields.password}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "web-cham-design-preview", "Content-Type": "application/json" };
async function request(path, method = "GET", body) {
  const response = await fetch(`https://api.github.com/${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(20_000) });
  const data = response.status === 204 ? null : await response.json();
  return { status: response.status, data };
}
const identity = await request("user");
if (identity.status !== 200 || identity.data.login.toLowerCase() !== "phanhieudc37") throw new Error("Authenticated account does not match requested repository owner");
let pages = await request(`repos/${repository}/pages`);
if (operation === "enable") {
  pages = await request(`repos/${repository}/pages`, pages.status === 404 ? "POST" : "PUT", { build_type: "workflow" });
  if (![201, 204].includes(pages.status)) throw new Error(`Pages configuration failed: ${pages.status} ${pages.data?.message ?? ""}`);
  pages = await request(`repos/${repository}/pages`);
}
if (operation === "dispatch") {
  const result = await request(`repos/${repository}/actions/workflows/preview-pages.yml/dispatches`, "POST", { ref: "main" });
  if (result.status !== 204) throw new Error(`Workflow dispatch failed: ${result.status} ${result.data?.message ?? ""}`);
}
console.log(JSON.stringify({ repository, pagesStatus: pages.status, url: pages.data?.html_url, buildType: pages.data?.build_type, state: pages.data?.status }));
const runs = await request(`repos/${repository}/actions/workflows/preview-pages.yml/runs?per_page=3`);
if (runs.status === 200) for (const run of runs.data.workflow_runs) {
  console.log(JSON.stringify({ id: run.id, status: run.status, conclusion: run.conclusion, url: run.html_url, commit: run.head_sha }));
  if (run.conclusion === "failure") {
    const jobs = await request(`repos/${repository}/actions/runs/${run.id}/jobs`);
    if (jobs.status === 200) for (const job of jobs.data.jobs) console.log(JSON.stringify({ job: job.name, status: job.conclusion, failedSteps: job.steps.filter((step) => step.conclusion === "failure").map((step) => step.name), jobId: job.id }));
  }
}
