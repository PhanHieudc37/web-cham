# Báo cáo Phase 1 — Database và dữ liệu mẫu

Cập nhật: **28/10/2026 — đã nghiệm thu Phase 1 trên Supabase dev.**

## Nghiệm thu Supabase thật

- Kết nối transaction pooler 6543 và session pooler 5432 đã pass; project `cham-stu-dev` do chủ shop tạo tại **Tokyo (`ap-northeast-1`)**, khác Singapore trong plan. Giữ project chủ shop đã cung cấp, ghi nhận sai khác; không tạo lại/xóa database.
- Đã chạy migration và seed mẫu **hai lượt liên tiếp trên dev**. So sánh số dòng cả 20 bảng trước/sau lượt hai: không đổi. Có 12 sản phẩm, 90 biến thể, 30 màu, 12 ảnh, 12 danh mục, 2 bảng size, 10 settings, 1 collection/4 liên kết, 1 banner và 1 admin. Không có đơn hàng giả hoặc dữ liệu khách.
- Tất cả 20 bảng ứng dụng bật RLS, không policy; extension `pg_trgm` có mặt. Không sửa migration đã áp dụng.
- Admin tạo theo email chủ shop cung cấp; mật khẩu mạnh được sinh và lưu riêng ở `ADMIN_SEED_PASSWORD` trong `.env`. Không đưa tài khoản/mật khẩu hoặc key vào báo cáo/Git.
- Secret key server mới đã được chủ shop điền vào `.env`, kiểm tra API Storage thành công; đã tạo public bucket `media`, MIME ảnh WebP/JPEG/PNG, tối đa 2 MB.
- Drizzle Studio chạy ở cổng local 4984, API init trả PostgreSQL và API proxy đọc đủ 20 bảng/RLS cùng các số đếm dữ liệu mẫu từ Supabase. Xác nhận bằng API Studio, không tự nhận đã kiểm tra bằng ảnh giao diện.
- Lint/typecheck/build pass; 20 unit/integration test pass trên PostgreSQL local riêng, không truncate Supabase dev. Phase không có thay đổi giao diện nên không chạy lại responsive.

## Đã làm và kiểm tra

- GitHub đã tạo và đổi tên repo công khai thành `PhanHieudc37/web-cham`; push thành công Phase 0 lên `main`, xác minh SHA trên remote khớp local. Không đưa `.env` hoặc secret lên GitHub.
- Schema Drizzle đủ 20 bảng trong DATABASE mục 3, không tạo bảng Phase 14. UUID, integer VND, khóa ngoại, index, check constraint và timestamp có múi giờ theo tài liệu.
- Bốn bảng auth được sinh bằng CLI Better Auth **1.7.14**, gồm cột plugin admin. Script tái sinh dùng đúng phiên bản và chuẩn hóa SQL snake_case, TypeScript camelCase, timestamptz và RLS. Chưa mở endpoint đăng nhập của Phase 3.
- Migration sinh bằng `drizzle-kit generate`: `0000` bật `pg_trgm`, `0001` tạo schema và bật RLS trên mọi bảng ứng dụng, không có policy. Chưa sửa migration đã chạy.
- PostgreSQL client dùng `prepare: false`; Drizzle config dùng `DIRECT_URL`. Môi trường seed kiểm tra tài khoản admin và kết nối riêng, không đòi key Storage không dùng đến.
- Seed có 10 settings mặc định, admin qua API server của Better Auth, 12 danh mục, 2 bảng size, 12 sản phẩm/biến thể/ảnh placeholder, bộ sưu tập 4 sản phẩm và 1 banner. Không bịa thông tin shop. Seed không ghi đè dữ liệu đã chỉnh sửa; mật khẩu admin được hash bởi Better Auth.
- Database kiểm thử PostgreSQL 16 chạy trong Docker, chỉ mở loopback cổng 55432; mật khẩu ngẫu nhiên nằm trong `.env.test.local` bị Git bỏ qua. Không thay `.env` local thành database test.

| Kiểm tra | Kết quả |
|---|---|
| lint / typecheck / build | Pass |
| `npm run test` | Pass, 20 ca gồm 3 integration thật |
| Migration chạy lại | Pass trên PostgreSQL kiểm thử |
| CLI migrate → seed --sample, hai lượt liên tiếp | Pass trên PostgreSQL kiểm thử |
| Seed hai lần, số dòng mọi bảng không đổi | Pass |
| Giữ settings, giá và stock đã sửa | Pass |
| Đủ 20 bảng bật RLS, không policy, không timestamp thiếu múi giờ | Pass |
| Mật khẩu admin hash hợp lệ, không lưu plaintext | Pass |
| Chặn --sample trong production trước khi ghi | Pass |
| Drizzle Studio | Init/proxy HTTP 200, đọc đủ bảng và dữ liệu mẫu Supabase dev |
| Migrate/seed trên `cham-stu-dev` | **Pass hai lượt, số dòng không đổi** |

Phase này không thay đổi giao diện nên không kiểm tra lại responsive. Trang chủ thật vẫn là khung Phase 0; bản xem thử GitHub Pages là milestone riêng. Phase 1 đủ điều kiện chuyển Phase 2 sau commit nghiệm thu.

## Điểm kỹ thuật và mâu thuẫn tài liệu

- CLI Better Auth từ chối cấu hình có `import "server-only"`, kể cả khi Node có điều kiện react-server. Script tạo bản cấu hình tạm ở gốc, gọi CLI rồi xóa ngay; file server gốc vẫn giữ server-only. Chỉ chuẩn hóa đầu ra được sinh, không viết tay bảng auth.
- Tài liệu Drizzle mới mô tả `pgTable.withRLS`, nhưng phiên bản 0.45.4 cài trong dự án dùng `.enableRLS()`. Đã đối chiếu API trong package và kiểm tra trực tiếp trên PostgreSQL.
- Bảng banner/size chart/ảnh không có khóa tự nhiên duy nhất để upsert: seed dùng UUID xác định cho dữ liệu mẫu; danh mục/sản phẩm/màu/biến thể dùng khóa duy nhất trong thiết kế. Lịch sử kho ban đầu chỉ thêm khi biến thể được tạo mới.
- Các điểm mâu thuẫn đã ghi ở báo cáo Phase 0 vẫn giữ nguyên; chưa triển khai action trong Phase 1.

## Cần chủ shop cung cấp

Chủ shop đã cung cấp project dev, mật khẩu database, email admin và server key. Phase 1 không còn thiếu thông tin. Cần duyệt ảnh, sản phẩm, chính sách và thông tin shop thật ở các phase giao diện sau. Chưa deploy production, chưa thực hiện Phase 14.
