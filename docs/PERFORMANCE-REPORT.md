# PERFORMANCE REPORT — Cham.stu

Ngân sách Phase 15: tối đa 4 deploy production; 15.0 không deploy.


## Baseline — Phase 15.0 — 2026-11-01 21:56:16 +07:00

- Đo trực tiếp trên máy Windows của chủ shop tại Việt Nam; mạng: Wi-Fi; nhà mạng/VPN chưa xác minh (do chủ shop cung cấp). Không mô phỏng tốc độ/CPU. Chưa xác minh nhà mạng hoặc VPN.
- Origin: https://chamstu.netlify.app; commit production: `aa3f8b34543ea70f5541c0cdf82aafbf2b2077db`; Chromium 156.0.8078.4, headless, viewport 1280×720.
- Credit Netlify còn lại trước đợt đo: **221/300 credit**, chủ shop xác nhận là số còn lại ngày 01/11/2026. API xác minh gói credit-free, hạn mức 300, auto top-up tắt. Deploy production Phase 15 đã dùng: **0/4**.
- Mỗi ca: 1 lượt làm ấm bỏ khỏi thống kê → 5 lượt tuần tự, dùng lại browser context/cache. Mỗi lượt đợi heading nội dung, đếm request ứng dụng tới 1 giây sau heading; không tính ảnh/file tĩnh/third-party. Prefetch/RSC và API cùng origin vẫn được tính.
- TTFB điều hướng = responseStart − startTime của Navigation Timing; đăng nhập = TTFB POST Server Action của form login, nội dung = từ bấm Đăng nhập tới heading tổng quan. Back = thời gian từ thao tác Back tới heading danh sách, không ép reload; nếu không có response mạng thì TTFB/header là —. Quote = POST tới khi nhận JSON, không phải heading.
- Trung vị = median; p90 dùng nearest-rank (với 5 lượt là giá trị lớn nhất). Đây là mẫu nhỏ khi đã làm ấm, không phải SLA, Lighthouse hoặc phép đo cold-start.
- Chỉ đọc nghiệp vụ production. Login tạo phiên xác thực; quote vẫn ghi rate_limits theo hành vi hiện tại. Không tạo đơn/sản phẩm/tin nhắn; không xuất cookie, password, tên khách, mã đơn hoặc response body vào báo cáo.

| Ca đo | TTFB median / p90 (ms) | Nội dung median / p90 (ms) | Request median / p90 | Kết quả |
|---|---:|---:|---:|---|
| Cửa hàng — trang chủ | 48 / 67 | 223 / 457 | 19 / 22 | 5/5 lượt |
| Cửa hàng — danh mục | 392 / 613 | 479 / 725 | 12 / 14 | 5/5 lượt |
| Cửa hàng — danh mục có bộ lọc | 354 / 473 | 443 / 544 | 13 / 13 | 5/5 lượt |
| Cửa hàng — tìm kiếm | 342 / 390 | 415 / 723 | 24 / 28 | 5/5 lượt |
| Cửa hàng — giới thiệu | 47 / 49 | 106 / 126 | 19 / 21 | 5/5 lượt |
| Cửa hàng — sản phẩm | — / — | — / — | — / — | Không có sản phẩm public; không tạo dữ liệu giả |
| Cửa hàng — quote giỏ rỗng | 955 / 984 | 955 / 984 | 1 / 1 | 5/5 lượt |
| Admin — đăng nhập → tổng quan | 2600 / 2689 | 4919 / 5298 | 5 / 7 | 5/5 lượt |
| Admin — tổng quan | 1403 / 1434 | 2284 / 2313 | 1 / 1 | 5/5 lượt |
| Admin — đơn hàng | 1375 / 1414 | 2237 / 2318 | 7 / 7 | 5/5 lượt |
| Admin — sản phẩm | 1368 / 1540 | 2256 / 2445 | 3 / 3 | 5/5 lượt |
| Admin — chi tiết đơn | — / — | — / — | — / — | Chưa có dữ liệu hiện hữu để đo |
| Admin — form sản phẩm | — / — | — / — | — / — | Chưa có dữ liệu hiện hữu để đo |
| Admin — Back về danh sách đơn | 311 / 323 | 23 / 37 | 1 / 1 | 5/5 lượt |

### Từng lượt đo

