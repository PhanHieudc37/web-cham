# Phase 13 — Chuẩn bị triển khai và tài liệu vận hành

Ngày: 30/10/2026. **Trạng thái: đã chuẩn bị mã nguồn/tài liệu; chưa nghiệm thu production.**

## Chế độ miễn phí không email được duyệt ngày 31/10/2026

Chủ shop đã đồng ý triển khai Netlify với `EMAIL_DELIVERY=disabled` khi chưa có domain. Thêm lựa chọn rõ ràng vào validation production, bỏ qua gửi email khi tắt, hiển thị thông báo ở checkout/trang thành công/admin; mặc định vẫn là `resend` và yêu cầu đầy đủ cấu hình thật. Không thay database/schema, không dùng sender/key giả. Việc này thay thế điều kiện phải chờ email trước migrate/deploy trong báo cáo cũ bên dưới; nghiệm thu mail và đơn thật vẫn chưa hoàn tất.

## Cập nhật thực tế ngày 31/10/2026

- Đã xác minh token Netlify và Supabase trong các file local được Git ignore. Netlify đã có project `astonishing-fox-bde038`, liên kết đúng repository `PhanHieudc37/web-cham`; chưa có deployment thành công được xác minh.
- Đã xác minh organization Supabase `cham.stu` đang ở gói Free và tạo project riêng `cham-stu-prod` tại Singapore. Giữ nguyên project dev Tokyo.
- Đã điền kết nối production thật vào `.env.deploy.local`; `SELECT 1` thành công qua transaction pooler 6543 và session pooler 5432. Đã migrate và seed không sample thành công; `production:check` pass với 20 bảng RLS, 0 policy public, 1 admin hoạt động, 0 sản phẩm mẫu và bucket public.
- Đã tạo và xác minh bucket `media` public, giới hạn 2 MB, cho phép WebP/JPEG/PNG. Server key đã được lấy đầy đủ bằng Management API và kiểm tra qua Storage.
- Đã sinh mật khẩu admin production riêng và lưu local; tài khoản đã được seed. Không đưa mật khẩu hoặc token quản lý lên hosting/Git.
- Netlify đã xác minh hai URL, bucket, auth secret Production và email nhận thông báo shop. Sau khi chủ shop xác nhận riêng cách lưu `DATABASE_URL` và `SUPABASE_SERVICE_ROLE_KEY` dạng biến thường All scopes, đã tải ba biến Supabase lên đúng project Netlify và xác minh giá trị khớp file local, chỉ context Production. Đã bổ sung `EMAIL_DELIVERY=disabled`, xác minh trên Netlify và local; hai biến Resend có thể trống trong chế độ này.
- Trước khi chủ shop duyệt chế độ tắt email, `production:check` đã dừng ở validation do thiếu cấu hình Resend; sau thay đổi được duyệt, kiểm tra production đã pass. Key Resend hiện có trong cấu hình dev trả HTTP 401 khi đọc danh sách domain. Chủ shop xác nhận chưa có domain riêng, nên email khách production chưa sẵn sàng.
- Chưa kích hoạt deploy, chưa gửi email, chưa tạo đơn production. Đã thay mã ứng dụng trong phạm vi chế độ tắt email được duyệt. Lint/typecheck/build pass; 198/198 unit/integration pass, 3/3 E2E email-disabled pass ở 375/768/1280px và đã xem ảnh chụp; bộ E2E production mặc định 9/9 pass. Quét 439 file được theo dõi và 62 file client với 19 giá trị riêng tư: 0 match. Các ghi chú “chưa có project/quyền truy cập” trong phần báo cáo ban đầu bên dưới phản ánh thời điểm 30/10 và được thay thế bởi cập nhật này.

## Cập nhật ngân sách — chỉ dùng miễn phí

Theo yêu cầu tiếp theo của chủ shop ngày 30/10/2026, hosting mặc định chuyển sang **Netlify Free + Supabase Free**, URL web `netlify.app`, chưa mua domain. Thêm `netlify.toml` (build Next.js, publish `.next`, Node 22, cài cả devDependencies lúc build), ignore `.netlify/` và [hướng dẫn miễn phí](DEPLOYMENT-FREE.md). Không thêm package hoặc đổi Next.js/auth/DB.

Netlify tự quản lý adapter Next.js; tài liệu nền tảng có hỗ trợ App Router/SSR/Server Actions/ISR/after, nhưng chưa có deployment để xác nhận ứng dụng này chạy thực tế trên adapter. Gói Free có quota và có thể pause; không bảo đảm uptime/không giới hạn. Email khách vẫn cần domain sở hữu Verified, nên ràng buộc hoàn toàn miễn phí khi chưa sở hữu domain chưa đáp ứng đầy đủ phần mail production. Không bỏ guard hoặc đăng ký/mua dịch vụ để vượt qua điều kiện còn thiếu.

Hướng dẫn Vercel bên dưới là phần chuẩn bị trước yêu cầu ngân sách mới; không còn là đường triển khai mặc định. Các kết quả 194 test/lint/typecheck/build đã có vẫn áp dụng cho mã ứng dụng không thay đổi; thay đổi tiếp theo chỉ là tài liệu và cấu hình nền tảng, chưa chứng minh deploy Netlify thành công.

## Đã làm

