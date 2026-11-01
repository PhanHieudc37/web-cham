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
| — | 15.0 | Commit dùng `[skip netlify]` | Không deploy, đã dùng 0/4 |

Giới hạn cả Phase 15 là 4 deploy production. Commit chỉ sửa tài liệu và công cụ đo dùng `[skip netlify]` để giữ lượt cho 15A/15B/15C.