| Ca đo | Lượt | HTTP | TTFB (ms) | Nội dung (ms) | Request | Cache-Status | Age |
|---|---:|---:|---:|---:|---:|---|---|
| Cửa hàng — trang chủ | 1 | 200 | 48 | 145 | 19 | "Netlify Edge"; hit; ttl=85 | 217 |
| Cửa hàng — trang chủ | 2 | 200 | 67 | 223 | 18 | "Netlify Edge"; hit; ttl=84 | 217 |
| Cửa hàng — trang chủ | 3 | 200 | 47 | 342 | 18 | "Netlify Edge"; hit; ttl=83 | 217 |
| Cửa hàng — trang chủ | 4 | 200 | 49 | 457 | 22 | "Netlify Edge"; hit; ttl=82 | 217 |
| Cửa hàng — trang chủ | 5 | 200 | 47 | 111 | 20 | "Netlify Edge"; hit; ttl=80 | 217 |
| Cửa hàng — danh mục | 1 | 200 | 371 | 479 | 14 | "Netlify Durable"; fwd=bypass "Netlify Edge"; fwd=miss; fwd-status=200 | 0 |
| Cửa hàng — danh mục | 2 | 200 | 378 | 460 | 12 | "Netlify Durable"; fwd=bypass "Netlify Edge"; fwd=miss; fwd-status=200 | 1 |
| Cửa hàng — danh mục | 3 | 200 | 594 | 677 | 12 | "Netlify Durable"; fwd=bypass "Netlify Edge"; fwd=miss; fwd-status=200 | 0 |
| Cửa hàng — danh mục | 4 | 200 | 392 | 466 | 12 | "Netlify Durable"; fwd=bypass "Netlify Edge"; fwd=miss; fwd-status=200 | 0 |
| Cửa hàng — danh mục | 5 | 200 | 613 | 725 | 12 | "Netlify Durable"; fwd=bypass "Netlify Edge"; fwd=miss; fwd-status=200 | 2 |
| Cửa hàng — danh mục có bộ lọc | 1 | 200 | 345 | 429 | 13 | "Netlify Durable"; fwd=bypass "Netlify Edge"; fwd=miss; fwd-status=200 | 0 |
| Cửa hàng — danh mục có bộ lọc | 2 | 200 | 354 | 443 | 13 | "Netlify Durable"; fwd=bypass "Netlify Edge"; fwd=miss; fwd-status=200 | 0 |
| Cửa hàng — danh mục có bộ lọc | 3 | 200 | 351 | 429 | 13 | "Netlify Durable"; fwd=bypass "Netlify Edge"; fwd=miss; fwd-status=200 | 0 |
| Cửa hàng — danh mục có bộ lọc | 4 | 200 | 473 | 544 | 13 | "Netlify Durable"; fwd=bypass "Netlify Edge"; fwd=miss; fwd-status=200 | 0 |
| Cửa hàng — danh mục có bộ lọc | 5 | 200 | 438 | 526 | 13 | "Netlify Durable"; fwd=bypass "Netlify Edge"; fwd=miss; fwd-status=200 | 0 |
| Cửa hàng — tìm kiếm | 1 | 200 | 342 | 723 | 28 | "Netlify Durable"; fwd=bypass "Netlify Edge"; fwd=miss; fwd-status=200 | 0 |
| Cửa hàng — tìm kiếm | 2 | 200 | 390 | 450 | 19 | "Netlify Durable"; fwd=bypass "Netlify Edge"; fwd=miss; fwd-status=200 | 1 |
| Cửa hàng — tìm kiếm | 3 | 200 | 338 | 403 | 24 | "Netlify Durable"; fwd=bypass "Netlify Edge"; fwd=miss; fwd-status=200 | 0 |
| Cửa hàng — tìm kiếm | 4 | 200 | 339 | 402 | 23 | "Netlify Durable"; fwd=bypass "Netlify Edge"; fwd=miss; fwd-status=200 | 0 |
| Cửa hàng — tìm kiếm | 5 | 200 | 354 | 415 | 24 | "Netlify Durable"; fwd=bypass "Netlify Edge"; fwd=miss; fwd-status=200 | 0 |
| Cửa hàng — giới thiệu | 1 | 200 | 47 | 121 | 19 | "Netlify Edge"; hit; ttl=91 | 208 |
| Cửa hàng — giới thiệu | 2 | 200 | 46 | 101 | 21 | "Netlify Edge"; hit; ttl=89 | 208 |
| Cửa hàng — giới thiệu | 3 | 200 | 46 | 100 | 20 | "Netlify Edge"; hit; ttl=88 | 208 |
| Cửa hàng — giới thiệu | 4 | 200 | 49 | 126 | 19 | "Netlify Edge"; hit; ttl=87 | 208 |
| Cửa hàng — giới thiệu | 5 | 200 | 49 | 106 | 18 | "Netlify Edge"; hit; ttl=86 | 208 |
| Cửa hàng — quote giỏ rỗng | 1 | 200 | 955 | 955 | 1 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 0 |
| Cửa hàng — quote giỏ rỗng | 2 | 200 | 954 | 954 | 1 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 1 |
| Cửa hàng — quote giỏ rỗng | 3 | 200 | 984 | 984 | 1 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 1 |
| Cửa hàng — quote giỏ rỗng | 4 | 200 | 947 | 948 | 1 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 1 |
| Cửa hàng — quote giỏ rỗng | 5 | 200 | 963 | 964 | 1 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 1 |
| Admin — đăng nhập → tổng quan | 1 | 200 | 2596 | 4828 | 7 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 2 |
| Admin — đăng nhập → tổng quan | 2 | 200 | 2600 | 5298 | 5 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 3 |
| Admin — đăng nhập → tổng quan | 3 | 200 | 2601 | 4804 | 5 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 2 |
| Admin — đăng nhập → tổng quan | 4 | 200 | 2584 | 4981 | 5 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 3 |
| Admin — đăng nhập → tổng quan | 5 | 200 | 2689 | 4919 | 7 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 2 |
| Admin — tổng quan | 1 | 200 | 1403 | 2313 | 1 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 1 |
| Admin — tổng quan | 2 | 200 | 1427 | 2284 | 1 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 2 |
| Admin — tổng quan | 3 | 200 | 1390 | 2274 | 1 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 1 |
| Admin — tổng quan | 4 | 200 | 1434 | 2304 | 1 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 1 |
| Admin — tổng quan | 5 | 200 | 1388 | 2253 | 1 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 2 |
| Admin — đơn hàng | 1 | 200 | 1364 | 2236 | 7 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 1 |
| Admin — đơn hàng | 2 | 200 | 1375 | 2237 | 7 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 1 |
| Admin — đơn hàng | 3 | 200 | 1386 | 2261 | 7 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 2 |
| Admin — đơn hàng | 4 | 200 | 1414 | 2318 | 7 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 1 |
| Admin — đơn hàng | 5 | 200 | 1368 | 2227 | 7 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 1 |
| Admin — sản phẩm | 1 | 200 | 1540 | 2445 | 3 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 1 |
| Admin — sản phẩm | 2 | 200 | 1385 | 2256 | 3 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 1 |
| Admin — sản phẩm | 3 | 200 | 1367 | 2256 | 3 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 3 |
| Admin — sản phẩm | 4 | 200 | 1362 | 2290 | 3 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 1 |
| Admin — sản phẩm | 5 | 200 | 1368 | 2249 | 3 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 1 |
| Admin — Back về danh sách đơn | 1 | 200 | 323 | 23 | 1 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 0 |
| Admin — Back về danh sách đơn | 2 | 200 | 323 | 23 | 1 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 1 |
| Admin — Back về danh sách đơn | 3 | 200 | 310 | 17 | 1 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 0 |
| Admin — Back về danh sách đơn | 4 | 200 | 311 | 37 | 1 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 0 |
| Admin — Back về danh sách đơn | 5 | 200 | 309 | 17 | 1 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 0 |