- Viết [DEPLOYMENT.md](DEPLOYMENT.md): Supabase prod Singapore tách dev, bucket public media, hai pooler và TLS, migrate/seed không sample, Vercel từ GitHub với Node 22.x, env Production, domain/DNS, Resend Verified, kiểm tra và xử lý một đơn thật, backup và khôi phục deployment.
- Bổ sung README cho chủ shop: đăng nhập, thêm sản phẩm, sửa banner/cài đặt, quy trình xử lý đơn hằng ngày, đối chiếu tiền/kho, quên mật khẩu và checklist trước mở bán.
- Thêm `production:migrate`, `production:seed`, `production:check`. Các lệnh chỉ đọc `.env.deploy.local`, không dùng `.env` dev làm fallback; từ chối URL local, test DB, project dev, project Storage/pooler không khớp, sai cổng, thiếu TLS hoặc sender Resend thử nghiệm. Không nhận `--sample` và không tự chạy migrate trong build Vercel.
- `production:check` kiểm tra bảng/schema public, RLS, không có policy Data API, admin hoạt động, mã sản phẩm mẫu và bucket media. Đây là kiểm tra chuẩn bị, không phải bằng chứng email đã giao hoặc website đã deploy.
- Thêm `admin:recover` offline: dùng hash của Better Auth 1.7.14, chỉ đổi mật khẩu admin đang hoạt động đã tồn tại, thu hồi session trong transaction. Không thêm endpoint quên mật khẩu công khai, không tạo/nâng quyền/mở khóa tài khoản. Biến khôi phục chỉ dành cho máy chủ shop, không đưa lên Vercel.
- Ghim Node `22.x` và đồng bộ lockfile; không thêm thư viện, không đổi schema/migration hoặc cấu hình UI hiện tại.

## Kiểm tra

| Kiểm tra | Kết quả |
|---|---|
| Unit/integration | 194/194 pass, 33 file, PostgreSQL `_test` riêng |
| Ca mới | 5 test chặn cấu hình prod nhầm dev/test/origin/pooler/TLS/sender; 2 integration test khôi phục hash/session, từ chối staff/admin bị khóa/tài khoản thiếu |
| Lint / TypeScript | Pass |
| Build local dùng Supabase dev | Pass; giữ nguyên 20 bảng và schema, không deploy hosting |
| `production:check` khi chưa có file prod | Exit 1 đúng thiết kế, không kết nối/mutate dev thay thế |
| Kiểm tra tài khoản/bucket hiện tại | Dev media truy cập được, public; chưa có `.vercel/project.json`, file đăng nhập CLI Vercel/Supabase tại các vị trí kiểm tra hoặc token quản lý trong env |

Các integration test chỉ chạy trên PostgreSQL `_test`; không khôi phục tài khoản admin thật, không chạy migration/seed production, không tạo đơn/tin nhắn/gửi email thật. Không thay `.env` dev; chưa tạo file chứa kết nối prod giả. Không có giao diện mới nên không cần một bộ responsive mới cho riêng phase tài liệu/CLI này.

## Chưa làm và lý do

- Chưa tạo/xác nhận Supabase prod hoặc project Vercel: công cụ tích hợp chưa kết nối và máy chưa có quyền quản lý các tài khoản đó. Project Supabase dev và Secret key Storage hiện có không cấp quyền tạo project quản lý mới.
- Chưa cấu hình env hosting, domain web, DNS Resend hoặc xác nhận mail thật: chủ shop chưa cung cấp domain và chưa kết nối tài khoản để thực hiện các bước này.
- Chưa chạy các lệnh production lên tài nguyên thật hoặc đặt đơn production tới Hoàn thành. Đây là tiêu chí bắt buộc trong PLAN, nên **Phase 13 vẫn chưa được đánh dấu hoàn tất**.
- Chưa phát sinh đăng ký gói trả phí hoặc mua domain. [Vercel Hobby giới hạn mục đích phi thương mại](https://vercel.com/docs/plans/hobby); sau yêu cầu ngân sách mới, đã đổi phương án sang Netlify Free có hỗ trợ dự án thương mại, không dùng Vercel làm mặc định nữa.
- Hạn chế Lighthouse 4× của Phase 12 vẫn được giữ nguyên trong báo cáo trước, không ghi nhận như đã sửa trong phase tài liệu này. Cần đo lại URL hosting thật khi có.

## Chủ shop cần thực hiện / cung cấp

1. Đăng nhập Netlify bằng GitHub, chọn Free và import repo theo [DEPLOYMENT-FREE.md](DEPLOYMENT-FREE.md). Chưa có tích hợp Netlify trong công cụ hiện tại; cần thao tác tài khoản từ dashboard. Điền secret vào file riêng/dashboard, không gửi qua chat.
2. Dùng URL web miễn phí do Netlify cấp; email khách vẫn chờ domain sở hữu Verified. Không yêu cầu chủ shop mua domain hoặc nâng gói trong phương án hiện tại.
3. Hoàn thiện dữ liệu sản phẩm/ảnh/tồn kho/liên hệ/ngân hàng và chỉ định đơn giao dịch thật cùng người nhận để nghiệm thu khi website đã sẵn sàng. Chỉ chuyển Hoàn thành khi giao dịch thực tế đã hoàn tất; không bịa thông tin khách hoặc mã vận đơn.
