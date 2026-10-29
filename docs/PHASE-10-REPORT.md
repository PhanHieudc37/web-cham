# Báo cáo Phase 10 — Admin: đơn hàng và tổng quan

Ngày kiểm tra: **29/10/2026**. Phạm vi: `PLAN.md` Phase 10, `ADMIN.md` mục 2–3; nghiệm thu trên dev/test.

## Đã làm

- Tổng quan có đơn hôm nay, đơn chờ xác nhận, chuyển khoản chưa thanh toán, 10 đơn mới nhất và cảnh báo biến thể sắp hết hàng theo cài đặt. Doanh thu hôm nay/7/30 ngày và biểu đồ 14 ngày chỉ truy vấn/trả về cho admin. Tính theo trạng thái và ngày tạo đơn tại Việt Nam, đúng DATABASE 4.13. Danh sách tồn thấp hiển thị tối đa 50 biến thể, kèm tổng số và ngưỡng.
- Danh sách đơn có tab/số đếm, tìm mã/tên/SĐT, lọc khoảng ngày/phương thức/trạng thái thanh toán và phân trang 20 đơn trên URL. Desktop dùng bảng; mobile dùng card.
- Chi tiết có snapshot sản phẩm, tổng tiền, thông tin người nhận/liên kết gọi/Zalo/sao chép địa chỉ, thanh toán, vận chuyển, ghi chú khách và lịch sử đầy đủ kèm tên người thao tác.
- Các chuyển trạng thái đều qua ConfirmDialog; chỉ hiện nút hợp lệ và vẫn kiểm tra trạng thái thật tại server. Hủy bắt buộc lý do; hủy/hoàn trả khóa đơn và biến thể trong transaction, hoàn kho và cập nhật soldCount đúng một lần. Hoàn thành COD tự ghi nhận thanh toán; hoàn tiền phải xác nhận riêng sau khi hủy/hoàn trả.
- Chuyển sang Đang giao lưu hãng/mã vận đơn cùng transaction và ghi lịch sử. Email vận chuyển gọi sau commit khi có email khách và mã vận đơn, có escape HTML, timeout và idempotency key; lỗi email không làm mất thay đổi đơn.
- Form vận chuyển/ghi chú dùng react-hook-form + zod chung với action, có báo lỗi, toast và cảnh báo rời trang chưa lưu. Nút lưu vận chuyển ghim đáy mobile khi có thay đổi.
- CSV chỉ admin được xuất, giữ bộ lọc hiện tại, UTF-8 BOM, một dòng/sản phẩm; phân lô 500 dòng để giới hạn bộ nhớ, escape dấu phân cách và công thức Excel, response private/no-store. Tổng đơn lặp theo dòng sản phẩm; dùng cột Thành tiền khi cộng doanh số theo dòng.
- Phiếu giao A5 dọc, ẩn khung admin khi in, tự mở hộp thoại in sau khi font sẵn sàng. Không điền SĐT shop khi thiếu.
- Tách lịch sử admin khỏi DTO khách: ghi chú nội bộ không xuất hiện trong cả receipt có token và tra cứu công khai. Tắt log URL tìm đơn để tránh ghi SĐT/tên trong access log dev.
- Sinh migration mới `0002_dazzling_blue_blade.sql` bằng Drizzle, thêm index theo order_id cho order_items và (order_id, created_at, id) cho order_events. Đã chạy trên PostgreSQL test, áp dụng và kiểm tra lại trên Supabase dev; RLS vẫn bật. Không sửa migration đã chạy, không thêm thư viện.

## Kiểm tra nghiệm thu

| Kiểm tra | Kết quả |
|---|---|
| Lint / TypeScript | Pass |
| Unit + integration PostgreSQL riêng | 167 test pass, 24 file |
| Build production | Pass; các route admin/orders, chi tiết, print và CSV được tạo |
| E2E Phase 10 | 7 kịch bản pass, gồm 375/768/1280px, không tràn ngang |
| Hồi quy checkout | 9/9 pass |
| Hồi quy đăng nhập / quyền admin | 3/3 kịch bản pass |
| Hủy / hoàn trả / thanh toán | Có test đồng thời, chống hoàn kho/ghi nhận tiền lặp, lý do bắt buộc, trạng thái cuối không chuyển tiếp |
| Quyền | Anonymous/staff bị chặn CSV tại server; staff không nhận dữ liệu doanh thu |
| Email vận chuyển | Mock HTTP Resend kiểm tra người nhận, hãng/mã, HTML escape, idempotency và xử lý lỗi; E2E tắt credentials và dùng dev transport |
| Supabase dev | Hai index mới tồn tại, RLS bật; không tạo đơn thật để kiểm thử |
| Kiểm tra local với Supabase dev thật | Tổng quan và danh sách đơn: 6 lượt ở 375/768/1280px HTTP 200, noindex, không tràn ngang, 0 lỗi trình duyệt; CSV HTTP 200/private/BOM; không đổi đơn |
| Quét bundle production | 49 file JavaScript, 0 giá trị secret từ `.env` |

Ảnh kiểm tra lưu ở `test-results/phase10-*.png` (bị Git bỏ qua). Các bộ test và fixture chỉ ghi vào database `_test` riêng, có chặn địa chỉ dev/prod. Không đưa `.env`, secret hoặc dữ liệu khách lên GitHub.

## Khác biệt tài liệu và phần chưa làm

- ADMIN 3.3 ghi các đơn không thuộc COD chưa trả tiền đều hiện “Đã thanh toán”. Điều này sai với chuyển khoản chưa nhận/đã hoàn tiền và đơn đã hủy. Phiếu hiển thị đúng trạng thái: chuyển khoản chưa xác nhận không thu hộ; đơn hủy/hoàn trả không giao, không thu tiền. Không tự đánh dấu đã thanh toán.
- Resend đã có key và yêu cầu gửi thử trước Phase 10 được API chấp nhận, nhưng sender local vẫn thuộc `@resend.dev`. Chưa nghiệm thu email giao đến hộp thư khách ngoài tài khoản đăng ký Resend; cần xác minh domain gửi riêng rồi đổi EMAIL_FROM. Không gửi email tới khách thật trong các test Phase 10.
- Chưa triển khai Phase 11 (tra cứu/liên hệ/chính sách), chưa mở bán production. Bản GitHub Pages vẫn là bản duyệt giao diện độc lập; chức năng admin cần Next.js server local.

## Chủ shop cần cung cấp / thao tác

- Xác minh domain tại Resend và cấu hình EMAIL_FROM thuộc domain đó khi muốn gửi cho khách thật. Giữ key trong `.env` riêng.
- Xem `/admin` và `/admin/orders` local, góp ý luồng vận hành. Nếu chưa có đơn, danh sách trống là bình thường; không dùng đơn thử có thông tin thật để nghiệm thu.