## Nghiệm thu Phase 15.0

- Đã thêm `scripts/measure-performance.ts`, `npm run perf:measure` và bảng từng lượt/trung vị/p90 ở trên. Chạy lại: `npm run perf:measure -- --stage baseline --network "Wi-Fi" --credits "221/300 còn lại"`; sau chuyển database dùng `--stage 15A` và số credit cập nhật. Công cụ nối thêm mốc đo, không ghi đè Baseline.
- Baseline chính thức là lượt hoàn tất 21:56:16 +07:00, đo tuần tự sau khi test/build đã kết thúc. Lượt thử ban đầu bắt nhầm endpoint đăng nhập đã được loại; không dùng để so sánh. Raw JSON chỉ có chỉ số đo nằm trong `test-results/`, được Git ignore.
- Production không có sản phẩm public, sản phẩm quản trị hoặc đơn: 3 ca tương ứng chưa thể đo và được ghi rõ ở bảng; không tạo dữ liệu giả để lấp số. Quote dùng giỏ rỗng; chưa đại diện cho giỏ có nhiều biến thể. Cần đo bổ sung khi shop có dữ liệu thật.
- Lint, typecheck, build pass; 206/206 unit/integration pass (35 file), gồm thống kê median/p90 và loại request ảnh/tĩnh. Không đổi giao diện hay schema; không có kiểm tra UI 3 độ rộng mới cần thực hiện cho công cụ CLI.
- Đã đọc PERFORMANCE-PLAN.md đầy đủ; chỉ nhận 15.0 và 15A, không làm 15B/15C/15D. Chưa đổi auth/cache/session đang chạy.

## Sổ deploy Phase 15

| Lần | Phase | Commit/deployment | Trạng thái |
|---|---|---|---|
| — | 15.0 | `724c44a` và chuẩn bị `8c071c8`, dùng `[skip netlify]` | Không deploy |
| #1 | 15A | `251cdbd`, deployment `6ae7562256127a90fa565c62` | Ready; đã dùng 1/4 |

Giới hạn cả Phase 15 là 4 deploy production. Commit chỉ sửa tài liệu và công cụ đo dùng `[skip netlify]` để giữ lượt cho 15A/15B/15C.

## Sau Phase 15A — 2026-11-01 22:12:56 +07:00

- Đo trực tiếp trên máy Windows của chủ shop tại Việt Nam; mạng: Wi-Fi; nhà mạng/VPN chưa xác minh (do chủ shop cung cấp). Không mô phỏng tốc độ/CPU. Chưa xác minh nhà mạng hoặc VPN.
- Origin: https://chamstu.netlify.app; commit production: `251cdbdce46ea4900bd9930fb6c1fd02a463756f`; Chromium 156.0.8078.4, headless, viewport 1280×720.
- Mốc credit trước Phase 15: **221/300 còn lại**, theo chủ shop. Sau 15A đã dùng **1/4 deploy production**; số Usage hiện tại chưa đọc lại, không suy đoán số dư còn lại.
- Mỗi ca: 1 lượt làm ấm bỏ khỏi thống kê → 5 lượt tuần tự, dùng lại browser context/cache. Mỗi lượt đợi heading nội dung, đếm request ứng dụng tới 1 giây sau heading; không tính ảnh/file tĩnh/third-party. Prefetch/RSC và API cùng origin vẫn được tính.
- TTFB điều hướng = responseStart − startTime của Navigation Timing; đăng nhập = TTFB POST Server Action của form login, nội dung = từ bấm Đăng nhập tới heading tổng quan. Back = thời gian từ thao tác Back tới heading danh sách, không ép reload; nếu không có response mạng thì TTFB/header là —. Quote = POST tới khi nhận JSON, không phải heading.
- Trung vị = median; p90 dùng nearest-rank (với 5 lượt là giá trị lớn nhất). Đây là mẫu nhỏ khi đã làm ấm, không phải SLA, Lighthouse hoặc phép đo cold-start.
- Chỉ đọc nghiệp vụ production. Login tạo phiên xác thực; quote vẫn ghi rate_limits theo hành vi hiện tại. Không tạo đơn/sản phẩm/tin nhắn; không xuất cookie, password, tên khách, mã đơn hoặc response body vào báo cáo.

