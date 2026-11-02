# Phase 15D — Đo lại và tài liệu vận hành trên Free

Ngày 02/11/2026. Đã đo lại và cập nhật tài liệu sau triển khai 15C, production cuối **`d3ec07b`**, Ready **20:50:36 +07:00**. Chưa đánh dấu mọi tiêu chí hiệu năng đạt. Không nâng gói, mua add-on, tạo/pause Supabase hoặc đổi env Netlify trong 15B/C/D.

## Phương pháp

Giữ số đo gốc, sau Ohio (15A), sau CDN (15B), sau admin (15C) trong [PERFORMANCE-REPORT.md](PERFORMANCE-REPORT.md), gồm từng lượt, median/p90, header cache và số request. Cùng máy Windows/Wi-Fi Việt Nam; chưa biết nhà mạng/VPN. Mỗi ca 1 warm + 5 lượt, không lấy warm làm cold start. Production không có sản phẩm/đơn thật nên sản phẩm, chi tiết đơn và form sản phẩm ghi N/A; không seed dữ liệu giả vào production.

Đo chuyển menu bổ sung tách khỏi reload: document nguồn `/admin/messages` mới mỗi lượt, không cố ý chờ hover, chờ đúng heading trang đích. Bản script đầu chỉ đợi h1 bất kỳ nên thời gian đó không dùng nghiệm thu; log 3 request trùng vẫn là bằng chứng cần sửa. Bản sửa intent 150 ms được E2E xác nhận fast click một RSC; hosting cuối cũng đúng một RSC mỗi lượt.

## Kết quả hosting và kiểm tra

Mốc cuối 20:53 cùng Wi-Fi: public TTFB median **50–52 ms**; admin reload tổng quan/đơn/sản phẩm **568/438/454 ms**, p90 **955/482/513 ms**; Back **14 ms**, p90 16, không request. Login median **1476 ms**, p90 **2838 ms**. Menu riêng median **712/701/408 ms**, p90 **1191/1197/698 ms**; tổng quan/đơn chưa dưới 700 ms. Bảng ba mốc và từng lượt ở báo cáo hiệu năng, không bỏ số đo #3 hoặc lượt chậm.

231 unit/integration (39 file), lint/typecheck/build và 60 E2E liên quan pass; bản sửa intent chạy lại 4 E2E và toàn bộ check bắt buộc. Trên hosting cuối 18 trang public + 9 admin ở 375/768/1280px: 0 tràn ngang/lỗi JS/viewport prefetch; guard/private headers/session API/UUID 404/redirect pass. Workflow warm đúng SHA thành công, 12 warm/0 failed. Quét secret thật trong source/client bundle bằng 0. Các thử nghiệm font không nằm trong bản deploy.

Đã cập nhật ARCHITECTURE, STOREFRONT (15B), ADMIN, README, DEPLOYMENT-FREE và PLAN. Không đổi schema/thư viện hay giảm kiểm tra giá/kho/quyền; không đưa dữ liệu admin vào CDN. Báo cáo 15B/15C ghi cách dùng history thay router.replace ở catalog, AUTO prefetch theo intent 150 ms và lý do không dùng full-prefetch đang treo trong bản Next này.

## Lighthouse mobile

Dùng **Lighthouse 12.8.2, Edge headless, mobile, simulated Slow 4G, CPU 2×**, production local/Supabase dev như bộ hiệu chuẩn Phase 12. Hai URL `/` và `/products/san-pham-mau-01`; mỗi batch cố định 3 lượt mỗi trang trước khi xem điểm, không chạy cùng build/test/perf browser khác. Giữ riêng từng batch và cấu hình, không gộp điểm hoặc bỏ lượt thấp. Phase 12 CPU 4× chưa ổn định vẫn giữ trong báo cáo cũ, không gọi CPU 2× là mặc định 4×.

| Build / cấu hình font | Trang chủ ba điểm P → median P/A/SEO | Sản phẩm ba điểm P → median P/A/SEO |
|---|---|---|
| Phase 12, CPU 2× | 83 / 96 / 97 → **96/100/100** | 95 / 95 / 88 → **95/100/100** |
| 15C + intent fix, font swap ban đầu | 96 / 96 / 96 → **96/100/100** | 95 / 90 / 91 → **91/100/100** |
| Thử font optional — chưa deploy | 96 / 91 / 95 → **95/100/100** | 94 / 95 / 91 → **94/100/100** |
| Thử preload latin-ext, giữ swap — chưa deploy | 91 / 96 / 91 → **91/100/100** | 94 / 94 / 94 → **94/100/100** |

