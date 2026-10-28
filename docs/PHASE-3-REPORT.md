# Báo cáo Phase 3 — Đăng nhập và khung quản trị

Ngày: **28/10/2026**.

## Đã làm

- Better Auth **1.7.14**, Drizzle adapter có transaction, plugin admin có vai trò `staff`/`admin`, `nextCookies` ở cuối danh sách plugin. Tắt đăng ký công khai, phiên lưu DB, tắt cookie cache và bật rate limit. Action đăng nhập còn có bộ giới hạn PostgreSQL dùng chung giữa các request.
- `/admin/login` có form react-hook-form + zod, thông báo sai thông tin chung, nút hiện/ẩn mật khẩu. Chặn nhập trước hydration; `next` chỉ chấp nhận đường dẫn nội bộ `/admin`, giữ query an toàn. Người đã đăng nhập vào lại login được chuyển về admin.
- `getSessionUser`, `requireRole`, `requireRolePage` kiểm tra phiên và đọc quyền/khóa mới nhất từ DB; không tin vai trò gửi từ client hoặc giá trị cookie cache cũ. Proxy Next.js 16 chỉ kiểm tra cookie để chuyển hướng sơ bộ; mọi page và action đều tự kiểm tra quyền.
- Khung admin có sidebar 240px, topbar, xem cửa hàng, menu tài khoản, đổi mật khẩu và đăng xuất. Mobile có Sheet, đóng bằng Esc hoặc overlay; danh sách tài khoản chuyển thành card. Các mục chưa đến phase tương ứng ghi “Sắp có”. Badge đơn chờ/tin mới đọc DB.
- Trang `/admin/users` có tìm kiếm/phân trang trên URL, thêm tài khoản, đổi vai trò, khóa/mở khóa và đặt lại mật khẩu nhân viên. Mật khẩu hash bằng API Better Auth; không trả token/hash/mật khẩu từ service tài khoản.
- Khóa advisory chung bảo vệ các thao tác tài khoản đồng thời; service kiểm tra lại quyền người thao tác trong transaction. Chặn tự khóa/tự hạ quyền, giữ ít nhất một admin hoạt động. Khóa/đổi vai trò/reset mật khẩu thu hồi phiên của người bị thay đổi. Đổi mật khẩu bản thân yêu cầu mật khẩu cũ và thu hồi các phiên khác.
- `noindex` cho toàn bộ admin; trang từ chối truy cập cho staff. `/admin/settings` chỉ là khung có guard; chưa có form cài đặt Phase 5. Action cài đặt được đặt sẵn biên validate → admin guard → service để nghiệm thu việc gọi trực tiếp vẫn `FORBIDDEN`.
- README hướng dẫn đăng nhập bằng thông tin trong `.env`, cấp tài khoản, cấp lại mật khẩu nhân viên và khôi phục admin bằng seed email mới không dùng dữ liệu mẫu.

## Kiểm tra

| Kiểm tra | Kết quả |
|---|---|
| `npm run lint` / `npm run typecheck` | Pass |
| `npm run test` | **95/95 pass**, gồm 10 integration auth mới trên PostgreSQL riêng |
| `npm run build` | Pass |
| `npm run e2e:admin` | **9/9 pass**, không có page error hoặc hydration error |
| Admin Supabase thật qua localhost:3000 | Đăng nhập → trang tài khoản → đăng xuất pass; không tạo tài khoản thử trên Supabase |
| Chưa đăng nhập vào admin | Chuyển về login, giữ đường dẫn quay lại |
| Staff truy cập URL Tài khoản/Cài đặt | Bị chuyển tới trang từ chối truy cập |
| Gọi trực tiếp action tài khoản/cài đặt dưới quyền staff | `FORBIDDEN`; chưa đăng nhập là `UNAUTHORIZED` |
| Tự khóa/tự hạ quyền; hai admin cùng hạ quyền nhau | Chặn; luôn còn một admin hoạt động |
| Đăng xuất / khóa / đổi vai trò / reset mật khẩu | Phiên cũ không còn quyền sử dụng |
| Native signup/admin API bypass | Bị chặn |
| Browser 375/768/1280px | Login, trang chào, danh sách và form tài khoản không tràn ngang; đã xem ảnh |

E2E admin dùng `npm run e2e:admin`, chỉ trỏ `TEST_DATABASE_URL`; script kiểm tra hậu tố `_test` và chặn địa chỉ trùng dev/prod. Không chạy đồng thời với unit/integration vì cùng fixture test. Screenshot và trace chỉ chứa dữ liệu kiểm thử, ở `test-results/` bị Git bỏ qua.

Đã xem ảnh giao diện login, trang chào, danh sách và form tại các kích thước kiểm thử. Lượt đầu phát hiện selector thông báo lỗi trùng route announcer và thời gian chờ route compile ngắn; đã sửa và chạy lại đủ 9 luồng. Cảnh báo caret do chụp ảnh trước hydration được xử lý bằng chờ form sẵn sàng; lượt cuối bắt lỗi console/page tự động và không còn cảnh báo hydration. Đã kiểm tra secret trong toàn bộ file staged và bundle `.next/static`: không có giá trị secret của `.env`.

## Lựa chọn kỹ thuật và phạm vi

- Đã đối chiếu mã/types package đang cài và hướng dẫn [Better Auth + Next.js](https://better-auth.com/docs/integrations/next), [admin plugin](https://better-auth.com/docs/plugins/admin), cùng guide `proxy`, authentication của Next.js 16.4.3 trong `node_modules/next/dist/docs/`.
- Route `/api/auth/[...all]` giữ GET `/get-session` của Better Auth. Các mutation HTTP gốc bị từ chối; đăng nhập/đăng xuất/đổi mật khẩu/tài khoản đi qua Server Actions đã validate. Lý do: native admin endpoints không tự có quy tắc “không tự hạ quyền, không khóa admin cuối” của shop; mở chúng sẽ cho phép vượt service. Native GET session trả hợp đồng Better Auth, không bọc `ActionResult`; action của shop dùng `ActionResult`.
- Không dùng Supabase Auth; Better Auth quản lý bảng `user/session/account/verification` trên PostgreSQL Supabase theo kiến trúc đã chọn. Không thêm migration, thư viện, bảng hoặc mở RLS policy.
- Hướng dẫn schema trong skill Supabase dùng CLI Supabase, trong khi AGENTS yêu cầu Drizzle migration. Phase này không thay schema; tiếp tục giữ quy tắc Drizzle của dự án.
- `/admin` mới là trang chào và khung tài khoản; tổng quan doanh thu/biểu đồ thuộc Phase 10. Các trang CRUD sản phẩm, danh mục, đơn hàng… chưa được mở. Không thực hiện Phase 4 hoặc deploy production.

## Cần chủ shop

Không cần thêm API key hoặc mật khẩu cho Phase 3. Email và mật khẩu admin ban đầu đã lưu tại `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD` trong `.env` trên máy; không đưa lên GitHub. Chủ shop có thể đăng nhập local để xem và cấp tài khoản nhân viên.

Web local đã được khởi động tại `http://localhost:3000/admin/login` để chủ shop xem. GitHub Pages vẫn chỉ là bản duyệt storefront tĩnh; trang quản trị và Supabase chạy qua Next.js local, chưa deploy production.