| Ca đo | TTFB median / p90 (ms) | Nội dung median / p90 (ms) | Request median / p90 | Kết quả |
|---|---:|---:|---:|---|
| Cửa hàng — trang chủ | 54 / 3284 | 132 / 3342 | 18 / 27 | 5/5 lượt |
| Cửa hàng — danh mục | 438 / 754 | 517 / 819 | 12 / 12 | 5/5 lượt |
| Cửa hàng — danh mục có bộ lọc | 373 / 446 | 467 / 747 | 13 / 13 | 5/5 lượt |
| Cửa hàng — tìm kiếm | 370 / 622 | 467 / 689 | 23 / 24 | 5/5 lượt |
| Cửa hàng — giới thiệu | 43 / 357 | 105 / 419 | 21 / 24 | 5/5 lượt |
| Cửa hàng — sản phẩm | — / — | — / — | — / — | Không có sản phẩm public; không tạo dữ liệu giả |
| Cửa hàng — quote giỏ rỗng | 314 / 326 | 314 / 326 | 1 / 1 | 5/5 lượt |
| Admin — đăng nhập → tổng quan | 566 / 628 | 1212 / 1421 | 5 / 7 | 5/5 lượt |
| Admin — tổng quan | 381 / 399 | 736 / 768 | 1 / 1 | 5/5 lượt |
| Admin — đơn hàng | 676 / 693 | 742 / 1038 | 7 / 7 | 5/5 lượt |
| Admin — sản phẩm | 406 / 1499 | 471 / 1870 | 3 / 3 | 5/5 lượt |
| Admin — chi tiết đơn | — / — | — / — | — / — | Chưa có dữ liệu hiện hữu để đo |
| Admin — form sản phẩm | — / — | — / — | — / — | Chưa có dữ liệu hiện hữu để đo |
| Admin — Back về danh sách đơn | 746 / 825 | 13 / 17 | 1 / 2 | 5/5 lượt |

### Từng lượt đo

