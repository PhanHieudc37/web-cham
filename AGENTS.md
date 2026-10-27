# AGENTS.md — Cham.stu

Website bán quần áo của shop **Cham.stu**, gồm cửa hàng online (storefront) và trang quản trị (`/admin`). Web dùng để vận hành lâu dài và bán hàng độc lập, không phụ thuộc Shopee.

## Đọc tài liệu trước khi code

| Việc đang làm | Đọc |
|---|---|
| Bắt đầu bất kỳ phase nào | `docs/PLAN.md` (phase được giao + tiêu chí nghiệm thu) |
| Cấu trúc code, FE/BE, API, lỗi, cache, auth, bảo mật, env, test | `docs/ARCHITECTURE.md` |
| Bảng dữ liệu, đơn hàng, tồn kho, thanh toán, settings, seed | `docs/DATABASE.md` |
| Giao diện cửa hàng | `docs/STOREFRONT.md` |
| Trang quản trị | `docs/ADMIN.md` |

Nếu các tài liệu mâu thuẫn nhau: phần kỹ thuật theo `ARCHITECTURE.md` và `DATABASE.md`, phần giao diện theo `STOREFRONT.md` và `ADMIN.md`. Ghi lại chỗ mâu thuẫn trong báo cáo cuối phase.

## Quy tắc bắt buộc

1. Chỉ làm phase được giao. Không làm trước phase sau, không thêm tính năng ngoài plan.
2. Chỉ dùng thư viện có trong `docs/PLAN.md` mục 3. Nếu cần thêm thư viện thì dừng lại và hỏi.
3. TypeScript strict. Không dùng `any`, không dùng `@ts-ignore`, không tắt rule ESLint để code qua được.
4. Tên biến, hàm, file viết bằng tiếng Anh. Chữ hiển thị viết bằng tiếng Việt có dấu.
5. Tiền là số nguyên VND. Giá, tổng tiền, giảm giá, tồn kho **luôn tính ở server**, không tin số liệu client gửi lên.
6. Client component không bao giờ được import code trong `src/server/**`.
7. Mỗi Server Action / Route Handler đi theo thứ tự: validate bằng zod → kiểm tra quyền → gọi service → trả `ActionResult`. Server Action là endpoint công khai, kể cả khi nút bấm đã bị ẩn trên giao diện.
8. Không bịa thông tin shop (SĐT, số tài khoản, địa chỉ, link mạng xã hội). Thông tin chưa có thì để trống, giao diện tự ẩn phần đó.
9. Không sao chép logo, ảnh, văn bản của unclem.vn hay shop nào khác. Không crawl Shopee.
10. Không commit file `.env*` (trừ `.env.example`). Không log secret hay thông tin cá nhân của khách.
11. Muốn đổi schema thì tạo migration mới bằng `drizzle-kit generate`. Không sửa migration đã chạy.
12. API của Next.js, Better Auth, Drizzle, zod thay đổi theo phiên bản. Trước khi dùng phần cache, middleware/proxy, `params`, cấu hình auth…, đọc docs của **đúng phiên bản đang cài**.

## Lệnh

```bash
npm run dev          # chạy local
npm run lint
npm run typecheck
npm run test         # vitest (unit + integration nếu có TEST_DATABASE_URL)
npm run e2e          # playwright
npm run db:generate  # sinh migration từ schema
npm run db:migrate
npm run db:seed      # thêm --sample để có dữ liệu mẫu (chỉ dev)
npm run db:studio
```

## Một phase chỉ được coi là xong khi

- `npm run lint`, `npm run typecheck`, `npm run test` và `npm run build` đều pass.
- Đạt mọi tiêu chí nghiệm thu của phase đó trong `docs/PLAN.md`.
- Phase có giao diện thì đã kiểm tra ở 3 độ rộng 375px, 768px, 1280px, không có thanh cuộn ngang.
- Đã commit với message `phase-N: <mô tả>`.
- Đã viết báo cáo ngắn gồm: đã làm gì, chưa làm gì và vì sao, chủ shop cần cung cấp gì.
