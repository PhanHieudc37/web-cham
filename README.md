# Cham.stu

Website cửa hàng và trang quản trị, phát triển theo từng phase trong [docs/PLAN.md](docs/PLAN.md).

Hiện tại: **Phase 0 — khởi tạo dự án**. Trang chủ chỉ hiển thị thương hiệu; chưa có chức năng bán hàng hay kết nối dữ liệu.

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

PostgreSQL dùng được; Supabase trong plan cung cấp PostgreSQL và Storage. Chuỗi kết nối PostgreSQL local cũng được validator chấp nhận. Chưa tạo schema, migration, seed hay project Supabase vì các việc đó thuộc Phase 1. Các lệnh `db:*` đã khai báo để phase sau triển khai, hiện chưa chạy được khi thiếu file và cấu hình database.

Chỉ chạy local ở giai đoạn này. Git lưu lịch sử trên máy; đưa code lên GitHub là bước riêng với deploy website. Chưa cấu hình remote, push Git hay tạo hosting. `vercel.json` chỉ lưu region dự kiến trong plan, không triển khai gì.

Đọc [báo cáo Phase 0](docs/PHASE-0-REPORT.md) trước khi giao phase tiếp theo.