| Ca đo | Lượt | HTTP | TTFB (ms) | Nội dung (ms) | Request | Cache-Status | Age |
|---|---:|---:|---:|---:|---:|---|---|
| Cửa hàng — trang chủ | 1 | 200 | 44 | 132 | 14 | "Netlify Edge"; hit; ttl=275 | 25 |
| Cửa hàng — trang chủ | 2 | 200 | 3284 | 3342 | 27 | "Netlify Edge"; hit; ttl=270 | 25 |
| Cửa hàng — trang chủ | 3 | 200 | 94 | 151 | 17 | "Netlify Edge"; hit; ttl=269 | 25 |
| Cửa hàng — trang chủ | 4 | 200 | 54 | 110 | 19 | "Netlify Edge"; hit; ttl=268 | 25 |
| Cửa hàng — trang chủ | 5 | 200 | 44 | 117 | 18 | "Netlify Edge"; hit; ttl=267 | 25 |
| Cửa hàng — danh mục | 1 | 200 | 754 | 819 | 12 | "Netlify Durable"; fwd=bypass "Netlify Edge"; fwd=miss; fwd-status=200 | 1 |
| Cửa hàng — danh mục | 2 | 200 | 543 | 611 | 12 | "Netlify Durable"; fwd=bypass "Netlify Edge"; fwd=miss; fwd-status=200 | 1 |
| Cửa hàng — danh mục | 3 | 200 | 438 | 517 | 12 | "Netlify Durable"; fwd=bypass "Netlify Edge"; fwd=miss; fwd-status=200 | 0 |
| Cửa hàng — danh mục | 4 | 200 | 397 | 462 | 12 | "Netlify Durable"; fwd=bypass "Netlify Edge"; fwd=miss; fwd-status=200 | 1 |
| Cửa hàng — danh mục | 5 | 200 | 414 | 478 | 12 | "Netlify Durable"; fwd=bypass "Netlify Edge"; fwd=miss; fwd-status=200 | 0 |
| Cửa hàng — danh mục có bộ lọc | 1 | 200 | 446 | 525 | 13 | "Netlify Durable"; fwd=bypass "Netlify Edge"; fwd=miss; fwd-status=200 | 0 |
| Cửa hàng — danh mục có bộ lọc | 2 | 200 | 338 | 430 | 13 | "Netlify Durable"; fwd=bypass "Netlify Edge"; fwd=miss; fwd-status=200 | 1 |
| Cửa hàng — danh mục có bộ lọc | 3 | 200 | 373 | 747 | 13 | "Netlify Durable"; fwd=bypass "Netlify Edge"; fwd=miss; fwd-status=200 | 0 |
| Cửa hàng — danh mục có bộ lọc | 4 | 200 | 363 | 440 | 13 | "Netlify Durable"; fwd=bypass "Netlify Edge"; fwd=miss; fwd-status=200 | 0 |
| Cửa hàng — danh mục có bộ lọc | 5 | 200 | 417 | 467 | 13 | "Netlify Durable"; fwd=bypass "Netlify Edge"; fwd=miss; fwd-status=200 | 2 |
| Cửa hàng — tìm kiếm | 1 | 200 | 622 | 689 | 23 | "Netlify Durable"; fwd=bypass "Netlify Edge"; fwd=miss; fwd-status=200 | 1 |
| Cửa hàng — tìm kiếm | 2 | 200 | 370 | 424 | 22 | "Netlify Durable"; fwd=bypass "Netlify Edge"; fwd=miss; fwd-status=200 | 0 |
| Cửa hàng — tìm kiếm | 3 | 200 | 351 | 483 | 23 | "Netlify Durable"; fwd=bypass "Netlify Edge"; fwd=miss; fwd-status=200 | 0 |
| Cửa hàng — tìm kiếm | 4 | 200 | 405 | 467 | 24 | "Netlify Durable"; fwd=bypass "Netlify Edge"; fwd=miss; fwd-status=200 | 0 |
| Cửa hàng — tìm kiếm | 5 | 200 | 348 | 426 | 22 | "Netlify Durable"; fwd=bypass "Netlify Edge"; fwd=miss; fwd-status=200 | 0 |
| Cửa hàng — giới thiệu | 1 | 200 | 357 | 419 | 24 | "Next.js"; hit "Netlify Durable"; fwd=stale; ttl=-385; stored "Netlify Edge"; fwd=stale; fwd-status=200; ttl=-384; stored | 3 |
| Cửa hàng — giới thiệu | 2 | 200 | 43 | 99 | 19 | "Netlify Edge"; hit; ttl=297 | 3 |
| Cửa hàng — giới thiệu | 3 | 200 | 43 | 105 | 19 | "Netlify Edge"; hit; ttl=296 | 3 |
| Cửa hàng — giới thiệu | 4 | 200 | 49 | 125 | 21 | "Netlify Edge"; hit; ttl=295 | 3 |
| Cửa hàng — giới thiệu | 5 | 200 | 43 | 101 | 21 | "Netlify Edge"; hit; ttl=294 | 3 |
| Cửa hàng — quote giỏ rỗng | 1 | 200 | 325 | 325 | 1 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 0 |
| Cửa hàng — quote giỏ rỗng | 2 | 200 | 299 | 299 | 1 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 0 |
| Cửa hàng — quote giỏ rỗng | 3 | 200 | 326 | 326 | 1 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 1 |
| Cửa hàng — quote giỏ rỗng | 4 | 200 | 314 | 314 | 1 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 0 |
| Cửa hàng — quote giỏ rỗng | 5 | 200 | 307 | 307 | 1 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 0 |
| Admin — đăng nhập → tổng quan | 1 | 200 | 628 | 1415 | 5 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 0 |
| Admin — đăng nhập → tổng quan | 2 | 200 | 566 | 1115 | 5 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 0 |
| Admin — đăng nhập → tổng quan | 3 | 200 | 565 | 1212 | 5 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 1 |
| Admin — đăng nhập → tổng quan | 4 | 200 | 571 | 1133 | 7 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 1 |
| Admin — đăng nhập → tổng quan | 5 | 200 | 540 | 1421 | 5 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 0 |
| Admin — tổng quan | 1 | 200 | 381 | 746 | 1 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 0 |
| Admin — tổng quan | 2 | 200 | 399 | 768 | 1 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 0 |
| Admin — tổng quan | 3 | 200 | 370 | 736 | 1 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 0 |
| Admin — tổng quan | 4 | 200 | 386 | 454 | 1 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 1 |
| Admin — tổng quan | 5 | 200 | 365 | 734 | 1 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 0 |
| Admin — đơn hàng | 1 | 200 | 679 | 811 | 7 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 1 |
| Admin — đơn hàng | 2 | 200 | 514 | 606 | 7 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 0 |
| Admin — đơn hàng | 3 | 200 | 693 | 1038 | 7 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 0 |
| Admin — đơn hàng | 4 | 200 | 676 | 742 | 7 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 0 |
| Admin — đơn hàng | 5 | 200 | 387 | 453 | 7 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 2 |
| Admin — sản phẩm | 1 | 200 | 381 | 462 | 3 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 0 |
| Admin — sản phẩm | 2 | 200 | 1499 | 1870 | 3 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 0 |
| Admin — sản phẩm | 3 | 200 | 378 | 435 | 3 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 0 |
| Admin — sản phẩm | 4 | 200 | 501 | 595 | 3 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 1 |
| Admin — sản phẩm | 5 | 200 | 406 | 471 | 3 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 0 |
| Admin — Back về danh sách đơn | 1 | 200 | 825 | 17 | 2 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 2 |
| Admin — Back về danh sách đơn | 2 | 200 | 725 | 13 | 1 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 0 |
| Admin — Back về danh sách đơn | 3 | 200 | 319 | 12 | 1 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 0 |
| Admin — Back về danh sách đơn | 4 | 200 | 746 | 13 | 1 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 0 |
| Admin — Back về danh sách đơn | 5 | 200 | 754 | 11 | 2 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 0 |

## Nghiệm thu hiệu năng 15A trên Ohio

Deployment `6ae7562256127a90fa565c62`, commit `251cdbdce46ea4900bd9930fb6c1fd02a463756f`, Ready 01/11/2026 22:10:20 +07:00. Region Functions và Supabase đều `us-east-2`. Cùng máy Windows, Wi-Fi chủ shop xác nhận, cùng Chromium/cách đo với Baseline. Không chạy build/test song song với phép đo chính thức.

