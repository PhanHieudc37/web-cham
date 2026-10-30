# PLAN — Website bán hàng **Cham.stu**

> Tài liệu chính. Codex đọc `AGENTS.md` (ở thư mục gốc) và file này trước, sau đó làm **đúng một phase mỗi lần** theo mục 6. Chi tiết kỹ thuật nằm trong các file khác của `docs/` (xem mục 5).

---

## Tiến độ thực tế — 30/10/2026

- **Phase 0:** đã nghiệm thu; commit `e346d1f`.
- **GitHub:** code trong repo công khai [PhanHieudc37/web-cham](https://github.com/PhanHieudc37/web-cham), nhánh `main`. Có thêm milestone bản duyệt giao diện tĩnh trên GitHub Pages theo yêu cầu riêng, xem bên dưới.
- **Phase 1:** **đã nghiệm thu trên Supabase `cham-stu-dev`**: đủ 20 bảng/RLS, migration và seed hai lượt không nhân đôi, Studio đọc được dữ liệu, admin và bucket public `media` đã tạo. Lint/typecheck/20 test/build pass. Project do chủ shop tạo ở Tokyo, khác Singapore dự kiến; xem `docs/PHASE-1-REPORT.md`.
- **Phase 2:** đã hoàn tất logic/services và nghiệm thu trên PostgreSQL kiểm thử riêng: 66 test pass (gồm 23 integration), lint/typecheck/build pass; xem `docs/PHASE-2-REPORT.md`.
- **Phase 3:** **đã nghiệm thu** theo yêu cầu riêng ngày 28/10/2026: đăng nhập, guard server, khung admin và tài khoản; 95 test, 9 E2E admin, lint/typecheck/build pass. Login/trang tài khoản/logout đã xác minh với admin thật trên Supabase qua local. Xem `docs/PHASE-3-REPORT.md`.
- **Phase 4:** **đã nghiệm thu** danh mục, sản phẩm, resize/upload ảnh, màu/size/SKU, tồn kho và lịch sử; 114 test, 7 E2E catalog, 9 E2E admin, lint/typecheck/build pass. Đã kiểm tra 375/768/1280px và mở các trang qua Supabase dev thật trên local. Xem `docs/PHASE-4-REPORT.md`.
- **Phase 5:** **đã nghiệm thu** bộ sưu tập, banner và các nhóm cài đặt; 129 test, 7 E2E content và 16 E2E hồi quy pass; lint/typecheck/build pass. Đã chứng minh cache public cập nhật ngay sau khi lưu, không restart/deploy. Kiểm tra UI ở 375/768/1280px. Xem `docs/PHASE-5-REPORT.md`.
- **Phase 6:** **đã nghiệm thu** layout và trang chủ cửa hàng từ database, menu desktop/mobile, gợi ý tìm kiếm, footer/liên hệ và slider; 132 test, 6 E2E storefront, 7 E2E content hồi quy và 3 E2E trang chủ Supabase dev thật pass. Lint/typecheck/build pass, không tràn ngang ở 375/768/1280px. Xem `docs/PHASE-6-REPORT.md`.
- **Phase 7:** **đã nghiệm thu** danh mục/bộ sưu tập, lọc/sort/phân trang theo URL, tìm không dấu, chi tiết sản phẩm/ảnh theo màu/size/tồn kho, skeleton/error/HTTP 404; 133 test, 9 E2E browsing và 6 E2E storefront hồi quy pass. Lint/typecheck/build pass, kiểm tra 375/768/1280px và 9 lượt trang trên Supabase dev thật. Xem `docs/PHASE-7-REPORT.md`.
- **Phase 8:** **đã nghiệm thu** giỏ persist, API quote không cache, drawer và `/cart`, giới hạn/tự giảm số lượng, cảnh báo ngừng bán, ghi chú và freeship theo server; 138 test, 9 E2E cart và 15 E2E hồi quy pass. Lint/typecheck/build pass, kiểm tra 375/768/1280px và giỏ/reload trên Supabase dev thật. Xem `docs/PHASE-8-REPORT.md`; commit `03294f9`.
- **Phase 9:** **đã nghiệm thu trên dev/test** checkout khách, COD/chuyển khoản, chống đặt trùng, xác nhận đổi giá, xử lý hết kho, trang thành công riêng tư/VietQR và email sau commit; 150 test, 9 E2E checkout và 18 E2E hồi quy pass. Lint/typecheck/build pass; kiểm tra 375/768/1280px và form/quote trên Supabase dev thật. Xem `docs/PHASE-9-REPORT.md`. Sau nghiệm thu, chủ shop đã điền ngân hàng và Resend; API Resend chấp nhận yêu cầu gửi thử, sender `@resend.dev` vẫn cần domain riêng để gửi cho khách khác email đăng ký.
- **Phase 10:** **đã triển khai trên dev/test** tổng quan/doanh thu theo quyền, danh sách/chi tiết đơn, trạng thái hợp lệ, hủy/hoàn trả và hoàn kho, thanh toán, vận chuyển/email sau commit, ghi chú/lịch sử, in A5 và CSV chỉ admin. 167 test, 7 E2E quản lý đơn pass; kiểm tra 375/768/1280px. Hai index mới đã migrate và xác minh trên Supabase dev, RLS vẫn bật. Xem `docs/PHASE-10-REPORT.md`; commit `ed92c01`.
- **Phase 11:** **đã triển khai trên dev/test** tra cứu mã đơn + SĐT che, thông báo sai chung/rate limit, liên hệ/honeypot/email sau lưu, hộp thư staff/admin và ghi nhận người xử lý, trang giới thiệu/chính sách/bảng size/404. 183 test và 12 E2E Phase 11 pass; 375/768/1280px không tràn ngang. Kiểm thử không gửi email/tin nhắn vào dữ liệu shop thật. Nội dung mẫu được chủ shop duyệt khi giao Phase 12. Xem `docs/PHASE-11-REPORT.md`.
- **Phase 12:** **đã triển khai trên dev/test** metadata/canonical/Open Graph, JSON-LD, sitemap/robots/noindex, giảm bundle và ISR sản phẩm, kiểm tra quyền/header/RLS và dependency. 187 unit/integration và 9 E2E trên build production pass, đủ bốn luồng bắt buộc, cold ISR đồng thời và 375/768/1280px. Lighthouse mobile CPU 2× hiệu chuẩn đạt trung vị 96/100/100 (trang chủ), 95/100/100 (sản phẩm); CPU 4× trên build cuối chưa đạt ổn định do điểm dao động. Xem đầy đủ số liệu/cấu hình trong `docs/PHASE-12-REPORT.md`. Chủ shop đã duyệt nội dung chính sách; chưa deploy hệ thống bán hàng hay làm Phase 13.
- Tiếp tục chạy web local theo yêu cầu; chưa triển khai production hay các phần mở rộng Phase 14.

- **Phase 13:** **đang triển khai, chưa nghiệm thu production**. Đã chuẩn bị `docs/DEPLOYMENT.md`, hướng dẫn chủ shop trong README, lệnh production migrate/seed/check có chặn nhầm project dev và công cụ khôi phục mật khẩu admin offline. Tích hợp Vercel/Supabase chưa được kết nối, chưa có project/URL prod xác minh, chưa có domain/Resend Verified và chưa đặt đơn thật tới Hoàn thành. Các kiểm tra mã nguồn và giới hạn thực tế ghi trong `docs/PHASE-13-REPORT.md`; không đánh dấu phase xong chỉ vì build local pass.

### Milestone bổ sung — bản duyệt giao diện trên GitHub Pages

Theo yêu cầu ngày 27/10/2026: tạo bản tương tác riêng cho bạn bè xem và góp ý trước khi triển khai hệ thống thật. Đây là phạm vi bổ sung được giao, không thay việc nghiệm thu các phase 1–13.

- Source: `preview/`; build: `npm run preview:build`; local: `npm run preview:dev`.
- Chỉ duyệt thiết kế: trang chủ, danh mục, tìm kiếm không dấu, chi tiết màu/size, giỏ mẫu và hướng dẫn góp ý.
- Dữ liệu minh họa cố định; không nhận đơn, không thanh toán, không tổng tiền/quote/tồn kho thật; không thu thập thông tin khách hàng. Các bộ lọc trong bản duyệt chạy tại trình duyệt; services SQL của web thật vẫn theo kiến trúc gốc.
- Không cần Supabase và không đưa biến môi trường hay server lên GitHub Pages. Font tự lưu kèm giấy phép; ảnh SVG tự vẽ, không lấy từ shop khác.
- **Đã xuất bản** bằng workflow `.github/workflows/preview-pages.yml`, chỉ upload `.preview-dist`: [phanhieudc37.github.io/web-cham](https://phanhieudc37.github.io/web-cham/). Workflow success, HTTP 200, 6 kịch bản trình duyệt trên URL thật đều pass; bằng chứng trong `docs/PREVIEW-REPORT.md`.
- Tiêu chí: lint/typecheck/test/build của web gốc pass, build preview pass; Playwright kiểm tra 375/768/1280px và thao tác; xuất bản thành công và kiểm tra URL thật trước bàn giao.
- Supabase đã có kết nối PostgreSQL và Storage thật trong `.env` local; không đưa credentials lên GitHub Pages. Bản preview vẫn độc lập với database.

---

## 1. Mục tiêu

- Đây là website bán hàng chính thức của **Cham.stu**, vận hành lâu dài và **không phụ thuộc Shopee**. Shop tự quản lý sản phẩm, tồn kho, đơn hàng và thanh toán trên hệ thống của mình.
- Giao diện tham khảo https://unclem.vn (local brand streetwear VN):
  - thanh thông báo trên cùng, menu SHOP xổ xuống;
  - banner lớn, lưới BEST SELLER / NEW ARRIVAL;
  - trang sản phẩm chọn màu và size;
  - giỏ hàng trượt từ bên phải, nút liên hệ nổi.

  **Chỉ tham khảo bố cục và tính năng.** Không sao chép logo, ảnh hay chữ của họ.
- Ảnh sản phẩm dùng khung **vuông 1:1** như ảnh shop đang đăng trên Shopee (https://shopee.vn/cham.stu). Ảnh được upload qua trang quản trị và tự chuyển về khung vuông.

## 2. Phạm vi

**Cửa hàng (phía khách)**
- Trang chủ, trang danh mục / bộ sưu tập (lọc, sắp xếp, phân trang), tìm kiếm không cần gõ dấu, trang chi tiết sản phẩm.
- Giỏ hàng. Thanh toán không cần đăng nhập, chọn COD hoặc chuyển khoản qua mã VietQR.
- Email xác nhận đơn, tra cứu đơn bằng mã đơn + SĐT, form liên hệ, các trang chính sách.

**Quản trị (`/admin`)**
- Đăng nhập, có 2 vai trò: `admin` và `staff`.
- Quản lý sản phẩm (ảnh, màu, size, biến thể, tồn kho), danh mục, bộ sưu tập, banner trang chủ.
- Quản lý đơn hàng: đổi trạng thái, xác nhận đã nhận tiền, nhập mã vận đơn, in phiếu giao hàng, xuất CSV.
- Tồn kho tự trừ khi có đơn, tự cộng lại khi đơn bị hủy hoặc hoàn trả.
- Trang tổng quan doanh thu, cài đặt shop (thông tin, phí ship, ngân hàng, pháp lý), quản lý tài khoản quản trị.

**Mở rộng (Phase 14).** Chỉ làm khi phần lõi đã chạy ổn và được yêu cầu:
- mã giảm giá;
- tự xác nhận chuyển khoản (SePay);
- tự hủy đơn chuyển khoản quá hạn;
- tài khoản khách hàng;
- nhập sản phẩm hàng loạt từ CSV;
- GA4 / Meta Pixel;
- kết nối GHN/GHTK;
- đánh giá sản phẩm.

**Không làm:** đa ngôn ngữ, đa tiền tệ, blog, app mobile, nhiều người bán.

## 3. Tech stack

Không đổi nếu chưa được đồng ý.

| Hạng mục | Lựa chọn |
|---|---|
| Framework | Next.js (bản stable mới nhất, App Router), React, TypeScript strict |
| Giao diện | Tailwind CSS v4 + shadcn/ui (Radix), dùng cho cả cửa hàng và admin |
| Database | PostgreSQL trên **Supabase** (region Singapore) |
| ORM / migration | **Drizzle ORM** + `drizzle-kit`, driver `postgres` (postgres.js) |
| Đăng nhập | **Better Auth** (email + mật khẩu, plugin `admin`), Drizzle adapter |
| Lưu ảnh | **Supabase Storage**, bucket public `media` |
| Form / validate | `react-hook-form`, `@hookform/resolvers`, `zod` (một schema dùng chung cho client và server) |
| Giỏ hàng | `zustand` + `persist` (localStorage) |
| Slider | `embla-carousel-react` |
| Icon | `lucide-react` |
| Toast | `sonner` (cài qua shadcn) |
| Email | **Resend** |
| Test | `vitest` (unit + integration), `@playwright/test` (E2E) |
| Script | `tsx`, `dotenv`, `sharp` (chỉ dùng trong script import ở Phase 14e) |
| Hosting | **Vercel**, function region `sin1` (Singapore, gần database) |
| Font | Be Vietnam Pro qua `next/font/google` |

Các gói mà shadcn tự cài kèm (radix-ui, class-variance-authority, clsx, tailwind-merge…) được phép dùng.

## 4. Môi trường và chi phí

- Có 2 project Supabase:
  - `cham-stu-dev`: dùng khi dev.
  - `cham-stu-prod`: web thật. **Không bao giờ** chạy seed dữ liệu mẫu hay chạy test trên prod.
- Integration test và E2E dùng một Postgres riêng (xem `ARCHITECTURE.md` mục 15).
- Vercel: mỗi nhánh có một bản preview; nhánh `main` là production.
- Danh sách biến môi trường: xem `ARCHITECTURE.md` mục 14.

Chi phí dự kiến (chủ shop kiểm tra lại bảng giá hiện tại):

| Dịch vụ | Gói | Ghi chú |
|---|---|---|
| Vercel | Pro (~20 USD/tháng) | Gói Hobby miễn phí chỉ dành cho **mục đích phi thương mại**. Web bán hàng cần gói Pro |
| Supabase | Free khi thử nghiệm, Pro (~25 USD/tháng) khi chạy thật | Gói Pro có backup hằng ngày và không bị tạm dừng |
| Resend | Free | Đủ cho shop nhỏ |
| Tên miền | .vn hoặc .com | |
| SePay (Phase 14b) | Theo gói | Chỉ cần khi muốn tự xác nhận chuyển khoản |

## 5. Bộ tài liệu

| File | Nội dung |
|---|---|
| `AGENTS.md` (gốc) | Quy tắc bắt buộc, lệnh, khi nào phase được coi là xong. Codex tự đọc file này mỗi phiên |
| `docs/PLAN.md` | File này: mục tiêu, stack, các phase, việc của chủ shop |
| `docs/ARCHITECTURE.md` | Kiến trúc FE/BE: thư mục, Server/Client Component, API, lỗi, cache, auth, bảo mật, env, test |
| `docs/DATABASE.md` | Các bảng, enum, quy tắc đơn hàng / tồn kho / thanh toán, settings, seed |
| `docs/STOREFRONT.md` | Design system và đặc tả từng trang cửa hàng |
| `docs/ADMIN.md` | Đặc tả từng trang quản trị |

---

## 6. Các phase

Quy trình mỗi phase:
1. Làm xong phần việc.
2. Tự kiểm tra theo mục **Nghiệm thu** của phase và mục "Một phase chỉ được coi là xong khi" trong `AGENTS.md`.
3. Commit với message `phase-N: <mô tả>`.
4. Viết báo cáo.

Phase sau chỉ được làm khi đã được giao.

### Phase 0 — Khởi tạo dự án

1. Thư mục gốc đã có `AGENTS.md` và `docs/`, nên không chạy create-next-app thẳng vào đây được. Tạo dự án vào một thư mục tạm:
   ```bash
   npx create-next-app@latest .scaffold --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --yes
   ```
   Sau đó:
   - Chuyển toàn bộ nội dung `.scaffold/` lên thư mục gốc, kể cả file ẩn như `.gitignore`.
   - Xóa thư mục `.scaffold/`.
   - **Không ghi đè** `AGENTS.md` và `docs/`.
   - Nếu create-next-app có sinh `AGENTS.md` hoặc `CLAUDE.md` riêng: chép nội dung file đó vào cuối `AGENTS.md` gốc, dưới tiêu đề "Ghi chú từ Next.js", rồi xóa file thừa.
2. Chạy `git init` và tạo commit đầu tiên.
3. Cài thư viện:
   ```bash
   npm i drizzle-orm postgres better-auth @supabase/supabase-js zod react-hook-form @hookform/resolvers zustand embla-carousel-react lucide-react resend server-only
   npm i -D drizzle-kit vitest @playwright/test tsx dotenv sharp
   npx shadcn@latest init
   npx shadcn@latest add button input textarea label select checkbox radio-group dialog sheet accordion dropdown-menu table tabs badge separator skeleton sonner
   ```
4. Thêm script vào `package.json`:
   - `typecheck`: `tsc --noEmit`
   - `test`: `vitest run`
   - `e2e`: `playwright test`
   - `db:generate`, `db:migrate`, `db:studio`: chạy các lệnh tương ứng của drizzle-kit
   - `db:seed`: `tsx --conditions=react-server src/server/db/seed.ts`
5. Tạo các phần nền móng:
   - Khung thư mục theo `ARCHITECTURE.md` mục 2.
   - `src/server/env.ts`: validate biến môi trường bằng zod.
   - `.env.example`.
   - `vercel.json` với `regions: ["sin1"]`.
   - Font và token màu (`STOREFRONT.md` mục 1).
   - `vitest.config.ts`: alias `server-only` → một file rỗng.
   - `next.config`: `remotePatterns` cho Supabase Storage và security headers (`ARCHITECTURE.md` mục 13).
- **Nghiệm thu:**
  - `npm run dev` chạy được, trang chủ hiện chữ "Cham.stu" bằng font Be Vietnam Pro.
  - Thiếu biến môi trường bắt buộc thì báo lỗi ghi rõ tên biến.
  - lint, typecheck, test, build đều pass.

### Phase 1 — Database và dữ liệu mẫu

- Viết schema Drizzle cho mọi bảng trong `DATABASE.md` mục 3, trừ các bảng ghi "Phase 14".
- Sinh bảng auth bằng CLI của Better Auth.
- Tạo migration bật `pg_trgm` và bật RLS cho mọi bảng.
- Viết `drizzle.config.ts`, tạo migration đầu tiên, chạy được `db:migrate` lên `cham-stu-dev`.
- Viết seed theo `DATABASE.md` mục 7.
- **Nghiệm thu:**
  - Chạy `db:migrate` rồi `db:seed --sample` **2 lần liên tiếp** đều không lỗi và không bị nhân đôi dữ liệu.
  - `db:studio` thấy đủ bảng và dữ liệu.
  - Seed từ chối chạy `--sample` khi `NODE_ENV=production`.

### Phase 2 — Logic nghiệp vụ và services (chưa có giao diện)

- Phần `lib`: `src/lib/domain/*`, `format.ts`, `normalize.ts`, `validation/*`, `result.ts`.
- Services:
  - `catalog`, `settings`, `cart` (quote);
  - `order` (`placeOrder`, `updateStatus`, `markPaid`, `lookup`);
  - `inventory`.
- Helper: `AppError`, `runAction`, `rateLimit`, `cached` / `invalidate`.
- **Nghiệm thu:**
  - Có unit test cho toàn bộ `lib/domain`, `format`, `normalize`.
  - Có integration test (chạy với `TEST_DATABASE_URL`) cho các trường hợp:
    - đặt đơn trừ kho đúng;
    - 2 đơn cùng lúc tranh **1 sản phẩm cuối** thì đúng 1 đơn thành công;
    - gửi lại cùng `idempotencyKey` không tạo đơn thứ hai;
    - giá đã đổi thì trả `PRICE_CHANGED`;
    - hủy đơn thì hoàn kho;
    - chuyển trạng thái sai thì trả `INVALID_TRANSITION`.

### Phase 3 — Đăng nhập và khung admin

- Better Auth (`/api/auth/[...all]`), tắt đăng ký công khai.
- `requireRole()` / `requireRolePage()`.
- Trang `/admin/login`.
- Layout admin và trang tài khoản quản trị (`ADMIN.md` mục 1 và 11).
- **Nghiệm thu:**
  - Chưa đăng nhập mà vào `/admin/*` thì bị chuyển tới `/admin/login`.
  - `staff` không vào được Cài đặt và Tài khoản: vào trang thì bị chặn, gọi action trực tiếp thì nhận `FORBIDDEN`.
  - Đăng xuất hoạt động.
  - Admin dùng tốt ở màn hình 375px.

### Phase 4 — Admin: danh mục, sản phẩm, ảnh, tồn kho

- Làm theo `ADMIN.md` mục 4–6: danh mục, danh sách sản phẩm, form sản phẩm (ảnh, màu, size, ma trận biến thể), upload ảnh (`/api/admin/upload`), lịch sử tồn kho.
- **Nghiệm thu:**
  - Tạo được sản phẩm 3 màu × 4 size.
  - Upload được 6 ảnh; ảnh không vuông tự chuyển về 1200×1200 nền trắng, không bị cắt.
  - Đổi được thứ tự ảnh và gán ảnh theo màu.
  - Sửa tồn kho thì có dòng ghi trong `stock_movements`.
  - Slug trùng thì báo lỗi ngay dưới ô nhập.
  - Rời trang khi chưa lưu thì có cảnh báo.

### Phase 5 — Admin: bộ sưu tập, banner, cài đặt

- Làm theo `ADMIN.md` mục 7, 8, 10. Mọi thay đổi gọi `invalidate()` cho tag cache tương ứng.
- **Nghiệm thu:** đổi phí ship, thông tin liên hệ hoặc banner trong admin thì cửa hàng cập nhật ngay sau khi lưu, không cần deploy lại.

### Phase 6 — Cửa hàng: layout chung và trang chủ

- Làm theo `STOREFRONT.md` mục 2–3: announcement bar, header, mega menu, menu mobile, gợi ý tìm kiếm, footer, nút liên hệ nổi, trang chủ.
- **Nghiệm thu:**
  - Toàn bộ dữ liệu lấy từ database.
  - Không có thanh cuộn ngang ở 375/768/1280px.
  - Menu mobile và các drawer đóng được bằng phím Esc và bằng cách bấm ra ngoài (overlay).
  - Phần nào chưa có thông tin trong cài đặt (ví dụ Zalo) thì tự ẩn.

### Phase 7 — Cửa hàng: danh mục, tìm kiếm, sản phẩm

- Làm theo `STOREFRONT.md` mục 4–6 và 14 (`loading.tsx`, `error.tsx`, 404).
- **Nghiệm thu:**
  - Bộ lọc và sắp xếp nằm trên URL; reload trang vẫn giữ nguyên.
  - Tìm "ao thun" ra sản phẩm "Áo thun".
  - Không chọn được biến thể hết hàng.
  - Chọn màu thì ảnh đổi theo màu.
  - Sản phẩm `draft` hoặc `archived` trả 404.

### Phase 8 — Giỏ hàng

- Làm theo `STOREFRONT.md` mục 7 và `ARCHITECTURE.md` mục 10: cart store, `/api/cart/quote`, cart drawer, trang `/cart`.
- **Nghiệm thu:**
  - Giá trong giỏ luôn khớp database: đổi giá trong admin thì giỏ cập nhật theo.
  - Số lượng không vượt tồn kho.
  - Sản phẩm đã ngừng bán thì hiện cảnh báo kèm nút xóa.
  - Reload trang vẫn giữ giỏ, không có lỗi hydration.

### Phase 9 — Thanh toán, tạo đơn, email

- Làm theo `STOREFRONT.md` mục 8–9: `placeOrderAction`, email xác nhận cho khách, email báo đơn mới cho shop (kèm Telegram nếu có cấu hình).
- **Nghiệm thu:**
  - Đặt được đơn COD và đơn chuyển khoản; tồn kho giảm đúng.
  - Bấm "Đặt hàng" 2 lần thật nhanh chỉ tạo 1 đơn.
  - Sửa giá bằng DevTools không làm thay đổi tổng tiền.
  - Trang thành công hiện mã QR đúng số tiền và đúng nội dung chuyển khoản (mã đơn).
  - Mở trang thành công với token sai thì trả 404.
  - Email gửi được. Ở dev, khi chưa có Resend thì email được log ra console.

### Phase 10 — Admin: đơn hàng và tổng quan

- Làm theo `ADMIN.md` mục 2–3.
- **Nghiệm thu:**
  - Chỉ hiện các nút chuyển trạng thái hợp lệ với trạng thái hiện tại.
  - Hủy đơn bắt buộc nhập lý do và hoàn kho.
  - Chuyển đơn sang "Đang giao" có mã vận đơn thì khách nhận được email.
  - Mọi thay đổi đều hiện trong lịch sử đơn.
  - Dùng tốt trên điện thoại.

### Phase 11 — Tra cứu đơn, liên hệ, trang chính sách

- Làm theo `STOREFRONT.md` mục 10–11 và `ADMIN.md` mục 9.
- **Nghiệm thu:**
  - Nhập đúng mã đơn + SĐT thì ra đơn.
  - Nhập sai thì chỉ báo chung "Không tìm thấy đơn hàng", không để lộ mã đơn nào có thật.
  - Quá 10 lần trong 10 phút thì trả `RATE_LIMITED`.
  - Tin nhắn liên hệ hiện trong admin.

### Phase 12 — SEO, hiệu năng, bảo mật, E2E

- Làm theo `STOREFRONT.md` mục 12 và `ARCHITECTURE.md` mục 13, 15.
- **Nghiệm thu:**
  - Lighthouse mobile (đo trang chủ và 1 trang sản phẩm): Performance ≥ 85, Accessibility ≥ 95, SEO ≥ 95.
  - `/sitemap.xml` có đủ URL.
  - Các trang admin, checkout, tra cứu đơn có `noindex`.
  - Playwright pass cả 4 kịch bản trong `ARCHITECTURE.md` mục 15.

### Phase 13 — Deploy production và tài liệu vận hành

- Viết hướng dẫn từng bước:
  - tạo Supabase prod, bucket `media`;
  - chạy migrate, chạy seed **không** có `--sample`;
  - tạo project Vercel, đặt biến môi trường;
  - gắn tên miền, xác minh domain gửi mail trên Resend.
- `README.md` tiếng Việt cho chủ shop, gồm:
  - đăng nhập admin;
  - thêm sản phẩm;
  - quy trình xử lý đơn hằng ngày;
  - đổi banner, sửa cài đặt;
  - xử lý khi quên mật khẩu admin;
  - checklist trước khi mở bán.
- **Nghiệm thu:** đặt 1 đơn thật trên production và xử lý tới trạng thái "Hoàn thành" bằng trang admin.

### Phase 14 — Mở rộng

Mỗi mục là một phase riêng, làm theo thứ tự khi được yêu cầu:

- **14a Mã giảm giá:**
  - Tạo bảng `discount_codes`, admin có trang thêm/sửa/xóa mã.
  - Có ô nhập mã ở giỏ hàng và trang checkout; quote tính cả giảm giá.
- **14b SePay:**
  - Webhook `/api/webhooks/sepay` tự đánh dấu "đã thanh toán" khi nội dung chuyển khoản chứa mã đơn và số tiền đủ.
  - Trang thành công tự đổi sang "Đã nhận thanh toán".
- **14c Tự hủy đơn:**
  - Vercel Cron gọi `/api/cron/cancel-unpaid`.
  - Hủy các đơn chuyển khoản chưa thanh toán quá `autoCancelUnpaidHours` và hoàn kho.
- **14d Tài khoản khách hàng:** đăng ký/đăng nhập, lịch sử đơn, sổ địa chỉ, tự điền thông tin khi checkout.
- **14e Import CSV:**
  - Lệnh `npm run import:products` đọc `import/products.csv` và ảnh trong `import/images/<mã-sp>/`. Chủ shop chuẩn bị file này từ dữ liệu trên Shopee.
  - Có chế độ chạy thử `--dry-run`.
- **14f GA4 / Meta Pixel:** gửi các sự kiện `view_item`, `add_to_cart`, `begin_checkout`, `purchase`.
- **14g GHN/GHTK:** tính phí ship theo địa chỉ, tạo vận đơn ngay từ admin.
- **14h Đánh giá sản phẩm:** khách đã mua được đánh giá sao và gửi ảnh, admin duyệt trước khi hiện.

---

## 7. Chủ shop cần chuẩn bị

- [ ] Tài khoản Supabase, Vercel, Resend, GitHub (Vercel deploy từ GitHub)
- [ ] Tên miền
- [ ] Logo (SVG hoặc PNG nền trong suốt) và favicon
- [ ] Ảnh gốc của sản phẩm (ảnh vuông như trên Shopee, càng nét càng tốt), ảnh banner bản desktop và mobile
- [ ] Danh sách sản phẩm: mã sản phẩm, tên, giá, giá gốc, màu, size, tồn kho, mô tả, chất liệu
- [ ] Danh mục thật và bảng size thật
- [ ] SĐT, Zalo, email, địa chỉ, giờ làm việc, link Facebook / Instagram / TikTok / Messenger
- [ ] Phí ship, điều kiện freeship, chính sách đổi trả
- [ ] Tài khoản ngân hàng nhận chuyển khoản
- [ ] Quy trình nội bộ: ai xử lý đơn, giao qua hãng vận chuyển nào

## 8. Pháp lý

Chủ shop tự làm các việc dưới đây; web chỉ chừa sẵn chỗ hiển thị.

- Web bán hàng tại Việt Nam phải **thông báo website thương mại điện tử với Bộ Công Thương** tại online.gov.vn. Sau khi được xác nhận, nhập link và ảnh logo vào Cài đặt → Pháp lý để footer hiện logo "Đã thông báo Bộ Công Thương".
- Footer phải hiện tên chủ thể kinh doanh, mã số thuế / số ĐKKD và địa chỉ. Các thông tin này nhập ở Cài đặt → Pháp lý.
- SĐT và địa chỉ của khách là dữ liệu cá nhân. Web cần có trang Chính sách bảo mật rõ ràng và ô "đồng ý" khi đặt hàng (đã có trong plan). Nên nhờ người có chuyên môn pháp lý rà lại nội dung các trang chính sách.
