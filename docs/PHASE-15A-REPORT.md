# Phase 15A — Đưa database về Ohio

Ngày 01/11/2026. **Đã hoàn tất 15A: Ohio Ready/đạt tiêu chí khi đã làm ấm, Singapore pause, dev Tokyo đã phục hồi và kết nối được.**

## Chuyển hạ tầng đã được duyệt

Chủ shop đã xác nhận toàn bộ phương án: pause dev Tokyo tạm thời, tạo Ohio Free, đổi ba credential Netlify Production và deploy #1, sau kiểm tra mới pause Singapore và resume Tokyo. Không xóa project, không chép dữ liệu kinh doanh.

- Đã kiểm kê lại Singapore ngay trước chuyển: vẫn 0 sản phẩm/đơn/tin nhắn/ảnh/tài khoản ngoài admin, settings đều mặc định.
- Đã pause dev Tokyo để nhường suất và tạo **`cham-stu-prod-us`**, ref `uywuukctknnipapeifqv`, region **`us-east-2`**, organization vẫn Free. Sau khi Ohio đạt kiểm tra, Singapore đã `INACTIVE`; dev Tokyo đã resume thành `ACTIVE_HEALTHY`, giữ ref/region Tokyo. Kết nối bằng URL và mật khẩu dev cũ `SELECT 1` thành công, đủ 20 bảng public; không sửa `.env` dev hoặc dữ liệu/config dev. Hiện có đúng hai project active là Ohio và Tokyo, không xóa project nào.
- Đã cập nhật `.env.deploy.local`, giữ cấu hình cũ trong file rollback `.env.deploy.before-phase15a.local` được Git ignore. Admin Ohio có mật khẩu mới trong `ADMIN_SEED_PASSWORD`, chỉ lưu local; không chép auth/session cũ hoặc đưa mật khẩu lên Netlify/Git.
- Đã tạo bucket media public, 2 MB, WebP/JPEG/PNG; chạy `production:migrate`, `production:seed` không sample và `production:check` pass: 20 bảng RLS, 0 public policy, 1 admin, 0 sample. Cả transaction 6543 và session 5432 pooler Ohio `SELECT 1` qua TLS thành công.
- Đã thay/xác minh đúng ba biến Netlify `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, giữ All scopes và chỉ Production như được duyệt. Không có biến khác chứa ref Singapore ngoài hai URL này; key cũ được thay cùng nhóm. Netlify vẫn credit-free, auto top-up tắt, email disabled.
- Bản code health đã pass lint/typecheck/build và 210 test trước khi dev pause; **deploy #1/4** commit `251cdbd`, deployment `6ae7562256127a90fa565c62` Ready lúc 22:10:20 +07:00. Sau bộ đo đầy đủ, 5 health probe có median **2,43 ms**; đợt đầu ngay sau deploy median **12,73 ms** chưa đạt được giữ trong báo cáo. Ba trang admin median **736/742/471 ms** đều <1 s. Đăng nhập → tổng quan median 1212 ms. [Bảng từng lượt, p90 và giới hạn](PERFORMANCE-REPORT.md#nghiệm-thu-hiệu-năng-15a-trên-ohio).
- Pass 30 lượt trang hosting ở 375/768/1280px, không tràn ngang/lỗi trình duyệt; guard anonymous, private headers, export 401, sitemap, login admin và banner email disabled đều đúng. Không tạo đơn/sản phẩm/tin nhắn/email; chưa có ảnh thật để nghiệm thu upload/ảnh thực tế. p90 admin sản phẩm 1870 ms, trang chủ có lượt 3342 ms; không coi mọi request nhanh hoặc đã đạt 15B/15C.

## Kiểm kê trước chuyển — 21:58 +07:00

- Phase 15.0: commit `724c44a`, công cụ đo và Baseline tại [PERFORMANCE-REPORT.md](PERFORMANCE-REPORT.md). Mốc ngân sách chủ shop xác nhận: còn **221/300 credit**; ở thời điểm baseline đã dùng **0/4 lượt**. Hiện đã dùng 1/4; chưa đọc lại số Usage cuối, không suy đoán số dư. Netlify vẫn Free, auto top-up tắt.
- Netlify API xác minh Functions `us-east-2` (Ohio), gói Free. Supabase Management API đã liệt kê `East US (Ohio)` / `us-east-2` khả dụng trước khi tạo project cùng region server.
- Trước chuyển, cả dev Tokyo và production Singapore đều `ACTIVE_HEALTHY`, đã dùng đủ 2 project Free. [Giới hạn Free](https://supabase.com/docs/guides/platform/billing-faq): paused project không tính vào hai suất active.
- Inventory đọc lại lúc 21:58 +07:00 bằng transaction READ ONLY:

| Mục | Số lượng |
|---|---:|
| products | 0 |
| orders | 0 |
| contact_messages | 0 |
| user ngoài admin | 0 |
| admin | 1 |
| object bucket media | 0 |
| nhóm settings khác mặc định | 0/10 |

Không in giá trị settings, mật khẩu, token, tên khách, mã đơn hoặc đường dẫn ảnh. Có phiên auth/rate-limit vận hành; không phải sản phẩm/đơn thật cần chép. Theo nhánh production rỗng của kế hoạch, dự kiến migrate + seed không sample, tạo mật khẩu admin mới lưu riêng local; không chép bảng auth hoặc dữ liệu kinh doanh. Trước khi thực hiện phải kiểm kê lại; nếu phát sinh dữ liệu mới thì dừng để xin duyệt sao chép.

Chạy lại inventory: `node --conditions=react-server --import=tsx scripts/inspect-production.ts`. Script chỉ đọc `.env.deploy.local`, kiểm tra tách dev/prod và bật transaction READ ONLY; đầu ra chỉ có số đếm và tên nhóm settings.

## Phần code chuẩn bị

- `GET /api/health` public, `Cache-Control: no-store`, Node runtime. Query hợp lệ duy nhất là `?db=1`; không query DB khi không có cờ đó. Khi có cờ, service chỉ chạy `select 1`, trả thời gian thực thi/pooler đi-về `dbMs`; lần đầu có thể gồm mở kết nối. Không ghi rate limit.
- `commit` lấy SHA công khai `COMMIT_REF` lúc build qua `next.config.ts` và nhúng thành `APP_COMMIT_REF`, không cần thêm biến Netlify. Build local thiếu SHA hợp lệ trả `unknown`. Không nhúng biến môi trường khác.
- Lỗi DB trả HTTP 503, `ok:false`, `dbMs:null`; query không hợp lệ trả 400, không trả exception hoặc thông tin kết nối. Có test cho nhánh không DB, một query DB, validate query và không lộ lỗi DB.
- Chưa thêm `copy-production.ts`: inventory hiện rỗng; nhánh sao chép chỉ cần khi có dữ liệu thật và chủ shop duyệt. Không có project ref cũ bị ghim trong `scripts/production.ts`; guard suy ra ref từ các URL và kiểm tra cùng project/TLS.

**Kiểm tra phần chuẩn bị:** lint/typecheck/build pass, **210/210 unit/integration pass (36 file)**. Đã chạy build production trên localhost để kiểm tra health: `/api/health` HTTP 200, `dbMs:null`; `?db=1` HTTP 200, số đo DB hữu hạn; `?db=0` HTTP 400. Cả ba giữ no-store/noindex và chỉ có `ok`, `commit`, `dbMs`. Build dùng một SHA giả lập riêng cho kiểm thử, sau đó khởi động với SHA runtime khác; health vẫn trả SHA lúc build, xác minh đã nhúng đúng. Probe local dùng dev Tokyo, không dùng số đó để nghiệm thu Ohio. `production:check` hiện tại trên Singapore pass: 20 bảng RLS, 0 public policy, 1 admin hoạt động, 0 sample và media public; email vẫn tắt. Không đổi UI/schema; không cần đo lại ba độ rộng cho endpoint vận hành.

## Điểm khác và phương án được chủ shop duyệt

1. Kế hoạch yêu cầu tạo project Ohio trước rồi mới pause Singapore và giữ dev Tokyo. Với hai project active đã đầy, không thể làm đúng thứ tự đó ở Free. Đề xuất **tạm pause dev Tokyo trước**, tạo/migrate/seed Ohio trong khi Singapore vẫn phục vụ web; sau chuyển và kiểm tra thành công mới pause Singapore, rồi resume Tokyo. Không xóa project, không đổi dữ liệu/config dev. Local dựa Supabase dev sẽ tạm không dùng được trong thời gian pause.
2. Đổi ba credential runtime Netlify chỉ context **Production**: `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`; cập nhật thêm biến có ref cũ nếu kiểm kê env phát hiện. Giữ kiểu lưu All scopes hiện có trên Free theo xác nhận trước của chủ shop, không mở cho Preview. `.env.deploy.local` đổi cả `DIRECT_URL`; mật khẩu admin mới chỉ lưu local, không đưa lên Netlify/Git.
3. Chỉ push/deploy application một lần (#1) sau khi database mới và `production:check` sẵn sàng. Chỉ pause Singapore sau khi route health/login/admin và kiểm tra production đạt; bucket đã xác minh, ảnh thật chưa có để thử. Sau khi Singapore pause, nếu cần rollback phải có suất Free và resume/xác minh Singapore trước; mọi biến DB/Storage phải trở lại cùng project, không trỏ vào project đang pause hoặc trộn hai ref. Xin duyệt riêng thứ tự pause/resume/deploy phục hồi khi cần, không tự xóa project. Cấu hình rollback local không thay cho bản sao lưu dữ liệu dài hạn.
4. Hợp đồng health `{ ok, commit, dbMs }` là ngoại lệ vận hành được PERFORMANCE-PLAN.md quy định cụ thể, khác ActionResult `{ok,data}` chung của ARCHITECTURE.md. Các endpoint nghiệp vụ không đổi format.
5. Chính sách bảo mật hiện chỉ nói Supabase và xử lý ngoài Việt Nam, không ghim Singapore; chưa cần đổi nội dung khi chuẩn bị region.

## Chưa làm / cần chủ shop

- Đã có xác nhận riêng và thực hiện đúng chu kỳ pause/resume; Supabase connector xác minh Ohio/Tokyo `ACTIVE_HEALTHY`, Singapore `INACTIVE`, kết nối dev cũ và `production:check` Ohio cuối cùng đều pass. Health Ohio sau Singapore pause vẫn HTTP 200/đúng commit; thời gian một probe riêng sau khoảng nghỉ là 44,4 ms, giữ trong báo cáo để thấy dao động ngoài batch đã làm ấm.
- Đã có health và mốc sau 15A trên cùng Wi-Fi. Không có số đo sản phẩm public/chi tiết đơn/form sản phẩm vì production rỗng, chưa đánh giá catalog lớn hoặc cold-start có kiểm soát; cần đo bổ sung khi có dữ liệu thật. Phase 13 vẫn chờ nghiệm thu đơn thật/email như trước.
- Không làm Phase 15B/15C/15D, không nâng gói hoặc mua add-on, không thay cookie cache/guard admin.