### Probe database: giữ cả hai đợt đo

Mỗi đợt bỏ lượt 0 làm ấm, lấy đúng 5 lượt tiếp theo. Tất cả HTTP 200, no-store, SHA khớp commit triển khai; chỉ chạy `select 1`. Đơn vị ms.

| Đợt | Lượt làm ấm | 1 | 2 | 3 | 4 | 5 | Trung vị | p90 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Ngay sau deploy | 3,79 | 16,11 | 15,47 | 3,34 | 3,47 | 12,73 | **12,73** | 16,11 |
| Sau bộ đo đầy đủ, kiểm tra lại vì đợt đầu chưa đạt | 3,33 | 2,67 | 2,28 | 2,43 | 2,33 | 2,56 | **2,43** | 2,67 |

Đợt đầu **không đạt** ngưỡng <10 ms; đợt kiểm tra lại khi đã có tải ổn định đạt. Không xóa hoặc thay số đợt đầu, không coi mọi request đều <10 ms. Chưa tách độc lập ảnh hưởng mở kết nối, cấp phát instance và dao động compute/network; không gán chắc chắn nguyên nhân cho cold start. Baseline cũ chưa có endpoint health nên không có số DB tương đương trước chuyển.

Probe chức năng riêng sau khi Singapore đã pause vẫn HTTP 200/đúng commit, `dbMs=44,4`; đây là một lượt sau khoảng nghỉ, không nằm trong batch 5 lượt đã làm ấm và không thay đổi thống kê của batch. Số đó tiếp tục cho thấy thời gian thực tế có dao động, không cam kết <10 ms ở mọi lần gọi.

### So sánh thời gian thấy nội dung chính

| Ca | Baseline median / p90 (ms) | Sau 15A median / p90 (ms) |
|---|---:|---:|
| Đăng nhập → tổng quan | 4919 / 5298 | **1212 / 1421** |
| Admin tổng quan | 2284 / 2313 | **736 / 768** |
| Admin đơn hàng | 2237 / 2318 | **742 / 1038** |
| Admin sản phẩm | 2256 / 2445 | **471 / 1870** |
| Quote giỏ rỗng | 955 / 984 | **314 / 326** |
| Back về danh sách đơn | 23 / 37 | **13 / 17** |

Ba trang admin đạt mục tiêu median <1 s của 15A trên dữ liệu production hiện có. p90 sản phẩm vẫn 1,87 s; không suy ra đã đạt 15C hoặc hết mọi lượt chậm. Back có thể hiện lại nội dung trước khi request làm mới nền hoàn tất; TTFB của request nền có thể lớn hơn thời gian thấy heading, không diễn giải đó là CDN cache admin.

Cửa hàng chưa cải thiện ổn định ở mọi trang: danh mục median 517 ms so với 479 ms baseline, tìm kiếm 467 ms so với 415 ms. Trang chủ median 132 ms nhưng p90 3342 ms (có lượt chậm). Các việc cache/tìm kiếm ở 15B và admin ở 15C chưa triển khai. Chưa đo sản phẩm/chi tiết đơn/form sản phẩm vì không có dữ liệu thật; quote rỗng không đại diện giỏ nhiều biến thể. Mẫu 5 lượt không phải SLA hoặc đánh giá tải lớn.

### Kiểm tra chức năng và ngân sách

- Lint/typecheck/build và 210/210 unit/integration pass cho phần code health. Sau deploy đã pass 30 lượt trang trên hosting ở 375/768/1280px, không tràn ngang/lỗi trình duyệt; đăng nhập admin mới, anonymous guard, export 401, private headers, sitemap origin và banner email disabled đúng. Không tạo đơn/sản phẩm/tin nhắn hoặc gửi email production.
- Bucket Ohio public đúng 2 MB, WebP/JPEG/PNG; chưa có ảnh thật nên chưa nghiệm thu một upload/ảnh sản phẩm thực tế. `production:check` pass với 20 bảng RLS, 0 policy public, 1 admin, 0 sample.
- Chỉ deploy production **1/4 lần**. Mốc credit trước Phase 15: chủ shop xác nhận còn **221/300**. Theo [bảng tính credit Netlify](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/how-credits-work/), deploy production tính 15 credit/lần, request/compute/bandwidth tính thêm. Chưa đọc lại Usage cuối kỳ, không ghi một số dư suy đoán; vẫn Free và auto top-up tắt.

### Trạng thái hạ tầng cuối 15A

Supabase connector xác minh `cham-stu-prod-us` Ohio và `cham-stu-dev` Tokyo đều `ACTIVE_HEALTHY`; Singapore cũ `INACTIVE`. Dev đã resume và `SELECT 1` bằng URL/mật khẩu cũ thành công, đủ 20 bảng public; `.env` dev không đổi. `production:check` Ohio cuối cùng pass. Không xóa project, không nâng gói, không triển khai 15B/15C/15D.

## Sau Phase 15B — 2026-11-01 23:31:21 +07:00

