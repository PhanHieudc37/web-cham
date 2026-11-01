import { summarizePerformance, type PerformanceSample } from "../src/lib/performance-measurement";

export type Measurement = { label: string; path: string; samples: PerformanceSample[]; skipped?: string; failed?: boolean };
const cell = (value: number | null) => value === null ? "—" : String(Math.round(value));
const escape = (value: string) => value.replaceAll("|", "\\|").replaceAll("\n", " ");

export function performanceReport(options: { stage: string; at: string; network: string; origin: string; commit: string; credits: string; chromium: string; measurements: Measurement[] }) {
  const lines = [
    `## ${options.stage === "baseline" ? "Baseline — Phase 15.0" : options.stage === "final" ? "Sau Phase 15B + 15C" : `Sau Phase ${options.stage}`} — ${options.at}`,
    "",
    `- Đo trực tiếp trên máy Windows của chủ shop tại Việt Nam; mạng: ${escape(options.network)} (do chủ shop cung cấp). Không mô phỏng tốc độ/CPU. Chưa xác minh nhà mạng hoặc VPN.`,
    `- Origin: ${options.origin}; commit production: \`${options.commit}\`; Chromium ${options.chromium}, headless, viewport 1280×720.`,
    `- Credit Netlify: **${escape(options.credits)}**. Số production deploy đã dùng xem sổ triển khai theo từng mốc bên dưới; không suy đoán số dư từ số lần deploy.`,
    "- Mỗi ca: 1 lượt làm ấm bỏ khỏi thống kê → 5 lượt tuần tự, dùng lại browser context/cache. Mỗi lượt đợi heading nội dung, đếm request ứng dụng tới 1 giây sau heading; không tính ảnh/file tĩnh/third-party. Prefetch/RSC và API cùng origin vẫn được tính.",
    "- TTFB điều hướng = responseStart − startTime của Navigation Timing; đăng nhập = TTFB POST Server Action của form login, nội dung = từ bấm Đăng nhập tới heading tổng quan. Back = thời gian từ thao tác Back tới heading danh sách, không ép reload; nếu không có response mạng thì TTFB/header là —. Quote = POST tới khi nhận JSON, không phải heading.",
    "- Trung vị = median; p90 dùng nearest-rank (với 5 lượt là giá trị lớn nhất). Đây là mẫu nhỏ khi đã làm ấm, không phải SLA, Lighthouse hoặc phép đo cold-start.",
    "- Chỉ đọc nghiệp vụ production. Login tạo phiên xác thực; quote vẫn ghi rate_limits theo hành vi hiện tại. Không tạo đơn/sản phẩm/tin nhắn; không xuất cookie, password, tên khách, mã đơn hoặc response body vào báo cáo.",
    "",
    "| Ca đo | TTFB median / p90 (ms) | Nội dung median / p90 (ms) | Request median / p90 | Kết quả |",
    "|---|---:|---:|---:|---|",
  ];
  for (const entry of options.measurements) {
    const summary = summarizePerformance(entry.samples);
    lines.push(`| ${entry.label} | ${cell(summary.ttfbMedian)} / ${cell(summary.ttfbP90)} | ${cell(summary.contentMedian)} / ${cell(summary.contentP90)} | ${cell(summary.requestMedian)} / ${cell(summary.requestP90)} | ${entry.skipped ? escape(entry.skipped) : entry.failed ? "Lỗi đo; không nghiệm thu" : `${entry.samples.length}/5 lượt`} |`);
  }
  lines.push("", "### Từng lượt đo", "", "| Ca đo | Lượt | HTTP | TTFB (ms) | Nội dung (ms) | Request | Cache-Status | Age |", "|---|---:|---:|---:|---:|---:|---|---|");
  for (const entry of options.measurements) for (const sample of entry.samples) lines.push(`| ${entry.label} | ${sample.round} | ${sample.status ?? "—"} | ${cell(sample.ttfbMs)} | ${cell(sample.contentMs)} | ${sample.appRequests} | ${escape(sample.cacheStatus ?? "—")} | ${escape(sample.age ?? "—")} |`);
  return lines.join("\n") + "\n";
}
