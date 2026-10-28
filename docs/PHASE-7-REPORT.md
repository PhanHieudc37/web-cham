# Báo cáo Phase 7 — Danh mục, tìm kiếm và sản phẩm

Ngày: **28/10/2026 — đã nghiệm thu Phase 7**.

## Đã làm

- Trang `/collections/[slug]` dùng service public: collection tự động, danh mục cha/con và collection thủ công; breadcrumb, banner/mô tả, chip danh mục con, sidebar 240px và Sheet lọc trên mobile.
- Bộ lọc size/màu/giá/còn hàng, sắp xếp và phân trang giữ trên URL. Lọc/sắp xếp/phân trang thực hiện trong SQL; reload giữ lựa chọn, đổi bộ lọc/sort quay về trang đầu. Giá trị không hợp lệ được bỏ qua. Radio/checkbox phản hồi ngay bằng state optimistic, kết quả vẫn chờ server. Có trạng thái đang cập nhật, rỗng và xóa bộ lọc.
- Trang `/search?q=` có form điền sẵn, tổng kết quả, lưới/phân trang, tìm không dấu và bốn best seller gợi ý khi không có kết quả. Enter từ SearchOverlay đi tới trang tìm kiếm thật.
- Trang `/products/[slug]` có gallery vuông, thumbnail dọc desktop, slider/dots/thumbnail mobile; đổi màu nhảy tới ảnh gán cho màu đó. Mặc định chọn màu đầu còn hàng, không tự chọn size.
- Lựa chọn size khóa theo màu và `available` từ server; hiển thị SKU, giá/badge, tình trạng, số lượng giới hạn theo `maxQuantity`. Biến thể hết hàng hoặc ngừng bán không chọn được. Có Dialog bảng size, cam kết và accordion mô tả/chất liệu/bảo quản/size/đổi trả; nội dung trống có thông báo hoặc tự ẩn phù hợp.
- StickyBuyBar mobile dùng IntersectionObserver, hỗ trợ cuộn lên chọn size khi thiếu lựa chọn, đẩy nhóm liên hệ lên trên. Có xử lý bổ sung cho cuộn tức thì để thanh không bị giữ lại khi trở về đầu trang.
- Skeleton danh mục/tìm kiếm/sản phẩm, trang lỗi với thử lại, 404 tiếng Việt. Layout kiểm tra khả năng hiển thị trước boundary `loading.tsx` để sản phẩm ẩn và slug sai trả HTTP 404 thật, thay vì 200 kèm nội dung 404 sau khi stream.
- Component mới dùng tên PascalCase theo ARCHITECTURE. Không thêm thư viện, không thay schema/migration, không sửa dữ liệu thật để kiểm thử.

## Nghiệm thu

Fixture trên PostgreSQL `_test` riêng, kiểm tra chặn địa chỉ dev/prod trước khi seed. Ảnh SVG kiểm thử tự tạo tại đường dẫn local tạm, không upload Storage. Probe cache/lỗi chỉ bật trong dev + database test và được teardown xóa; Git bỏ qua, không có trong build bình thường.

| Kiểm tra | Kết quả |
|---|---|
| `npm run lint` / `npm run typecheck` | Pass, không warning |
| `npm run test` | **133/133 pass**, 16 file, có PostgreSQL test riêng |
| `npm run build` | Pass; có đủ route danh mục/sản phẩm/tìm kiếm, không có probe test |
| `npm run e2e:browsing` | **9/9 pass**, không lỗi hydration |
| Hồi quy `npm run e2e:storefront` | **6/6 pass** |
| 375/768/1280px | Đã kiểm tra danh mục, tìm kiếm, sản phẩm và dialog; không tràn ngang |
| Kiểm tra Supabase dev thật | **9 lượt trang tại ba độ rộng + 2 đường dẫn 404 pass**, không sửa database |
| Quét source và 38 bundle trình duyệt | Không có giá trị riêng tư từ `.env` |