- Đo trực tiếp trên máy Windows của chủ shop tại Việt Nam; mạng: Wi-Fi; nhà mạng/VPN chưa xác minh (do chủ shop cung cấp). Không mô phỏng tốc độ/CPU. Chưa xác minh nhà mạng hoặc VPN.
- Origin: https://chamstu.netlify.app; commit production: `7da8d0cc05f9570fe3022e7276476cc2033bfbf3`; Chromium 156.0.8078.4, headless, viewport 1280×720.
- Credit Netlify: **Mốc trước 15A còn 221/300; đã deploy 2/4, chưa đọc lại Usage**. Số production deploy đã dùng xem sổ triển khai theo từng mốc bên dưới; không suy đoán số dư từ số lần deploy.
- Mỗi ca: 1 lượt làm ấm bỏ khỏi thống kê → 5 lượt tuần tự, dùng lại browser context/cache. Mỗi lượt đợi heading nội dung, đếm request ứng dụng tới 1 giây sau heading; không tính ảnh/file tĩnh/third-party. Prefetch/RSC và API cùng origin vẫn được tính.
- TTFB điều hướng = responseStart − startTime của Navigation Timing; đăng nhập = TTFB POST Server Action của form login, nội dung = từ bấm Đăng nhập tới heading tổng quan. Back = thời gian từ thao tác Back tới heading danh sách, không ép reload; nếu không có response mạng thì TTFB/header là —. Quote = POST tới khi nhận JSON, không phải heading.
- Trung vị = median; p90 dùng nearest-rank (với 5 lượt là giá trị lớn nhất). Đây là mẫu nhỏ khi đã làm ấm, không phải SLA, Lighthouse hoặc phép đo cold-start.
- Chỉ đọc nghiệp vụ production. Login tạo phiên xác thực; quote vẫn ghi rate_limits theo hành vi hiện tại. Không tạo đơn/sản phẩm/tin nhắn; không xuất cookie, password, tên khách, mã đơn hoặc response body vào báo cáo.

| Ca đo | TTFB median / p90 (ms) | Nội dung median / p90 (ms) | Request median / p90 | Kết quả |
|---|---:|---:|---:|---|
| Cửa hàng — trang chủ | 47 / 50 | 104 / 129 | 2 / 2 | 5/5 lượt |
| Cửa hàng — danh mục | 48 / 51 | 109 / 124 | 2 / 2 | 5/5 lượt |
| Cửa hàng — danh mục có bộ lọc | 46 / 48 | 108 / 128 | 2 / 2 | 5/5 lượt |
| Cửa hàng — tìm kiếm | 47 / 522 | 107 / 581 | 3 / 3 | 5/5 lượt |
| Cửa hàng — giới thiệu | 46 / 53 | 102 / 142 | 10 / 10 | 5/5 lượt |
| Cửa hàng — sản phẩm | — / — | — / — | — / — | Không có sản phẩm public; không tạo dữ liệu giả |
| Cửa hàng — quote giỏ rỗng | 317 / 1036 | 319 / 1036 | 1 / 1 | 5/5 lượt |
| Admin — đăng nhập → tổng quan | 584 / 787 | 1463 / 1634 | 5 / 5 | 5/5 lượt |
| Admin — tổng quan | 381 / 395 | 727 / 774 | 1 / 1 | 5/5 lượt |
| Admin — đơn hàng | 657 / 833 | 718 / 910 | 7 / 7 | 5/5 lượt |
| Admin — sản phẩm | 387 / 1331 | 487 / 1406 | 3 / 3 | 5/5 lượt |
| Admin — chi tiết đơn | — / — | — / — | — / — | Chưa có dữ liệu hiện hữu để đo |
| Admin — form sản phẩm | — / — | — / — | — / — | Chưa có dữ liệu hiện hữu để đo |
| Admin — Back về danh sách đơn | 326 / 751 | 13 / 15 | 1 / 1 | 5/5 lượt |

### Từng lượt đo

