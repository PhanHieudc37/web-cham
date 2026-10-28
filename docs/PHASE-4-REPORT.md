# Báo cáo Phase 4 — Danh mục, sản phẩm, ảnh và tồn kho

Ngày: **28/10/2026 — đã nghiệm thu Phase 4**.

## Đã làm

- Danh mục cây hai cấp, ảnh giữ tỉ lệ, bật/tắt hiển thị, đổi thứ tự, thêm/sửa/xóa có xác nhận. Chặn danh mục cấp ba, vòng cha-con, xóa khi còn con/sản phẩm và slug trùng giữa category/collection hoặc slug dành riêng. Đổi tên danh mục/cha cập nhật search text các sản phẩm liên quan.
- Danh sách sản phẩm đọc SQL, tìm tên/mã không dấu, lọc danh mục/trạng thái/sắp hết hàng, phân trang URL 20 dòng. Bảng desktop, thẻ mobile; nhân bản, lưu trữ/khôi phục và liên kết xem cửa hàng khi active.
- Form react-hook-form + zod: thông tin, cảnh báo đổi slug, tiền VND, mô tả/chất liệu/form/bảo quản, bảng size, ảnh, màu/size, ma trận biến thể và SKU, cài đặt phân loại, collection có sẵn, SEO preview. Tạo bảng size ngay trong form.
- Upload `/api/admin/upload`: validate → guard staff → kiểm tra origin → service → `ActionResult`. Giới hạn 2 MB, chỉ WebP/JPEG/PNG và kiểm tra magic bytes; server sinh UUID/path, không nhận tên file hoặc key Storage từ client.
- Resize Canvas trên trình duyệt: `square` 1200×1200 nền trắng, contain không cắt; `fit` cạnh dài tối đa 1920px. WebP 0.85, fallback JPEG, giảm chất lượng khi cần để dưới 1 MB. Kéo/thả/chọn nhiều, progress từng ảnh, tối đa 12 ảnh; thứ tự, ảnh chính/hover, gán màu và alt.
- Service lưu toàn bộ sản phẩm/biến thể/ảnh/collection/search text trong một transaction. Khóa catalog chống trùng slug/mã giữa các request; khóa biến thể theo thứ tự tương thích checkout. Giá, stock delta và điều kiện xuất bản đều kiểm tra ở server.
- Tồn kho áp dụng `newStock - expectedStock` lên số hiện tại, ghi `stock_movements`, chặn âm. Sau save action trả lại DTO mới từ DB để form cập nhật cả tồn và expectedStock, tránh áp dụng lại delta ở lần lưu sau.
- Biến thể bị bỏ giữ lại và chuyển inactive, không làm mất tham chiếu order_items. Ảnh gỡ chỉ dọn sau commit, best effort, kiểm tra còn tham chiếu từ sản phẩm/bản sao hoặc nội dung khác trước khi xóa.
- `published_at` giữ thời điểm lần đầu active; active cần ảnh và biến thể đang bán. Nhân bản tạo Nháp/stock 0/ID biến thể mới, giữ ảnh dùng chung; khôi phục từ archive về Nháp.
- Cảnh báo dữ liệu chưa lưu khi bấm link, đóng dialog hoặc tải lại/đóng tab; nút lưu dính đáy mobile. Trang mới có mốc hydration để form không nhận thao tác/chụp trước khi sẵn sàng. Không thêm thư viện, schema hoặc migration.

## Nghiệm thu

- Bộ unit/integration hiện có **114 ca**, gồm 12 integration catalog mới trên PostgreSQL Docker riêng. Không truncate Supabase dev.
- Bộ E2E catalog có **7/7 luồng pass**, dùng tài khoản staff trên DB test riêng và bucket media dev. Đã kiểm tra tạo 3 màu × 4 size, 6 ảnh, chỉnh thứ tự/màu, lỗi slug, sửa kho/lịch sử, cảnh báo rời trang, nhân bản, archive/restore và responsive; không có page error/hydration error ở lượt cuối.
- Kiểm tra ảnh thực qua public URL: ảnh sản phẩm 1200×1200, pixel trên/dưới trắng và cả mép trái/phải ảnh gốc còn nguyên; ảnh danh mục 2400×600 thành 1920×480. Ảnh thử được dọn theo đúng danh sách path do test tạo, không xóa ảnh có sẵn của shop.
- Kiểm tra viewport 375/768/1280px cho danh mục, danh sách, form sản phẩm; đã tạo/xem screenshot trong quá trình nghiệm thu. `test-results/` bị Git bỏ qua và bộ kiểm tra sau có thể thay các artifact tạm trước đó.

