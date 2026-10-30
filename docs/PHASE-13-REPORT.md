# Phase 13 — Chuẩn bị triển khai và tài liệu vận hành

Ngày: 30/10/2026. **Trạng thái: đã chuẩn bị mã nguồn/tài liệu; chưa nghiệm thu production.**

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
- Chưa phát sinh đăng ký gói trả phí hoặc mua domain. [Vercel Hobby giới hạn mục đích phi thương mại](https://vercel.com/docs/plans/hobby); chủ shop cần chọn gói phù hợp cho website bán hàng. Không tự thay hosting hoặc kiến trúc để tránh quyết định này.
- Hạn chế Lighthouse 4× của Phase 12 vẫn được giữ nguyên trong báo cáo trước, không ghi nhận như đã sửa trong phase tài liệu này. Cần đo lại URL hosting thật khi có.

## Chủ shop cần thực hiện / cung cấp

1. Kết nối Vercel và Supabase để tạo/kiểm tra tài nguyên trong đúng tài khoản. Nếu tự thao tác dashboard, làm theo [DEPLOYMENT.md](DEPLOYMENT.md); điền secret vào file riêng/dashboard, không gửi qua chat.
2. Chọn gói hosting phù hợp và cung cấp domain sở hữu (hoặc dùng URL web tạm do Vercel cấp; gửi email vẫn cần domain Verified).
3. Hoàn thiện dữ liệu sản phẩm/ảnh/tồn kho/liên hệ/ngân hàng và chỉ định đơn giao dịch thật cùng người nhận để nghiệm thu khi website đã sẵn sàng. Chỉ chuyển Hoàn thành khi giao dịch thực tế đã hoàn tất; không bịa thông tin khách hoặc mã vận đơn.