| Ca đo | Lượt | HTTP | TTFB (ms) | Nội dung (ms) | Request | Cache-Status | Age |
|---|---:|---:|---:|---:|---:|---|---|
| Cửa hàng — trang chủ | 1 | 200 | 50 | 129 | 2 | "Netlify Edge"; hit; ttl=3518 | 81 |
| Cửa hàng — trang chủ | 2 | 200 | 48 | 105 | 2 | "Netlify Edge"; hit; ttl=3516 | 81 |
| Cửa hàng — trang chủ | 3 | 200 | 45 | 101 | 2 | "Netlify Edge"; hit; ttl=3515 | 81 |
| Cửa hàng — trang chủ | 4 | 200 | 47 | 104 | 2 | "Netlify Edge"; hit; ttl=3514 | 81 |
| Cửa hàng — trang chủ | 5 | 200 | 46 | 104 | 2 | "Netlify Edge"; hit; ttl=3513 | 81 |
| Cửa hàng — danh mục | 1 | 200 | 51 | 124 | 2 | "Netlify Edge"; hit; ttl=86324 | 75 |
| Cửa hàng — danh mục | 2 | 200 | 48 | 105 | 2 | "Netlify Edge"; hit; ttl=86322 | 75 |
| Cửa hàng — danh mục | 3 | 200 | 48 | 119 | 2 | "Netlify Edge"; hit; ttl=86321 | 75 |
| Cửa hàng — danh mục | 4 | 200 | 46 | 106 | 2 | "Netlify Edge"; hit; ttl=86320 | 75 |
| Cửa hàng — danh mục | 5 | 200 | 48 | 109 | 2 | "Netlify Edge"; hit; ttl=86319 | 75 |
| Cửa hàng — danh mục có bộ lọc | 1 | 200 | 48 | 108 | 2 | "Netlify Edge"; hit; ttl=86317 | 82 |
| Cửa hàng — danh mục có bộ lọc | 2 | 200 | 45 | 128 | 2 | "Netlify Edge"; hit; ttl=86316 | 82 |
| Cửa hàng — danh mục có bộ lọc | 3 | 200 | 46 | 106 | 2 | "Netlify Edge"; hit; ttl=86314 | 82 |
| Cửa hàng — danh mục có bộ lọc | 4 | 200 | 47 | 104 | 2 | "Netlify Edge"; hit; ttl=86313 | 82 |
| Cửa hàng — danh mục có bộ lọc | 5 | 200 | 46 | 114 | 2 | "Netlify Edge"; hit; ttl=86312 | 82 |
| Cửa hàng — tìm kiếm | 1 | 200 | 522 | 581 | 3 | "Next.js"; hit "Netlify Durable"; fwd=uri-miss; stored "Netlify Edge"; fwd=stale; fwd-status=200; ttl=-86523; stored | 3 |
| Cửa hàng — tìm kiếm | 2 | 200 | 46 | 121 | 3 | "Netlify Edge"; hit; ttl=86397 | 3 |
| Cửa hàng — tìm kiếm | 3 | 200 | 51 | 107 | 3 | "Netlify Edge"; hit; ttl=86396 | 3 |
| Cửa hàng — tìm kiếm | 4 | 200 | 47 | 107 | 3 | "Netlify Edge"; hit; ttl=86395 | 3 |
| Cửa hàng — tìm kiếm | 5 | 200 | 45 | 103 | 3 | "Netlify Edge"; hit; ttl=86394 | 3 |
| Cửa hàng — giới thiệu | 1 | 200 | 45 | 102 | 10 | "Netlify Edge"; hit; ttl=86305 | 94 |
| Cửa hàng — giới thiệu | 2 | 200 | 47 | 103 | 10 | "Netlify Edge"; hit; ttl=86304 | 94 |
| Cửa hàng — giới thiệu | 3 | 200 | 46 | 100 | 10 | "Netlify Edge"; hit; ttl=86303 | 94 |
| Cửa hàng — giới thiệu | 4 | 200 | 53 | 142 | 10 | "Netlify Edge"; hit; ttl=86302 | 94 |
| Cửa hàng — giới thiệu | 5 | 200 | 46 | 97 | 10 | "Netlify Edge"; hit; ttl=86300 | 94 |
| Cửa hàng — quote giỏ rỗng | 1 | 200 | 315 | 316 | 1 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 0 |
| Cửa hàng — quote giỏ rỗng | 2 | 200 | 306 | 307 | 1 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 2 |
| Cửa hàng — quote giỏ rỗng | 3 | 200 | 319 | 319 | 1 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 0 |
| Cửa hàng — quote giỏ rỗng | 4 | 200 | 317 | 321 | 1 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 0 |
| Cửa hàng — quote giỏ rỗng | 5 | 200 | 1036 | 1036 | 1 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 0 |
| Admin — đăng nhập → tổng quan | 1 | 200 | 584 | 1463 | 5 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 0 |
| Admin — đăng nhập → tổng quan | 2 | 200 | 568 | 1476 | 5 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 0 |
| Admin — đăng nhập → tổng quan | 3 | 200 | 787 | 1634 | 5 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 2 |
| Admin — đăng nhập → tổng quan | 4 | 200 | 601 | 1182 | 5 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 0 |
| Admin — đăng nhập → tổng quan | 5 | 200 | 571 | 1162 | 5 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 0 |
| Admin — tổng quan | 1 | 200 | 395 | 456 | 1 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 0 |
| Admin — tổng quan | 2 | 200 | 381 | 441 | 1 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 0 |
| Admin — tổng quan | 3 | 200 | 390 | 746 | 1 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 1 |
| Admin — tổng quan | 4 | 200 | 360 | 727 | 1 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 2 |
| Admin — tổng quan | 5 | 200 | 371 | 774 | 1 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 0 |
| Admin — đơn hàng | 1 | 200 | 579 | 669 | 7 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 1 |
| Admin — đơn hàng | 2 | 200 | 833 | 910 | 7 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 1 |
| Admin — đơn hàng | 3 | 200 | 711 | 779 | 7 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 2 |
| Admin — đơn hàng | 4 | 200 | 596 | 678 | 7 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 0 |
| Admin — đơn hàng | 5 | 200 | 657 | 718 | 7 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 0 |
| Admin — sản phẩm | 1 | 200 | 1331 | 1406 | 3 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 0 |
| Admin — sản phẩm | 2 | 200 | 402 | 487 | 3 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 0 |
| Admin — sản phẩm | 3 | 200 | 387 | 492 | 3 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 0 |
| Admin — sản phẩm | 4 | 200 | 381 | 450 | 3 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 0 |
| Admin — sản phẩm | 5 | 200 | 378 | 462 | 3 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 0 |
| Admin — Back về danh sách đơn | 1 | 200 | 318 | 13 | 1 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 2 |
| Admin — Back về danh sách đơn | 2 | 200 | 310 | 15 | 1 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 0 |
| Admin — Back về danh sách đơn | 3 | 200 | 743 | 13 | 1 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 0 |
| Admin — Back về danh sách đơn | 4 | 200 | 326 | 14 | 1 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 0 |
| Admin — Back về danh sách đơn | 5 | 200 | 751 | 10 | 1 | "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss; fwd-status=200 | 2 |