| Kiểm tra | Kết quả |
|---|---|
| Unit/integration PostgreSQL riêng | 114/114 pass |
| E2E Phase 4 | 7/7 pass, không page error/hydration error |
| Hồi quy E2E Phase 3 | 9/9 pass |
| Lint / typecheck | Pass, không warning |
| Build production | Pass |
| Ma trận 3 màu × 4 size và 6 ảnh | Pass trên trình duyệt với Storage thật |
| Resize square và fit | 1200×1200 nền trắng/không mất mép; 1920×480 giữ tỉ lệ |
| Kho đồng thời, ledger, giữ tham chiếu đơn cũ | Pass integration |
| Slug trùng dưới ô nhập; auto slug có suffix | Pass browser/integration |
| Rời form khi chưa lưu | Cảnh báo link/dialog/đóng tab; form mới không báo thay đổi giả |

Lượt E2E đầu phát hiện công tắc danh mục bị React trả về trạng thái cũ trước khi action hoàn tất; đã sửa cập nhật ngay và khóa thao tác đến khi server phản hồi. Chụp ảnh trước hydration gây cảnh báo caret của công cụ, nên bộ cuối chờ giao diện sẵn sàng và bắt lỗi console/page. Docker test ban đầu đang dừng; đã khởi động lại, không chuyển test sang Supabase dev. Không sửa migration đã áp dụng.

Đã khởi động web local tại `http://localhost:3000`, đăng nhập bằng admin Supabase dev thật, mở thành công `/admin/categories`, `/admin/products`, `/admin/products/new`, rồi đăng xuất. Chỉ đọc catalog và mở form, không tạo/sửa sản phẩm hoặc danh mục thật. Đã quét 41 file staged và 107 file JS/JSON/map của bundle trình duyệt: không chứa credentials, mật khẩu hoặc email admin từ `.env`. Git chỉ theo dõi `.env.example`.

## Phạm vi và điểm kỹ thuật

- Bảng auth vẫn do Better Auth của Phase 3 quản lý, Storage dùng secret key server. Không dùng Supabase Auth hoặc mở thêm RLS policy. Đã đối chiếu [upload](https://supabase.com/docs/reference/javascript/storage-from-upload), [remove](https://supabase.com/docs/reference/javascript/storage-from-remove) và API package đang cài; Next.js route/cache dùng guide 16.4.3 trong node_modules.
- Chỉ cho tham chiếu URL/path đúng kho ảnh của shop, ngoài placeholder nội bộ có sẵn. Gỡ ảnh đang được bản sao dùng không xóa file. Ảnh upload xong nhưng người dùng hủy form có thể còn trong Storage; chưa thêm tác vụ quét ảnh mồ côi vì ngoài plan.
- Giữ cả biến thể không còn trong ma trận dưới dạng inactive để không xóa lịch sử. Các màu/size liên quan vẫn có thể thấy khi mở lại form và bật lại nếu cần; không âm thầm xóa dữ liệu cũ.
- Khôi phục từ Lưu trữ đưa về Nháp, đúng nội dung confirm, để chủ shop kiểm tra trước khi bán lại.
- Collection trong form chỉ chọn từ dữ liệu có sẵn; CRUD bộ sưu tập/banner/cài đặt thuộc Phase 5. Link “Xem trên cửa hàng” trỏ đường dẫn của Phase 7, chưa có trang sản phẩm storefront thật. Không làm trước phase sau, không deploy production.

## Chủ shop cần cung cấp

Không thiếu key cho Phase 4. Chủ shop cần thay dữ liệu mẫu bằng ảnh sản phẩm gốc, mô tả, giá/tồn và bảng số đo thật khi chuẩn bị bán. Tài khoản admin dùng thông tin trong `.env` local. Không đưa secret hoặc `.env` lên GitHub.
