# Báo cáo Phase 1 — Database và dữ liệu mẫu

Ngày: 27/10/2026. **Chưa nghiệm thu hoàn tất: còn thiếu kết nối Supabase dev.**

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
| Drizzle Studio | Khởi động/kết nối thành công với PostgreSQL kiểm thử; chưa kiểm tra trực quan bảng trên Studio |
| Migrate/seed trên `cham-stu-dev` | **Chưa chạy: Supabase chưa kết nối** |

Phase này không thay đổi giao diện nên không kiểm tra lại responsive. Trang chủ vẫn là khung Phase 0. Không chuyển sang Phase 2 khi Phase 1 chưa đạt đủ nghiệm thu.

## Điểm kỹ thuật và mâu thuẫn tài liệu

- CLI Better Auth từ chối cấu hình có `import "server-only"`, kể cả khi Node có điều kiện react-server. Script tạo bản cấu hình tạm ở gốc, gọi CLI rồi xóa ngay; file server gốc vẫn giữ server-only. Chỉ chuẩn hóa đầu ra được sinh, không viết tay bảng auth.
- Tài liệu Drizzle mới mô tả `pgTable.withRLS`, nhưng phiên bản 0.45.4 cài trong dự án dùng `.enableRLS()`. Đã đối chiếu API trong package và kiểm tra trực tiếp trên PostgreSQL.
- Bảng banner/size chart/ảnh không có khóa tự nhiên duy nhất để upsert: seed dùng UUID xác định cho dữ liệu mẫu; danh mục/sản phẩm/màu/biến thể dùng khóa duy nhất trong thiết kế. Lịch sử kho ban đầu chỉ thêm khi biến thể được tạo mới.
- Các điểm mâu thuẫn đã ghi ở báo cáo Phase 0 vẫn giữ nguyên; chưa triển khai action trong Phase 1.

## Cần chủ shop cung cấp

Cần kết nối tài khoản Supabase để tạo project **Free `cham-stu-dev`, Singapore**, bucket public `media` và điền các thông tin kết nối thật vào `.env`. Cần email admin ban đầu; mật khẩu có thể sinh riêng và lưu local. Không gửi secret qua chat hoặc commit Git. Hiện không có quyền truy cập Supabase đã được xác nhận nên chưa tạo project và không giả định đã kết nối.

Sau khi có kết nối: chạy migrate và seed hai lượt trên dev, xem đủ bảng/dữ liệu bằng Studio, kiểm tra lại các lệnh bắt buộc, cập nhật báo cáo rồi mới nghiệm thu Phase 1 và chuyển Phase 2. Chưa deploy website, chưa thực hiện Phase 14.
