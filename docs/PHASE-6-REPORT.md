# Báo cáo Phase 6 — Layout cửa hàng và trang chủ

Ngày: **28/10/2026 — đã nghiệm thu Phase 6**.

## Đã làm

- Layout cửa hàng đọc `getPublicSettings()` / `getMenu()` tại server: thông báo cao 36px, header sticky 64/72px, logo, menu desktop/mobile, tìm kiếm, liên kết giỏ hàng, footer và nhóm liên hệ nổi.
- Announcement đổi câu sau 4 giây. Mega menu mở khi hover/focus, đóng sau khi rời 150ms hoặc Esc; danh mục cha/con, ảnh bộ sưu tập trang chủ đầu tiên, liên kết tất cả sản phẩm. Menu mobile dùng Sheet 85%/tối đa 360px, SHOP và danh mục mở rộng; hỗ trợ Esc, overlay, focus và khóa cuộn.
- SearchOverlay tự focus, debounce 200ms, hủy request cũ, trạng thái đang tải/không có kết quả/lỗi; tối đa sáu gợi ý có ảnh/tên/giá, Enter chuyển đúng URL tìm kiếm. `GET /api/search/suggest` validate zod → công khai + rate limit 60/phút/IP → service → ActionResult; HTTP status và Cache-Control theo ARCHITECTURE.
- Trang chủ theo đúng thứ tự tài liệu: hero → danh mục → best seller → new arrival → bộ sưu tập → sale → câu chuyện → cam kết. Section rỗng tự ẩn. Service bổ sung ảnh danh mục, bộ sưu tập nổi bật, trạng thái có sale và tối đa bốn sản phẩm sale; không thay schema.
- Hero dùng Embla, `<picture>`/`getImageProps` cho ảnh desktop/mobile, tải ưu tiên ảnh đầu, vuốt, dots/mũi tên và autoplay 5 giây. Chỉ một banner thì ẩn điều khiển. Tắt autoplay/animation khi bật giảm chuyển động; hero dừng tự chuyển khi hover/focus.
- ProductCard dùng khung vuông, ảnh hover chỉ ở thiết bị có chuột, badge NEW/giảm giá/hết hàng, giá VND từ DTO server và chấm màu. Grid 2/3/4 cột. Ảnh lỗi có placeholder.
- Footer và nút Zalo/Messenger/gọi chỉ hiện thông tin đã cấu hình; pháp lý/BCT và chuyển khoản cũng có điều kiện. Nút về đầu trang hiện sau 600px. Focus có viền rõ trên cả nền trắng và footer đen.
- Cache có namespace băm từ địa chỉ database và user pooler, không chứa mật khẩu; tránh đọc nhầm dữ liệu test khi khởi động lại cùng workspace với Supabase dev. Giữ nguyên tag invalidation và TTL đã định.
- Không thêm thư viện, không đổi schema/migration, không sửa nội dung shop thật để làm fixture.

## Nghiệm thu

Các bộ E2E có mutation dùng PostgreSQL `_test` riêng và kiểm tra chặn địa chỉ dev/prod trước khi seed. Fixture storefront dùng ảnh placeholder local, không upload ảnh lên Storage. Bộ hồi quy content tự dọn đúng ảnh mà nó tạo; cache probe chỉ tồn tại trong kiểm thử và được teardown xóa.

| Kiểm tra | Kết quả |
|---|---|
| `npm run lint` / `npm run typecheck` | Pass, không warning |
| `npm run test` | **132/132 pass**, 16 file, có PostgreSQL test riêng |
| `npm run build` | Pass, không chứa cache probe test |
| `npm run e2e:storefront` | **6/6 pass** |
| Hồi quy `npm run e2e:content` | **7/7 pass** |
| `npm run e2e`: trang chủ Supabase dev thật / font / security headers | **3/3 pass** |
| 375/768/1280px | Trang chủ/menu/tìm kiếm không tràn ngang; có ảnh kiểm tra |
| Quét source thay đổi và bundle trình duyệt | Không có giá trị riêng tư từ `.env` |

E2E storefront kiểm tra thứ tự và dữ liệu section, section rỗng, danh mục con, sale/NEW/hết hàng, thông tin thiếu tự ẩn, focus/Esc/overlay, gợi ý không dấu tối đa sáu, debounce, lỗi validate/rate limit, autoplay/giảm chuyển động và lưu liên hệ qua admin rồi nhận ngay trên trang chủ thật. Không có page error hoặc hydration error. Sau khi xem ảnh, đã sửa chiều cao Accordion lồng để danh mục con mobile không bị cắt, bổ sung kiểm tra nằm trong viewport.

Đã mở và chụp trang chủ bằng dữ liệu Supabase dev thật tại ba độ rộng, xem ảnh sau kiểm thử; font và security headers đúng, không tràn ngang và không lẫn fixture. Banner mẫu chỉ có một nên không hiện điều khiển slider; thông tin liên hệ/pháp lý/giới thiệu chưa có được ẩn. Không sửa dữ liệu thật. Cache probe đã được teardown xóa. Web tiếp tục chạy local để chủ shop xem.

## Phạm vi và tài liệu

- Icon giỏ hàng là liên kết chuẩn `/cart`; badge/hydration, CartDrawer, quote và mua hàng thuộc Phase 8. Chưa triển khai các phần này.
- Các liên kết sản phẩm/danh mục/tìm kiếm dẫn tới route đã định; nội dung các trang thuộc Phase 7. Trang giới thiệu/chính sách/liên hệ/tra cứu cũng theo các phase sau. Phase 6 chưa phải website đã mở bán.
- STOREFRONT yêu cầu ảnh BrandStory nhưng DATABASE không có field riêng. Dùng ảnh bộ sưu tập trang chủ đầu tiên, rồi banner/danh mục đã cấu hình; thiếu ảnh thì chỉ hiện nội dung thật. Không tự bịa ảnh hoặc thêm schema.
- ARCHITECTURE cho phép gợi ý được cache CDN 60 giây; giữ đúng hợp đồng này. Dữ liệu trang chủ/menu/settings vẫn xóa cache ngay sau thao tác lưu ở admin.
- Giữ `unstable_cache` qua wrapper theo ARCHITECTURE hiện có; đã đọc tài liệu Next.js 16.4.3 cài tại máy và biết khuyến nghị `use cache`, không tự chuyển cấu hình cache của dự án trong Phase 6.
- Bản GitHub Pages minh họa độc lập với Supabase và không được đổi thành backend bán hàng. Chưa deploy production, chưa bắt đầu Phase 7.

## Chủ shop cần cung cấp

Không cần thêm key. Có thể vào admin nhập ảnh sản phẩm, ảnh danh mục/banner, giới thiệu, kênh liên hệ và thông tin pháp lý/ngân hàng thật. Các dữ liệu mẫu còn dùng placeholder; thiếu thông tin thì giao diện tự ẩn. Credentials chỉ nằm trong `.env` local, không commit lên GitHub.
