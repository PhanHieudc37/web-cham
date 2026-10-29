# Báo cáo Phase 11 — Tra cứu đơn, liên hệ và trang thông tin

Ngày kiểm tra: **29/10/2026**. Phạm vi: PLAN Phase 11, STOREFRONT mục 10–11 và ADMIN mục 9.

## Đã triển khai

- `/kiem-tra-don-hang`: form react-hook-form + zod, gửi Server Action bằng POST, chuẩn hóa mã đơn/SĐT, không đưa thông tin tra cứu vào URL. Trang noindex; chỉ trả DTO công khai với SĐT che, không có email/địa chỉ/token/ghi chú nội bộ/người thao tác. Kết quả có tiến trình, thanh toán, sản phẩm snapshot, tổng, hãng/mã vận đơn và sao chép. Đơn hủy/hoàn trả có trạng thái và lý do riêng nếu đã ghi nhận.
- Sai mã và sai SĐT trả cùng thông báo theo docs. Giới hạn 10 lượt/10 phút/IP bằng bộ đếm PostgreSQL nguyên tử, lượt 11 trả RATE_LIMITED; có honeypot trả thành công giả, không đọc đơn.
- `/lien-he`: thông tin shop/mạng xã hội lấy từ cài đặt, thiếu thì ẩn. Form họ tên/SĐT/email tùy chọn/nội dung 10–1000 ký tự, lỗi dưới ô, khóa gửi khi chưa sẵn sàng/đang gửi, thành công xóa form và hiện đúng thông báo. Giới hạn 3 lượt/10 phút/IP; honeypot không ghi tin nhắn.
- Lưu tin nhắn trước, `after()` gửi email cho shop sau; HTML/text được escape, có timeout/idempotency key. Lỗi email không làm mất tin đã lưu. Log dev chỉ gồm định danh/loại thông báo, không ghi nội dung hoặc dữ liệu cá nhân.
- `/admin/messages`: staff/admin đọc tin Mới/Đã xử lý, số đếm và phân trang 20 tin trên URL; có Gọi/Zalo/email, nội dung và thời gian. Action kiểm tra quyền tại server, chỉ lấy người xử lý từ phiên đăng nhập. Cập nhật nguyên tử, giữ nguyên người/thời gian xử lý đầu tiên khi nhấn lại hoặc hai người thao tác đồng thời; badge menu cập nhật sau refresh.
- Thêm Giới thiệu, Đổi trả, Bảo mật, Điều khoản dịch vụ; h1 giữa trang, bài rộng tối đa 760px, chữ 15px/line-height 1.7. Có comment TODO duyệt nội dung đầu từng file và thông báo bản mẫu trên giao diện. Không bịa SĐT, địa chỉ, thông tin kinh doanh hoặc cam kết thời hạn chưa được shop xác nhận.
- Bảo mật nêu dữ liệu thu thập (họ tên/SĐT/email/địa chỉ/IP), mục đích, Supabase/PostgreSQL/Storage, Resend, giỏ/phiên trình duyệt và cách yêu cầu sửa/xóa qua liên hệ.
- Hướng dẫn chọn size đọc toàn bộ bảng kích thước hiện có qua service/cache tag products, kèm hướng dẫn đo và trạng thái trống. 404 có nút về trang chủ và tối đa 4 BEST SELLER thật; không tạo sản phẩm giả khi danh sách thiếu.
- Không thêm thư viện, không đổi schema/migration, không làm Phase 12 hoặc deploy production. GitHub Pages tiếp tục là bản duyệt riêng, không chứa chức năng server của phase này.

## Kiểm tra

| Kiểm tra | Kết quả |
|---|---|
| Unit/integration PostgreSQL riêng | 183 test pass, 28 file |
| Lint / TypeScript | Pass |
| E2E Phase 11 | 12/12 pass: ba độ rộng 375/768/1280px không tràn ngang, tra cứu, privacy, rate limit, honeypot, liên hệ → admin, xử lý/phân trang, chính sách, size và HTTP 404 |
| Hồi quy browsing | 9/9 pass, gồm HTTP 404 và thử lại error boundary |
| Build production | Pass; có đủ 8 route mới (7 storefront + hộp thư admin), không có probe test |
| Local + Supabase dev thật | 27 lượt GET ở 375/768/1280px đúng HTTP 200/404, không tràn ngang, 0 lỗi trình duyệt; tra cứu/admin có noindex; không gửi form hay thay đổi đơn/tin nhắn |
| Quét client bundle | 51 file JavaScript production, 0 giá trị secret từ `.env` |

Các fixture có chặn database dev/prod, chỉ ghi vào PostgreSQL `_test`; email/Telegram thật bị tắt trong E2E. Kiểm thử email dùng mock HTTP. Cache test được làm mới sau seed. Ảnh và kết quả chi tiết nằm trong `test-results/` bị Git bỏ qua; không commit `.env` hoặc dữ liệu khách thật.

Lượt build chạy cùng test có một số trang prerender tự retry sau 60 giây và cuối cùng exit 0. Chưa đo Lighthouse/tối ưu hiệu năng của Phase 12.

## Khác biệt tài liệu

- ARCHITECTURE đưa ví dụ log nguyên lỗi/nội dung email dev; thực hiện theo AGENTS: log thông tin tối thiểu và che dữ liệu cá nhân.
- STOREFRONT yêu cầu lý do hoàn trả; schema chưa có cột riêng. Dùng message của event chuyển sang returned làm lý do công khai, không đưa note nội bộ ra ngoài. Đơn cũ không ghi lý do thì hiển thị chưa được ghi nhận; không tự suy diễn.
- Trang 404 chỉ hiển thị số BEST SELLER đang có, tối đa 4. Khi chưa có sản phẩm hợp lệ, vẫn hiển thị 404/nút về trang chủ.

## Chủ shop cần duyệt / cung cấp

- Duyệt nội dung mẫu tại bốn trang giới thiệu/chính sách. Xác nhận điều kiện, thời hạn đổi trả, phí vận chuyển, thời hạn lưu dữ liệu và quy trình xử lý yêu cầu xóa trước khi mở bán.
- Điền thông tin liên hệ thật trong Cài đặt nếu muốn hiển thị SĐT/email/địa chỉ/giờ làm việc. Kiểm tra bảng size theo từng sản phẩm.
- Email thật vẫn cần sender/domain Resend phù hợp. Không gửi email hoặc tạo tin nhắn thử vào dữ liệu shop thật trong nghiệm thu Phase 11.
