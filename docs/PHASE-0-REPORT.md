# Báo cáo Phase 0 — Khởi tạo dự án

Ngày nghiệm thu: 27/10/2026. Phạm vi: chỉ Phase 0.

## Đã làm

- Khởi tạo Next.js 16.4.3, React 19.3, TypeScript strict, Tailwind CSS v4 và đủ thư viện trong plan; lưu phiên bản trong `package-lock.json`.
- Thêm 17 thành phần shadcn/ui dùng Radix, map màu và góc vuông theo STOREFRONT; font Be Vietnam Pro đủ 400/500/600/700, latin và vietnamese.
- Tạo khung thư mục theo ARCHITECTURE. Thư mục cho phase sau chỉ có `.gitkeep`, chưa triển khai chức năng.
- Trang `/` hiển thị “Cham.stu”, tiếng Việt và trạng thái đang xây dựng; có Toaster và ảnh placeholder tự tạo.
- Thêm Zod validation, `.env.example`, `.env` local với secret ngẫu nhiên; `.env` bị Git bỏ qua. Không điền thông tin shop hoặc kết nối dịch vụ giả.
- Thêm security headers, giới hạn ảnh từ host trong `SUPABASE_URL`, region `sin1` và các script theo plan.
- Khởi tạo Git local, lưu tài liệu gốc trong commit đầu; commit kết thúc dùng tiền tố `phase-0:`.

## Kiểm tra

| Kiểm tra | Kết quả |
|---|---|
| `npm run lint` | Pass |
| `npm run typecheck` | Pass |
| `npm run test` | Pass, 15 ca validation |
| `npm run build` | Pass, tạo trang chủ tĩnh |
| `npm run e2e` | Pass, 3 ca tại 375/768/1280px |
| Ảnh chụp trình duyệt | Đã xem cả 3; không có thanh cuộn ngang |
| Font và headers | Playwright xác nhận Be Vietnam Pro tải thật và đủ 4 security headers |
| Thiếu cấu hình production | `npm start` từ chối chạy, liệt kê tên biến thiếu, không in secret |

E2E đã chạy thật dev server và Chromium. Ảnh kiểm tra nằm trong `test-results/home-375.png`, `home-768.png`, `home-1280.png` (không commit). Dev server kiểm tra đã được dừng; chạy lại bằng `npm run dev` và mở `http://localhost:3000`.

## Điều chỉnh và điểm cần lưu ý

- Lệnh trong PLAN dùng `.scaffold` bị create-next-app từ chối vì tên bắt đầu bằng dấu chấm. Đã dùng `scaffold-temp`, chuyển cả file ẩn lên gốc và xóa thư mục tạm; giữ nguyên tài liệu gốc. Ghi chú Next.js được nối vào cuối AGENTS theo plan.
- `@hookform/resolvers` bản 6 gặp xung đột peer dependency nội bộ, nên dùng bản 5.9.2 tương thích. `@types/node` được đồng bộ lên 22 theo Node thực tế và yêu cầu Vitest. Không dùng `--force` hoặc `--legacy-peer-deps`.
- Để chạy local trước Phase 1, khung Phase 0/build chỉ yêu cầu bốn biến local. `getServerEnv()` kiểm tra đầy đủ PostgreSQL/Supabase khi dùng dịch vụ; production startup kiểm tra đủ biến bắt buộc, gồm email. Schema thuần nằm trong `lib/validation/env.ts` để Next config dùng được mà không import module `server-only`; truy cập `process.env` của dịch vụ ở `server/env.ts`.
- Token `--color-muted` trong STOREFRONT dùng cho chữ phụ; các style nền muted của shadcn được map sang `bg-surface` để giữ đúng ý nghĩa màu.
- Ví dụ action tại ARCHITECTURE mục 5.2 đặt kiểm tra quyền trước validate, khác AGENTS. Phase 0 chưa có action; các phase sau tuân theo AGENTS: validate → quyền → service → ActionResult.
- `npm audit` còn 4 cảnh báo moderate trong chuỗi phụ thuộc công cụ dev `drizzle-kit` → esbuild. Bản sửa npm đề xuất là hạ Drizzle Kit xuống 0.18.1, thay đổi lớn; chưa tự ý áp dụng. Không phải dependency chạy storefront.

## Chưa làm và chủ shop cần cung cấp

Chưa tạo Supabase, schema, migration, seed, đăng nhập hoặc chức năng cửa hàng vì thuộc các phase sau. Các script `db:*` mới khai báo, chưa có file triển khai của Phase 1. Chưa có Git remote, chưa push GitHub và chưa deploy hosting theo yêu cầu chạy local trước.

Phase 0 không cần chủ shop cung cấp thêm thông tin. Trước Phase 1 cần chốt PostgreSQL local hay Supabase như plan. Nếu dùng Supabase, cần quyền truy cập tài khoản để tạo project dev và điền kết nối thật vào `.env`; PostgreSQL local vẫn cần Supabase Storage nếu giữ nguyên thiết kế lưu ảnh. GitHub lưu code là bước riêng với triển khai website. Chỉ chuyển phase khi được giao tiếp.
