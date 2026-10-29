# Báo cáo Phase 9 — Checkout, tạo đơn và email

Kiểm thử ngày **28/10/2026**; hoàn tất bàn giao ngày **29/10/2026** — đã nghiệm thu trên môi trường dev/test.

## Đã làm

- Nối “MUA NGAY” và nút thanh toán trong giỏ sang `/checkout`. Layout rút gọn, tóm tắt thu gọn trên mobile/hai cột desktop, form react-hook-form + schema zod chung, 34 tỉnh/thành và địa chỉ hai cấp. COD mặc định; chuyển khoản chỉ hiện khi cấu hình ngân hàng đầy đủ. Giỏ trống quay về `/cart`.
- `placeOrderAction`: validate trước → quyền công khai/rate limit trong service → transaction tạo đơn → invalidate sản phẩm → `ActionResult`. Giá/phí ship/tồn kho luôn đọc PostgreSQL, không tin giá client.
- Giữ UUID chống trùng trong sessionStorage, có fallback bộ nhớ khi storage bị chặn; khóa gửi khi đang xử lý. Service giữ API `placeOrder` cũ và thêm outcome nội bộ để biết đúng lượt vừa tạo đơn, tránh gửi thông báo lần nữa khi retry.
- `PRICE_CHANGED` mở Dialog so tổng trước/mới và yêu cầu đồng ý; `OUT_OF_STOCK` liệt kê dòng, lấy lại quote và khóa đặt hàng khi còn lỗi. Lỗi validate ở dưới ô; lỗi chung có thông báo/thử lại, không xóa giỏ khi thất bại. Chỉ xóa giỏ/key sau thành công.
- Trang `/checkout/success?code=&t=` kiểm tra code/token ở server, sai trả HTTP 404; có noindex/no-referrer, tóm tắt từ snapshot đơn, địa chỉ, COD/trạng thái chuyển khoản. QR VietQR từ số tiền và mã đơn đã lưu; nút sao chép, Zalo chỉ hiện khi có cài đặt.
- Email HTML inline + text cho khách và shop, escape dữ liệu nhập, xử lý chuỗi dài; link riêng của khách và link admin của shop tách biệt. `after()` gửi sau commit, có timeout, Resend idempotency key, Telegram khi có đủ cấu hình. Lỗi thông báo không rollback đơn.
- Tắt log đối số Server Function và log URL trang thành công trong Next dev để tránh lộ thông tin khách/token. Log email dev chỉ ghi mã đơn/loại email/subject, che dữ liệu riêng tư. Không thêm thư viện, không đổi schema/migration.

## Nghiệm thu

| Kiểm tra | Kết quả |
|---|---|
| `npm run lint` / `npm run typecheck` | Pass |
| `npm run test` | **150/150 pass**, 20 file, có PostgreSQL test riêng |
| `npm run build` | Pass; `/checkout` và `/checkout/success`, không có probe test |
| `npm run e2e:checkout` | **9/9 pass** |
| Hồi quy cart / browsing | **9/9 + 9/9 pass** |
| 375/768/1280px | Form, receipt không tràn ngang; đã xem ảnh kiểm tra |
| Template email | **6 lượt render pass**, hai mẫu × ba độ rộng, tên/SKU/địa chỉ dài |
| Supabase dev thật | **3 lượt checkout/quote/tóm tắt pass** và token sai HTTP 404; không tạo đơn |
| Quét 41 bundle trình duyệt | Không có giá trị riêng tư từ `.env` |

E2E chứng minh COD và chuyển khoản giảm đúng kho; hai HTTP request đồng thời cùng key chỉ tạo một đơn/một bút toán kho; sửa `expectedTotal`/giá client không thay số tiền server; đổi giá phải đồng ý; hết kho không tạo đơn; reload giữ key/ghi chú giỏ; thành công mới xóa giỏ/key; sai token không xem được địa chỉ; QR đúng BIN/tài khoản/số tiền/mã đơn và sao chép được. Ảnh QR được fixture thay thế trong E2E, không quét/chuyển tiền thật.

Unit/integration kiểm tra đúng một outcome “đơn mới” trong hai retry, việc xếp thông báo sau commit, không gửi lại khi retry, request Resend/Telegram, idempotency header, lỗi provider không làm lỗi đơn, log không chứa dữ liệu khách/token và HTML không chèn script. Chưa kiểm tra nhận email thật trong hộp thư vì shop chưa có cấu hình Resend.

Fixture chỉ chạy trên `_test`, chặn địa chỉ trùng dev/prod. Probe/ảnh tạm đã teardown, không có trong build. Trên Supabase dev thật, kiểm tra form và quote không tạo đơn hoặc sửa sản phẩm. Ngân hàng dev còn trống nên chỉ hiện COD đúng thiết kế. Local tiếp tục chạy tại `http://localhost:3000`.

## Phạm vi và khác biệt tài liệu

- PLAN/ARCHITECTURE yêu cầu log email dev ra console, còn AGENTS cấm log thông tin cá nhân/secret. Giữ log xác nhận với mã đơn và loại email, không in toàn bộ HTML/text/địa chỉ/email/token. Đây là ưu tiên bảo mật theo AGENTS.
- Bản Resend SDK đang cài tự log body lỗi provider trong dev. Service dùng HTTP API chính thức của Resend để chủ động không log body có thể chứa địa chỉ email, không thêm package. Payload/timeout/idempotency đã kiểm thử bằng fetch mock; chưa có gửi thật.
- HMAC access token và advisory transaction lock giữ thiết kế Phase 2; outcome nội bộ chỉ xếp thông báo cho đúng lượt tạo mới. Không giữ lock khi gọi dịch vụ bên ngoài. Thông báo sau commit là best effort, chưa có hàng đợi gửi lại bền vững trong plan hiện tại.
- Sử dụng `after()`, async searchParams, logging và Image unoptimized theo tài liệu Next.js **16.4.3** đang cài. QR ngoài không đi qua bộ tối ưu ảnh Supabase.
- Các trang chính sách đầy đủ thuộc Phase 11; giao diện quản lý/xử lý đơn thuộc Phase 10; tự xác nhận chuyển khoản thuộc Phase 14b. Chưa làm các phần này hoặc deploy production. GitHub Pages vẫn là bản duyệt tĩnh riêng, không nhận đơn.

## Chủ shop cần cung cấp

- Điền ngân hàng/tài khoản/chủ tài khoản thật trong admin để bật chuyển khoản; kiểm tra QR trước khi mở bán.
- Cấu hình domain gửi đã xác minh, `RESEND_API_KEY`, `EMAIL_FROM`, `SHOP_NOTIFY_EMAIL` trong `.env` riêng để nghiệm thu gửi email thật. Không gửi key qua chat. Telegram tùy chọn.
- Bổ sung ảnh/nội dung sản phẩm và duyệt chính sách trước khi mở bán; hiện còn placeholder/dữ liệu mẫu.
