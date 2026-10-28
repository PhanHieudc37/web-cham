# Cham.stu

Website cửa hàng và trang quản trị, phát triển theo từng phase trong [docs/PLAN.md](docs/PLAN.md).

Hiện tại: **Phase 0–3 đã nghiệm thu**, gồm Supabase dev, services nghiệp vụ, đăng nhập/phân quyền và khung quản trị với trang tài khoản. Project chủ shop tạo ở Tokyo, khác Singapore dự kiến. Trang chủ thật chưa có chức năng bán hàng; bước tiếp theo là Phase 4 (quản trị danh mục, sản phẩm, ảnh, tồn kho). Bản xem thử riêng trên GitHub Pages vẫn dùng để góp ý giao diện.

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

Máy phát triển đã có `.env` local, secret ngẫu nhiên riêng và kết nối Supabase dev thật. Các dịch vụ chưa cấu hình như Resend vẫn để trống; không điền thông tin kết nối giả.

Phase 0 kiểm tra bốn biến local ngay khi khởi động và build. `getServerEnv()` yêu cầu thông tin PostgreSQL và Supabase khi dùng dịch vụ ở các phase sau. `npm start` kiểm tra toàn bộ biến production, gồm email; thiếu biến thì dừng và nêu tên biến, không in giá trị nhạy cảm. Build khung giao diện không cần kết nối dịch vụ.

## Kiểm tra

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run e2e
npm run e2e:admin
```

E2E Phase 0 tự chạy dev server riêng ở cổng 3100, kiểm tra trang chủ, font và tràn ngang tại 375/768/1280px. Lần đầu có thể cần `npx playwright install chromium`. Bốn luồng bán hàng E2E sẽ làm ở Phase 12.

`npm run e2e:admin` kiểm tra đăng nhập, quyền truy cập, tài khoản, đổi mật khẩu và responsive trên PostgreSQL test riêng. Lệnh tự tạo lại tài khoản test, xóa bảng user/session/account liên quan và rate limit **trong database kiểm thử**. Không chạy đồng thời với `npm run test` vì dùng cùng fixture. Có kiểm tra chặn địa chỉ dev/prod trước khi seed. Không chạy server khác ở cổng 3100 khi kiểm tra.

## Đăng nhập và tài khoản quản trị

1. Chạy `npm run dev`, mở [localhost:3000/admin/login](http://localhost:3000/admin/login).
2. Dùng email trong `ADMIN_SEED_EMAIL` và mật khẩu trong `ADMIN_SEED_PASSWORD` của `.env` trên máy. Không gửi mật khẩu hoặc file `.env` cho người khác.
3. Vào **Tài khoản → Thêm tài khoản**, nhập tên/email/mật khẩu tạm và chọn **Nhân viên** hoặc **Quản trị viên**. Tự gửi riêng mật khẩu tạm cho thành viên; hệ thống chưa gửi email cấp tài khoản.
4. Thành viên đổi mật khẩu trong menu tài khoản góc trên. Cần nhập mật khẩu cũ; đổi xong thu hồi các phiên khác.
5. Trong danh sách tài khoản, quản trị viên có thể đổi vai trò, khóa/mở khóa hoặc đặt lại mật khẩu. Khóa/đổi vai trò/đặt lại mật khẩu sẽ thu hồi các phiên của tài khoản bị thay đổi. Không thể tự khóa/tự hạ quyền; luôn giữ ít nhất một admin hoạt động.

Nhân viên không thấy và không truy cập được Tài khoản/Cài đặt; các action cũng kiểm tra quyền ở server. Đăng ký công khai bị tắt. Các mục sản phẩm, đơn hàng… ghi "Sắp có" trong khung admin, chỉ được mở khi phase tương ứng hoàn tất; tổng quan hiện là trang chào, chưa có số liệu kinh doanh của Phase 10.

**Quên mật khẩu nhân viên:** admin vào Tài khoản, bấm biểu tượng chìa khóa của nhân viên, nhập mật khẩu tạm mới và gửi riêng cho họ. Mật khẩu cũ và phiên cũ không còn dùng được.

**Mất toàn bộ tài khoản admin:** sửa `ADMIN_SEED_EMAIL` thành email mới chưa có trong hệ thống và đặt `ADMIN_SEED_PASSWORD` mạnh trong `.env`; chạy `npm run db:seed` **không thêm `--sample`**. Seed thêm admin còn thiếu và giữ dữ liệu shop hiện có. Không đổi mật khẩu của email đã tồn tại bằng cách chạy lại seed. Sau khi đăng nhập tài khoản mới, khóa tài khoản cũ nếu cần.

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

Đọc [báo cáo Phase 0](docs/PHASE-0-REPORT.md), [Phase 1](docs/PHASE-1-REPORT.md), [Phase 2](docs/PHASE-2-REPORT.md) và [Phase 3](docs/PHASE-3-REPORT.md) để xem trạng thái nghiệm thu.
