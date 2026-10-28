# Báo cáo Phase 5 — Bộ sưu tập, banner và cài đặt

Ngày: **28/10/2026 — đã nghiệm thu Phase 5**.

## Đã làm

- Bộ sưu tập: danh sách 20 mục/trang, ảnh, số sản phẩm, hiển thị/trang chủ/menu, đổi thứ tự, thêm/sửa/xóa có xác nhận. Form mô tả/banner giữ tỉ lệ; dialog tìm và tick nhiều sản phẩm, phân trang, sắp thứ tự và gỡ sản phẩm. Slug tự sinh có suffix, dùng chung namespace với danh mục; chặn slug dành riêng. Các thao tác dùng khóa catalog và transaction.
- Banner: ảnh desktop/mobile giữ tỉ lệ, cảnh báo tỉ lệ, alt/link/chữ nút, lịch bắt đầu/kết thúc theo giờ Việt Nam, bật/tắt, đổi thứ tự, sửa/xóa và xem trước cả hai phiên bản. Ngày giờ lưu ISO UTC, hiển thị/nhập theo UTC+7; từ chối link nguy hiểm và khoảng thời gian ngược.
- Cài đặt admin có tám tab giao diện cho 10 key trong DATABASE: shop, social, ba khối thông báo/cam kết/tóm tắt đổi trả, vận chuyển, thanh toán, pháp lý, đơn hàng, SEO. Mỗi key lưu độc lập bằng react-hook-form + zod; lỗi dưới ô, toast và cảnh báo thay đổi chưa lưu khi đổi tab/rời trang.
- Upload logo shop/BCT/OG qua chế độ fit; chỉ chấp nhận URL/path Storage của shop khi thay ảnh. Ảnh cũ chỉ dọn best effort sau commit và khi không còn tham chiếu. Các ảnh/secret không đi qua client dưới dạng credentials.
- Vận chuyển giữ tiền nguyên VND và các ngưỡng freeship nullable. Ngân hàng chọn từ 76 mục trong [API VietQR chính thức](https://api.vietqr.io/v2/banks), snapshot 28/10/2026; chủ tài khoản chuẩn hóa in hoa/không dấu tại server; QR xem trước 10.000₫.
- Tất cả action validate → guard → service → ActionResult. Staff được quản lý collection/banner; chỉ admin lưu settings. Mỗi mutation invalidate tag liên quan, không cache dữ liệu admin.
- Sửa sản phẩm vẫn giữ nguyên thứ tự đã sắp trong bộ sưu tập; thành viên mới được thêm cuối. Có integration test chống hồi quy việc mất thứ tự khi sửa sản phẩm ở Phase 4.
- Không thêm thư viện hoặc thay schema/migration, không tạo Supabase production và không triển khai phase sau.

## Nghiệm thu

- Unit/integration mới kiểm tra slug dùng chung, thứ tự thành viên, tìm sản phẩm, lịch banner, media path và cleanup, lưu settings độc lập, actor metadata, ngân hàng, ngày giờ, quyền action của mọi nhóm settings và giữ thứ tự khi sửa sản phẩm.
- E2E content dùng PostgreSQL test riêng; upload ảnh thử vào bucket dev và tự dọn đúng các path được tạo. Không tạo/sửa cài đặt/bộ sưu tập/banner thật trên Supabase trong các test.
- Nghiệm thu cache: làm nóng `getPublicSettings`, `getHome`, `getMenu`, `getListing`; lưu qua giao diện admin; đọc lại cùng hàm đã cache và nhận liên hệ, phí ship, menu/thứ tự collection, banner/chữ CTA mới. Không restart server hoặc deploy giữa hai lượt đọc. Kiểm tra bằng route probe được setup tạo tạm, có guard staff và cờ/database test; teardown xóa, Git bỏ qua và build bình thường không chứa route.
- Kiểm tra 375/768/1280px cho danh sách/form collection, banner, mọi tab settings; chụp và xem ảnh, không tràn ngang. Test bắt page error và hydration error.

| Kiểm tra | Kết quả |
|---|---|
| `npm run lint` / `npm run typecheck` | Pass, không warning |
| `npm run test` | **129/129 pass**, 15 file, PostgreSQL kiểm thử riêng |
| `npm run build` | Pass; không có probe test trong danh sách route production |
| `npm run e2e:content` | **7/7 pass**, không page error/hydration error |
| Hồi quy `e2e:admin` / `e2e:catalog` | **9/9 + 7/7 pass** |
| Làm nóng cache → lưu liên hệ/phí ship/banner → đọc lại | Nhận dữ liệu mới, không restart/deploy |
| Settings guard khi gọi trực tiếp dưới quyền staff | `FORBIDDEN` cho cả 10 nhóm |
| Slug danh mục/collection, thứ tự và liên kết sản phẩm | Pass integration/E2E |
| Ngân hàng, chuẩn hóa tên và QR 10.000₫ | Pass schema/E2E |
| Quét staged và bundle trình duyệt | 42 file staged, 138 file JS/JSON/map; không giá trị riêng tư từ `.env` |

Probe test đã được teardown xóa; không được commit và không có trong build bình thường. Ảnh upload trong E2E được dọn đúng các path do test tạo. Không sử dụng credentials production, không thay dữ liệu nội dung thật để làm kiểm thử.

Đã mở lại `http://localhost:3000`, đăng nhập bằng admin Supabase dev hiện có, đọc thành công danh sách/form bộ sưu tập, banner và cài đặt rồi đăng xuất. Không lưu/thay đổi nội dung shop thật. Web local giữ sẵn để chủ shop xem; tài khoản lấy từ `.env` riêng trên máy.

## Giải thích phạm vi và tài liệu

- Phase 5 yêu cầu dữ liệu cửa hàng cập nhật sau Lưu nhưng storefront đầy đủ thuộc Phase 6. Vì vậy nghiệm thu trực tiếp các public services/cache thật qua probe test, không làm trước layout/trang chủ Phase 6 và không sửa bản GitHub Pages minh họa thành web vận hành.
- DATABASE mặc định có bốn cam kết, ADMIN liệt kê sáu lựa chọn icon. Giữ bốn cam kết mặc định, bổ sung hai lựa chọn `shield`/`gift` vào schema JSON; không đổi dữ liệu seed hoặc bảng DB.
- Nhóm “Thông báo & cam kết” tương ứng ba key, mỗi khối có nút Lưu riêng để không ghi đè thay đổi chưa lưu ở nhóm khác.
- Khoảng lịch banner áp dụng lúc public service đọc; không chạy cron hoặc tính năng Phase 14. Trường thời gian tự hủy đơn chỉ lưu cấu hình như plan, chưa bật tự hủy.
- Lượt build đầu không tải được Google Font do giới hạn mạng; tiếp tục chạy với network đã cấp. Lượt E2E đầu cần dừng server local cũ cùng workspace để lấy khóa Next.js; server local sẽ được mở lại sau nghiệm thu. Chờ đúng form hoàn tất lưu thay vì đọc nhầm toast cũ trong E2E.

## Chủ shop cần cung cấp

Không cần thêm key. Chủ shop cần nhập kênh liên hệ, ảnh banner, thông tin ngân hàng/pháp lý và chính sách thật khi chuẩn bị mở bán. Thông tin chưa có để trống. Bản local dùng credentials hiện có trong `.env`, không đưa lên GitHub. Chưa thực hiện Phase 6 hoặc deploy production.
