# Phase 12 — SEO, hiệu năng, bảo mật và E2E

Ngày nghiệm thu: 30/10/2026. Phạm vi: Phase 12 của `PLAN.md`, `STOREFRONT.md` mục 12 và `ARCHITECTURE.md` mục 13, 15. Chưa triển khai Phase 13.

## Đã làm

- Metadata theo dữ liệu shop: title, description, canonical bỏ query, ảnh Open Graph/Twitter; mô tả và ảnh chính riêng cho sản phẩm. Thêm JSON-LD `Organization`, `Product`, `BreadcrumbList`; escape nội dung JSON-LD để không đóng được thẻ script.
- `/sitemap.xml` gồm trang công khai, danh mục/bộ sưu tập đang hiện và sản phẩm active thuộc danh mục đang hiện; không có sản phẩm nháp/archived/nhóm ẩn. `/robots.txt` chặn admin, checkout, giỏ, API, tra cứu và tìm kiếm. Các trang riêng tư có noindex và header tương ứng; canonical của admin/checkout không kế thừa trang chủ.
- Giảm JavaScript ban đầu: dùng `zod/mini` trong cart persist; drawer giỏ, menu mobile, tìm kiếm và bảng size chỉ tải khi mở. Giữ Radix cho dialog/sheet; kiểm tra Esc và focus. Accordion thông tin sản phẩm dùng `details/summary`, sửa thứ bậc heading. Ảnh danh mục đầu trang được preload; dùng API `preload` của Next 16.
- Trang sản phẩm dùng ISR 300 giây, dựng ở lần truy cập đầu tiên; các thao tác admin vẫn làm mới theo tag. Quote/đặt đơn tiếp tục đọc giá và tồn kho ở server, không dùng giá HTML hoặc client để tính tiền.
- Gộp lần đọc sản phẩm của metadata và nội dung trong cùng một render bằng React `cache`. Trước khi sửa, cold ISR với Supabase thật có thể treo dù gọi service trực tiếp hoàn tất; sau sửa, hai URL thật trả 200 trong khoảng 4,2 và 2,2 giây. Bổ sung test nhiều lượt GET đồng thời vào URL sản phẩm chưa dựng.
- Tắt log request/action/browser chuyển vào terminal để URL chứa token và tham số chứa dữ liệu khách không bị log mặc định. Giữ bốn security header trong kiến trúc và thêm `X-Robots-Tag` cho khu vực riêng tư.
- Thêm bộ Playwright chạy **build production + next start** với PostgreSQL `_test`. Seed trước build, dọn Data Cache cũ của fixture và không đưa probe vào build production. Stub HTTP email/Telegram chỉ tồn tại trong tiến trình test; không gửi thông báo thật.
- Theo xác nhận “duyệt” của chủ shop, bỏ nhãn chờ duyệt/TODO trên bốn trang giới thiệu/chính sách. Giữ nguyên nội dung, không tự thêm thời hạn hoặc thông tin liên hệ chưa cung cấp.

## Kiểm tra

| Kiểm tra | Kết quả |
|---|---|
| Unit/integration PostgreSQL riêng | 187 test pass, 31 file |
| Lint / TypeScript | Pass |
| Playwright production | 9/9 pass, đủ bốn luồng bắt buộc; 375/768/1280px không tràn ngang; thêm cold ISR đồng thời |
| Build bằng `.env` shop thật | Pass sau khi chuyển sản phẩm sang ISR theo lượt truy cập |
| Trình duyệt trên Supabase dev thật | 27 lượt mở trang ở 375/768/1280px, không tràn ngang, 0 page error; sitemap/robots trả 200; không gửi form liên hệ/đặt đơn |
| Quét client bundle | 62 file JavaScript, không thấy giá trị secret từ `.env` |
| Supabase dev read-only | 20 bảng bật RLS, 0 bảng thiếu RLS, 0 policy; vẫn 0 đơn và 0 tin nhắn thật |
| Dependency runtime | `npm audit --omit=dev`: 0 lỗ hổng đã biết |

Các test production bao gồm bốn kịch bản bắt buộc: mua COD từ trang chủ qua danh mục/biến thể/giỏ; QR chuyển khoản đúng tổng và mã đơn; admin xác nhận → giao với mã vận đơn → hoàn thành, kiểm tra tồn kho; tra cứu bằng mã đơn + SĐT. Chạy luồng COD/admin/tra cứu ở 375/768/1280px, kiểm tra không tràn ngang. Bổ sung metadata/sitemap/robots, quyền staff, gọi lại Server Action khi không có session, upload/export không đăng nhập, API auth bị khóa, focus/Esc, accordion và đổi giá admin làm mới ISR/JSON-LD.

## Lighthouse mobile

Đo trên production local với dữ liệu Supabase dev, tại `/` và `/products/san-pham-mau-01`. Lighthouse CLI 12.8.2, Edge headless, mobile emulation và simulated Slow 4G mặc định. Không đo trên dev server. Cache ISR phía server đã được làm nóng; mỗi lượt Lighthouse tạo phiên trình duyệt riêng. Giữ riêng hai cấu hình CPU bên dưới, không gộp điểm giữa chúng.

