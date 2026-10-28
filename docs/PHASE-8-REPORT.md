# Báo cáo Phase 8 — Giỏ hàng

Ngày: **28/10/2026 — đã nghiệm thu Phase 8**.

## Đã làm

- Zustand persist với key `cham-cart-v1`, version và `skipHydration`; chỉ lưu mã biến thể, số lượng, ghi chú và mã giảm giá rỗng. Không lưu tên/giá/ảnh. Validate lại dữ liệu localStorage khi hydrate; storage bị chặn hoặc đầy vẫn dùng được giỏ trong bộ nhớ.
- Giới hạn 20 dòng, cộng dồn biến thể đã có, giới hạn số lượng theo server và trần cấu hình. Badge chỉ hiển thị sau hydrate; thay đổi giỏ đồng bộ giữa các tab.
- `POST /api/cart/quote`: validate zod → quyền đọc công khai/rate limit 60 lần/phút/IP → service → `ActionResult`. Đọc PostgreSQL trực tiếp, trả `Cache-Control: no-store`, không tin giá/tổng tiền client gửi.
- Một controller chia sẻ quote cho drawer/trang giỏ, debounce 300ms, tải lại khi mở drawer/chuyển trang/quay lại tab và bấm cập nhật. Giữ quote cũ khi tải, có skeleton/thử lại, hủy và bỏ qua phản hồi cũ.
- Tự cập nhật số lượng khi server trả `QUANTITY_REDUCED`, giữ cảnh báo sau lần cập nhật và bỏ cảnh báo khi kho đã tăng lại. Dòng hết hàng/ngừng bán vẫn hiện cùng nút xóa, không tính vào tổng hợp lệ.
- CartDrawer rộng toàn màn hình mobile/420px từ tablet, Esc/overlay/nút đóng và trả focus; tiến độ freeship, sửa/xóa dòng, tổng tiền. `/cart` có ghi chú tối đa 500 ký tự, tạm tính/phí ship/tổng cộng từ server và trạng thái giỏ trống.
- Nút thêm giỏ ở chi tiết và StickyBuyBar hoạt động; thiếu size thì đưa về vùng chọn. Không hiện toast khi thêm giỏ. Không thêm thư viện hay thay schema/migration.

## Nghiệm thu

| Kiểm tra | Kết quả |
|---|---|
| `npm run lint` / `npm run typecheck` | Pass |
| `npm run test` | **138/138 pass**, 17 file, có PostgreSQL test riêng |
| `npm run build` | Pass; có `/cart` và `/api/cart/quote`, không có probe kiểm thử |
| `npm run e2e:cart` | **9/9 pass**, không lỗi runtime/hydration trên trình duyệt |
| Hồi quy browsing / storefront | **9/9 + 6/6 pass** |
| 375/768/1280px | Drawer và trang giỏ không tràn ngang, đã xem ảnh kiểm tra |
| Supabase dev thật | **3 lượt giỏ + drawer + reload pass** tại ba độ rộng; không sửa dữ liệu bán hàng |
| Quét 36 bundle trình duyệt | Không có giá trị riêng tư từ `.env` |

E2E chứng minh sửa giá từ 199.000₫ lên 249.000₫ qua admin thì mở lại drawer nhận đúng giá/tổng mới; tồn kho giảm tự giảm số lượng persist, hết hàng/ngừng bán bị loại khỏi tổng và xóa được; freeship theo số sản phẩm/giá trị đơn; lỗi mạng giữ tổng cũ và thử lại được; phản hồi chậm của giỏ cũ không ghi đè giỏ mới. API kiểm tra input sai, dòng trùng, quá 20 dòng/quá trần số lượng, JSON lỗi, biến thể không tồn tại, giá client giả, giỏ rỗng và HTTP 429.

Test dùng database `_test` độc lập, kiểm tra không trùng dev/prod trước mỗi thao tác fixture. Ảnh/probe tạm được teardown dọn, không commit. Build có một lượt prerender trang chủ quá 60 giây rồi tự retry thành công, tương tự Phase 7; chưa phải phép đo hiệu năng production.

## Phạm vi và khác biệt tài liệu

- STOREFRONT mô tả cả “MUA NGAY” và “THANH TOÁN”, còn PLAN giao checkout/tạo đơn/email ở Phase 9. Commit Phase 8 mở thêm giỏ và giữ hai nút này disabled với thông báo chuẩn bị thanh toán. Phase 9 đã được chủ shop giao trong lúc nghiệm thu và sẽ làm tiếp bằng commit riêng.
- `discountCode` và action đã có trong store nhưng chỉ nhận chuỗi rỗng; không triển khai mã giảm giá trước Phase 14a.
- `src/store/ui.ts` quản lý drawer giỏ. Menu/tìm kiếm hiện có giữ state trong component từ Phase 6, không refactor phần ngoài phạm vi.
- Dùng hướng dẫn persist của Zustand và API Route Handler/Client Component của Next.js **16.4.3** đang cài. Changelog Supabase đã kiểm tra; phase này không đổi provider, quyền RLS hay schema.
- Bản GitHub Pages vẫn là bản duyệt tĩnh độc lập. Web thật tiếp tục chạy local tại `http://localhost:3000`.

## Chủ shop cần cung cấp

Không cần thêm key cho giỏ. Cập nhật giá/tồn kho và phí vận chuyển/ngưỡng freeship thực tế trong admin; dữ liệu mẫu hiện còn ảnh placeholder. Chưa có đơn hay thanh toán thật trong phase này.
