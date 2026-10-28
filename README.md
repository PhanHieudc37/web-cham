# Cham.stu

Website cửa hàng và trang quản trị, phát triển theo từng phase trong [docs/PLAN.md](docs/PLAN.md).

Hiện tại: **Phase 0 và Phase 1 đã nghiệm thu**, gồm migration/seed thật trên Supabase dev, 20 bảng bật RLS, admin đầu tiên và bucket public `media`. Project chủ shop tạo ở Tokyo, khác Singapore dự kiến. Đang tiếp tục Phase 2; trang chủ thật chưa có chức năng bán hàng. Bản xem thử riêng trên GitHub Pages vẫn dùng để góp ý giao diện.

Code công khai tại [PhanHieudc37/web-cham](https://github.com/PhanHieudc37/web-cham), nhánh `main`.

## Bản xem thử cho bạn bè góp ý

Có bản duyệt giao diện riêng tại `preview/`, không cần database hoặc `.env`. Trang chủ Next.js gốc vẫn theo tiến độ phase; bản duyệt không thay thế các chức năng bán hàng đang phát triển.

```bash
npm ci
npm run preview:dev
```

Mở [localhost:4173/web-cham](http://localhost:4173/web-cham/). Thử danh mục, tìm kiếm không dấu, xem sản phẩm, chọn màu/size và giỏ mẫu. Giỏ chỉ giữ trong bộ nhớ của tab, tải lại sẽ xóa. Không có đặt hàng, thanh toán hay thu thập thông tin cá nhân; mọi sản phẩm, giá và ảnh đều minh họa. Chưa có trang admin hoặc checkout thật trong bản duyệt.

`npm run preview:build` xuất bản tĩnh vào `.preview-dist`; `npm run preview:test` kiểm tra bằng Chromium. Font Be Vietnam Pro tự lưu trong `preview/fonts/` cùng giấy phép SIL Open Font License. Các SVG do dự án tự vẽ. Không sao chép tài sản của shop khác.

Workflow **Publish design preview** chỉ đưa `.preview-dist` lên GitHub Pages khi thay đổi source preview trên `main`, hoặc chạy thủ công tại tab Actions. **Đã xuất bản và kiểm tra:** [phanhieudc37.github.io/web-cham](https://phanhieudc37.github.io/web-cham/). Xem [báo cáo bản duyệt](docs/PREVIEW-REPORT.md) để biết kết quả kiểm tra và xuất bản thực tế.

GitHub Pages dành cho bản thiết kế góp ý này. Web bán hàng thật cần Next.js server và Supabase, triển khai theo các phase trong plan. Workflow không đọc `.env` hoặc sử dụng secret database.

## Chạy local

Cần Node.js từ 22.15 và npm. Cài thư viện bằng `npm ci`.

1. Sao chép `.env.example` thành `.env` nếu chưa có.
2. Sinh secret bằng lệnh dưới rồi điền vào `BETTER_AUTH_SECRET`. Không chia sẻ hoặc commit secret.

   ```bash
   node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
   ```

3. Giữ URL local `http://localhost:3000`, bucket `media`; chạy `npm run dev`.
4. Mở [localhost:3000](http://localhost:3000).

Máy khởi tạo dự án đã có `.env` local và secret ngẫu nhiên riêng. Các trường dịch vụ để trống có chủ đích, không chứa thông tin kết nối giả.

Phase 0 kiểm tra bốn biến local ngay khi khởi động và build. `getServerEnv()` yêu cầu thông tin PostgreSQL và Supabase khi dùng dịch vụ ở các phase sau. `npm start` kiểm tra toàn bộ biến production, gồm email; thiếu biến thì dừng và nêu tên biến, không in giá trị nhạy cảm. Build khung giao diện không cần kết nối dịch vụ.

## Kiểm tra

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run e2e
```

E2E Phase 0 tự chạy dev server riêng ở cổng 3100, kiểm tra trang chủ, font và tràn ngang tại 375/768/1280px. Lần đầu có thể cần `npx playwright install chromium`. Bốn luồng bán hàng E2E sẽ làm ở Phase 12.

## Database và triển khai

PostgreSQL dùng được; Supabase trong plan cung cấp PostgreSQL và Storage. Phase 1 đã có đủ 20 bảng, migration bật `pg_trgm`, RLS không có policy và seed chạy lại được. Schema auth sinh từ CLI Better Auth 1.7.14 qua `npm run db:auth`; script tự chuẩn hóa tên cột, thời gian và RLS theo thiết kế, không tự viết tay bảng auth.

Máy phát triển hiện đã có kết nối Supabase dev trong `.env`: `DATABASE_URL` (transaction pooler), `DIRECT_URL` (session pooler), `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (chấp nhận Secret key mới `sb_secret_...`) và tài khoản admin ban đầu `ADMIN_SEED_EMAIL`/`ADMIN_SEED_PASSWORD`. Không dùng thông tin production để thử nghiệm. Mật khẩu admin nằm trong `.env` riêng, không hiển thị trong README hoặc Git.

```bash
npm run db:migrate
npm run db:seed -- --sample
npm run db:studio
```

Seed chỉ thêm dữ liệu còn thiếu, giữ nguyên cài đặt, giá, mật khẩu và tồn kho đã có. Không dùng `--sample` trong production. Seed thông thường không có `--sample` chỉ thêm cài đặt và admin còn thiếu. CLI của Drizzle chạy với điều kiện `react-server` để tôn trọng `server-only`.

## Database kiểm thử riêng

Cần Docker Desktop đang chạy. Database này chỉ phục vụ kiểm thử; các bài integration sẽ xóa dữ liệu của nó. Tuyệt đối không trỏ `TEST_DATABASE_URL` vào database dev/prod.

```bash
npm run db:test:setup
docker compose --env-file .env.test.local -f compose.test.yml up -d
npm run test
```

Script tạo `.env.test.local` với mật khẩu ngẫu nhiên, không ghi đè file đã tồn tại. Vitest đọc kết nối kiểm thử từ file đó hoặc `TEST_DATABASE_URL`; thiếu kết nối thì bỏ qua integration test. Kiểm thử yêu cầu tên database kết thúc bằng `_test` và từ chối địa chỉ trùng database dev/prod. Database Docker chỉ mở tại `127.0.0.1:55432`.

Dừng database khi không dùng: `docker compose --env-file .env.test.local -f compose.test.yml stop`. Dữ liệu kiểm thử được giữ trong volume riêng.

Chỉ chạy local ở giai đoạn này. GitHub đã có repo công khai và remote `origin`; chưa tạo hosting. `vercel.json` chỉ lưu region dự kiến trong plan, không triển khai gì. Các file `.env*` trừ `.env.example` được Git bỏ qua.

Đọc [báo cáo Phase 0](docs/PHASE-0-REPORT.md) và [báo cáo Phase 1](docs/PHASE-1-REPORT.md) để xem trạng thái nghiệm thu.