Batch đầu chưa giữ được mốc sản phẩm 95. LCP là tiêu đề, không phải ảnh; có các font `latin-ext` được phát hiện muộn dù preload Latin/Vietnamese. Đây là giả thuyết đã thử, chưa kết luận quan hệ nhân quả chỉ từ vài điểm Lighthouse. Optional và preload latin-ext đều không cải thiện cả hai median nên **bỏ cả hai thử nghiệm, giữ nguyên cấu hình font ban đầu**; không đổi font/weight/glyph hoặc nội dung trang để tăng điểm. Kết quả dùng cho bản cuối vẫn là **96/100/100 trang chủ và 91/100/100 sản phẩm**, nên **chưa đạt tiêu chí giữ mốc sản phẩm 95 của Phase 12**, dù cao hơn ngưỡng 85 trong PLAN chính. Tất cả lượt đã đo có Accessibility/SEO 100, CLS 0 và không có runtime error/warning. CPU benchmark dao động 1189,5–1973; không coi điểm này là cam kết trên mọi máy/mạng hoặc trên ảnh sản phẩm thật.

JSON nằm trong `test-results/phase15d-lighthouse-*.json` (Git bỏ qua). Lỗi helper lúc khởi động dùng nhầm phương thức `Response.ok()` đã sửa trước khi lấy điểm; không liên quan lỗi ứng dụng và không có điểm nào bị loại vì lỗi helper đó.

Batch cấu hình giữ lại: LCP median trang chủ **2,77 s**, sản phẩm **3,52 s** trong mô phỏng Slow 4G/CPU 2×; CLS cả hai 0. Đây là phép đo mobile local với ảnh placeholder dev, khác TTFB ~50 ms của HTML trên hosting; không dùng số này làm tốc độ trang sản phẩm thật chưa tồn tại trong production.

## Credit và các phép đo cần thời gian thực

Mốc chủ shop xác nhận: **221/300 còn lại trước 15A**, **188/300 còn lại trước deploy #3**; chênh lệch quan sát 33 credit gồm hai deploy 30 và usage khác. Chưa có số dư được xác minh sau lượt deploy cuối, không tự trừ thành một số dư “thực tế”. Sổ deploy và ước tính request được cập nhật ở báo cáo hiệu năng/hướng dẫn hosting.

Đã dùng **4/4 production deploy**, riêng deploy là **60 credit**. Với lịch lý thuyết 9.360 probe/30 ngày, request meter khoảng **1,872 credit/tháng**, cộng compute/băng thông và truy cập shop chưa đo; không thể dự báo tổng chính xác trước khi có Usage. API cuối xác nhận `plan_credits=300`, `auto_topup_enabled=false`. Các commit chỉ tài liệu dùng `[skip netlify]`. Không có phí mua gói/domain hoặc dịch vụ mới trong đợt này.

Lịch keep-warm GitHub đang active nhưng các run quan sát có khoảng cách nhiều giờ; không bảo đảm function luôn ấm. Chưa đủ một tuần để đo chi phí giữ ấm riêng; chưa có phép đo cold start kiểm soát sau 30 phút không dùng. Cần theo dõi Usage thực, không suy ra tổng tiền/credit chỉ từ số request probe.

## Chưa nghiệm thu và chủ shop cần cung cấp

- Lighthouse sản phẩm chưa giữ P=95; hai thử nghiệm đã đo không đạt cả hai trang nên hoàn nguyên. Không báo 15D nghiệm thu trọn vẹn chỉ vì đã viết xong tài liệu.
- Menu tổng quan/đơn chưa dưới 700 ms trong mẫu cuối; cold start 30 phút và usage một tuần chưa đủ bằng chứng. Không tự dùng thêm deploy sau giới hạn bốn.
- Khi có sản phẩm/ảnh thật và đơn hiện hữu, chạy lại công cụ chỉ đọc cho ba ca đang N/A. Không cần gửi key/mật khẩu mới hoặc mua domain cho phần tối ưu hiện tại.
- Chủ shop kiểm tra Usage sau một tuần vận hành và sau khi có khách thật. Không tạo lịch nhắc tự động hoặc cron mới khi chưa được yêu cầu.