Các kịch bản bao gồm URL/reload/page reset, phân trang, slug tự động/danh mục/collection thủ công, query sai, kết quả rỗng, tìm “ao thun”, ảnh theo màu/thumbnail/vuốt, giới hạn số lượng, size hết hàng/ngừng bán, bảng size và accordion, sản phẩm liên quan không chứa chính nó, StickyBuyBar, overlay/Esc/focus và HTTP 404 cho draft/archived/danh mục ẩn/slug sai. Test retry tạo lỗi tạm có kiểm soát, rồi xác minh nút Thử lại thực sự lấy lại nội dung server. Integration kiểm tra DTO giới hạn số lượng theo cài đặt và không cho biến thể ngừng bán trở thành khả dụng.

Đã xem ảnh trang danh mục, tìm kiếm, chi tiết và dialog ở ba độ rộng. Sau nghiệm thu trên DB test, mở lại bằng Supabase dev thật: chọn sản phẩm từ kết quả tìm không dấu, chọn size và kiểm tra số lượng, ảnh chụp và HTTP 404. Không có lỗi runtime ở lượt này, không thay đổi nội dung thật. Probe và ảnh fixture đã được teardown xóa; local tiếp tục chạy ở `http://localhost:3000`.

Build có một lượt prerender trang chủ vượt 60 giây rồi tự retry thành công. Lượt kiểm tra local đầu tiên cũng vượt timeout 30 giây khi mở chi tiết; lượt kiểm tra lại với timeout 60 giây đã hoàn tất cả 9 trang. Đây là kết quả kiểm tra chức năng trên môi trường dev, chưa phải phép đo hiệu năng production.

Đã bổ sung test tái hiện và sửa hai lỗi trong khi nghiệm thu: radio/checkbox bị trả về trạng thái cũ trong lúc chờ navigation, và thanh mua dính không ẩn khi cuộn tức thì từ dưới lên đầu trang. Lượt chụp đầu gây cảnh báo hydration do Playwright thay style caret trước hydration; các test chờ control sẵn sàng và chụp không sửa caret, không che/tắt cảnh báo React.

## Phạm vi và khác biệt tài liệu

- STOREFRONT mục 6 mô tả cả thao tác thêm giỏ/mua ngay, trong khi PLAN giao cart store, quote và CartDrawer ở Phase 8, checkout ở Phase 9. Phase 7 hoàn thành phần xem/chọn sản phẩm; nút mua được khóa với thông báo “Cửa hàng đang chuẩn bị mở bán”. StickyBuyBar khi chưa chọn size vẫn đưa khách về vùng chọn. Không giả lập thêm giỏ hay tạo checkout trước phase được giao.
- STOREFRONT ghi nút lỗi gọi `reset()`. Next.js **16.4.3** đang cài có `retry()` để fetch lại server, còn `reset()` chỉ xóa error state. Dùng `retry()` theo tài liệu đúng phiên bản và đã kiểm thử phục hồi nội dung thực tế.
- Layout gọi public service để kiểm tra tồn tại trước khi render loading; page vẫn dùng service có cache và chuyển riêng `AppError.NOT_FOUND` thành 404. Lỗi kết nối/nghiệp vụ khác không bị nuốt thành 404.
- Bộ lọc SALE mặc định hiển thị “Giảm giá nhiều nhất” để khớp thứ tự SQL mặc định của DATABASE; khách vẫn chọn được bảy cách sắp xếp trong STOREFRONT.
- E2E chức năng ở phase này dùng dev server riêng theo bộ kiểm thử của dự án; build được kiểm tra riêng. Các luồng mua hàng production đầy đủ thuộc Phase 12.
- Bản GitHub Pages minh họa độc lập với Supabase; Phase 7 chỉ cập nhật ứng dụng thật chạy local và source GitHub. Chưa triển khai Phase 8 hoặc production.

## Chủ shop cần cung cấp

Không cần thêm key. Chủ shop bổ sung ảnh thật, màu/size/SKU, mô tả, chất liệu/hướng dẫn bảo quản và bảng số đo trong admin. Chưa có bảng size thì giao diện thông báo đang cập nhật; chưa có chính sách thì không bịa nội dung. Dữ liệu mẫu còn dùng placeholder. Credentials chỉ nằm trong `.env` local, không commit lên GitHub.
