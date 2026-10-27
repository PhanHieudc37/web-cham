# Bản duyệt giao diện — GitHub Pages

Ngày: 27/10/2026. Phạm vi bổ sung do chủ shop yêu cầu để bạn bè xem và góp ý trước khi triển khai hệ thống bán hàng trong plan.

## Đã làm

- Bản thiết kế streetwear tối giản, trắng/đen và màu trung tính, font Be Vietnam Pro; trang chủ có hero, danh mục, best seller, bộ sưu tập, sản phẩm mới và phần giới thiệu bản duyệt.
- 12 sản phẩm minh họa; tìm kiếm không dấu, lọc danh mục, sắp xếp, ẩn mẫu hết hàng; trạng thái danh sách nằm trong URL hash và giữ khi reload.
- Chi tiết sản phẩm có thay ảnh theo màu, chọn size, nhắc khi chưa chọn size; giỏ mẫu thêm/xóa sản phẩm. Không có checkout, tổng tiền hoặc đơn hàng thật.
- Menu mobile, mega menu desktop, tìm kiếm, dialog, Esc và bấm overlay để đóng; khóa cuộn nền và khôi phục focus. Gợi ý góp ý hiển thị ngay trên trang, không gửi thông tin người xem tới server.
- Hình vẽ SVG gốc được tạo bằng code. Không crawl Shopee, không dùng ảnh/logo/văn bản của shop khác. Thông tin liên hệ, ngân hàng và cam kết shop chưa được cung cấp nên không hiển thị.
- Font lưu cùng source và giấy phép; mọi request của bản duyệt tới cùng origin. CSP chặn network API/form; robots noindex. Giỏ chỉ nằm trong bộ nhớ tab, không lưu dữ liệu sau reload.
- Build độc lập bằng TypeScript strict và Node, dùng thư viện hiện có. Chỉ `.preview-dist` được xuất bản; không đóng gói `.env`, source server hoặc credentials.
- Workflow GitHub Pages build rồi deploy trên `main`, quyền ghi Pages chỉ ở job deploy. Có script `github-pages.mjs` để kiểm tra/bật Pages bằng credential Git hiện có; không lưu/in token.

## Kiểm tra

- `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` và build preview: **pass trước push**. Test nghiệp vụ: 20 ca gồm integration PostgreSQL thật; test preview: 6 kịch bản pass.
- Playwright: 6 kịch bản gồm layout tại 375/768/1280px, không tràn ngang, chọn màu/size/giỏ; tìm không dấu, lọc/sắp xếp/reload; menu/overlay/Esc/focus; query HTML được hiển thị dạng text; ảnh tải đủ, không gọi dịch vụ ngoài, không form thông tin cá nhân.
- Đã xem ảnh desktop/mobile và chi tiết sản phẩm, tăng cỡ chữ nhỏ cho sản phẩm và thông tin lựa chọn.
- URL chia sẻ dự kiến: `https://phanhieudc37.github.io/web-cham/`. Chỉ coi đã xuất bản sau khi workflow thành công và URL thật được kiểm tra.

## Còn lại

Bản duyệt không phải web bán hàng hoàn chỉnh và không thay nghiệm thu các phase trong plan. Chưa có admin, đặt đơn, thanh toán, email, nghiệp vụ kho hay nội dung/chính sách thật. Cần ảnh sản phẩm và thông tin shop để thay dữ liệu mẫu sau khi chốt hướng thiết kế.

Supabase đã được cài theo kiểm tra plugin, nhưng chưa có công cụ Supabase trong phiên này để xác nhận quyền tài khoản/project. DATABASE_URL, DIRECT_URL, SUPABASE_URL và SUPABASE_SERVICE_ROLE_KEY trong `.env` vẫn trống. Phase 1 tiếp tục chờ kết nối thật; chưa chuyển các phase bán hàng tiếp theo.