| Đợt đo / cấu hình | Trang chủ: P ba lượt → trung vị P/A/SEO | Sản phẩm: P ba lượt → trung vị P/A/SEO |
|---|---|---|
| Sau tối ưu ban đầu, CPU 4× | 95 / 91 / 96 → **95/100/100** | 95 / 68 / 95 → **95/100/100** |
| Build cuối, CPU 4× mặc định | 81 / 82 / 60 → **81/100/100** | 80 / 93 / 81 → **81/100/100** |
| Build cuối, CPU 2× hiệu chuẩn | 83 / 96 / 97 → **96/100/100** | 95 / 95 / 88 → **95/100/100** |

Ngưỡng 85/95/95 đạt ở bộ CPU 2× hiệu chuẩn; bộ 4× trên build cuối **chưa đạt ổn định**. Sáu lượt 4× có benchmarkIndex từ 464 đến 2443, trung vị khoảng 884; ba lượt kèm cảnh báo CPU yếu hơn dự kiến. Chọn 2× trước bộ đo mới dựa trên mức sức máy đó và [hướng dẫn hiệu chuẩn của Lighthouse](https://github.com/GoogleChrome/lighthouse/blob/main/docs/throttling.md#calibrating-the-cpu-slowdown). CPU vẫn dao động trong bộ 2× (benchmarkIndex 1483–2220,5), nên cần đo lại trên máy ổn định khi triển khai; không coi điểm 2× là điểm 4×.

Không loại lượt thấp khỏi báo cáo. Đây là dữ liệu/ảnh mẫu hiện tại; lần đầu dựng một URL sản phẩm chưa có ISR cache chậm hơn. Khi thay ảnh thật hoặc triển khai hosting cần đo lại. Kiểm tra trình duyệt có gọi API quote tự động như lượt truy cập thông thường, nhưng không gửi form liên hệ/đặt đơn hoặc email thật.

Baseline đầu Phase 12: trang chủ 63/99/100, sản phẩm 57/98/100. File JSON chi tiết nằm trong `test-results/phase12-lighthouse-*.json` (Git bỏ qua). [Hướng dẫn Lighthouse CLI](https://github.com/GoogleChrome/lighthouse) và [cấu hình throttling](https://github.com/GoogleChrome/lighthouse/blob/main/docs/throttling.md).

## Dependency và bảo mật

Chuyển `shadcn` CLI sang devDependency. Ghim nhánh esbuild cũ của `@esbuild-kit/core-utils` lên 0.25.12 qua npm override để xử lý [GHSA-67mh-4wv8-2f99](https://github.com/advisories/GHSA-67mh-4wv8-2f99); không thêm thư viện ứng dụng. `npm run db:generate` vẫn pass và không sinh thay đổi schema/migration. Full audit còn 3 cảnh báo thấp thuộc chuỗi CLI shadcn/deepmerge; runtime audit bằng 0. Không dùng `npm audit fix --force` vì đề xuất đổi major CLI ngoài phạm vi bản vá.

Rà soát guard trong Server Action/Route Handler, giới hạn API công khai, token đơn hash ở DB, validation MIME/dung lượng upload và log chỉ mã đơn/id. Kiểm tra quyền không chỉ dựa vào proxy hoặc nút bị ẩn. Các kết quả này là kiểm tra theo phạm vi dự án, không phải chứng nhận kiểm toán bảo mật độc lập.

## Khác biệt và giới hạn

- Thử prerender toàn bộ sản phẩm từ Supabase làm build timeout ở một số trang sau ba lần retry. Chuyển sang ISR dựng theo lượt truy cập; bản build sau đó pass. Giới hạn hai worker/prerender đồng thời bằng tùy chọn experimental của Next đã cài, tránh tăng tải pool khi build; cần kiểm tra lại tùy chọn khi nâng phiên bản Next.
- ARCHITECTURE có ví dụ log nguyên lỗi/email dev; tuân theo AGENTS: che dữ liệu cá nhân và không log nguyên request/action/provider error.
- `robots.txt` và noindex phục vụ crawler; quyền truy cập vẫn do guard server đảm nhiệm.
- Chưa deploy hệ thống bán hàng, chưa tạo đơn thật hoặc gửi email thật cho khách trong nghiệm thu. GitHub Pages tiếp tục là bản duyệt giao diện độc lập.

## Chủ shop cần cung cấp

- Domain gửi Resend đã xác minh để gửi tới khách ngoài email đăng ký; sender `@resend.dev` hiện chỉ dùng thử.
- Ảnh/logo, thông tin liên hệ và dữ liệu sản phẩm thật còn thiếu. Chốt các thời hạn đổi trả/lưu dữ liệu đang được ghi là cần xác nhận trong nội dung đã duyệt trước khi mở bán.
- Phase 13 chỉ triển khai khi được giao riêng.
