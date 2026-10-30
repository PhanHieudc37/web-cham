# Triển khai production — Cham.stu

**Cập nhật 30/10/2026:** chủ shop yêu cầu chỉ dùng miễn phí. Làm theo [Netlify Free + Supabase Free](DEPLOYMENT-FREE.md) làm phương án mặc định. Các bước Vercel bên dưới được giữ để tham khảo, không phải yêu cầu đăng ký gói trả phí. Phần database, env, khôi phục admin và nghiệm thu đơn thật vẫn áp dụng.

Hướng dẫn Phase 13, kiểm tra tài liệu nhà cung cấp ngày 30/10/2026. Hiện repo đã có mã nguồn; **chưa có bằng chứng đã tạo Supabase prod, deploy Vercel hoặc nghiệm thu đơn production**. Bản GitHub Pages chỉ là bản duyệt thiết kế, không nhận đơn.

## 1. Chuẩn bị tài khoản và tên miền

- Đăng nhập Supabase, Vercel và Resend bằng tài khoản của chủ shop; kết nối GitHub `PhanHieudc37/web-cham`.
- Chọn tên miền chủ shop sở hữu. Chưa có tên miền web có thể dùng URL `vercel.app` mà Vercel thực sự cấp; domain gửi email vẫn cần domain sở hữu và đã xác minh.
- Kiểm tra gói/quota trước khi tạo tài nguyên. Website bán hàng có mục đích thương mại; [Vercel Hobby chỉ dành cho cá nhân, phi thương mại](https://vercel.com/docs/plans/hobby). Chủ shop chọn gói phù hợp trong tài khoản; không tự đăng ký gói trả phí hoặc nhập thẻ thay chủ shop.
- Chuẩn bị ảnh, sản phẩm/tồn kho thật, liên hệ, ngân hàng, phí ship và nội dung chính sách. Không dùng sản phẩm `SAMPLE` để mở bán.

## 2. Tạo Supabase production riêng

1. Dashboard Supabase → New project; đặt tên phân biệt, ví dụ `cham-stu-prod`. Đây là tên đề xuất, không phải project đã được tạo.
2. Chọn **Singapore** theo kiến trúc, phù hợp Vercel `sin1`. Project dev đang ở Tokyo; giữ nguyên dev, không đổi hoặc xóa project đó.
3. Sinh mật khẩu database mạnh, lưu trong trình quản lý mật khẩu. Đợi project sẵn sàng.
4. Connect → lấy **Transaction pooler, cổng 6543** cho `DATABASE_URL`, **Session pooler, cổng 5432** cho `DIRECT_URL`. Cả hai phải thuộc project prod. Thay chỗ mật khẩu bằng mật khẩu thật, percent-encode ký tự đặc biệt; thêm `?sslmode=require` nếu URI chưa có query. Không sao chép URI chỉ còn `[YOUR-PASSWORD]`.
5. Settings/API Keys → lấy Secret key server (`sb_secret_...` hoặc legacy service_role), URL project. Không dùng anon/publishable key cho app này.
6. Storage → New bucket → tên chính xác **media**, bật **Public**. Giới hạn file 2 MB, MIME `image/webp`, `image/jpeg`, `image/png` nếu dashboard hỗ trợ cấu hình. Ứng dụng vẫn kiểm tra quyền staff, MIME và dung lượng ở server.
7. Không tạo policy public đọc/ghi cho bảng ứng dụng. Migration của repo bật RLS mọi bảng, app truy cập bằng kết nối server. Không mở upload ẩn danh cho Storage. Bucket public dành cho ảnh sản phẩm/banner; không đưa hóa đơn chứa dữ liệu khách hoặc bản sao lưu vào đó.

Nguồn: [kết nối PostgreSQL/pooler](https://supabase.com/docs/guides/database/connecting-to-postgres), [tạo bucket](https://supabase.com/docs/guides/storage/quickstart), [mô hình public/private](https://supabase.com/docs/guides/storage/buckets/fundamentals).

## 3. Tạo project Vercel và xác định URL

1. Vercel → Add New → Project → import repository **PhanHieudc37/web-cham**.
2. Framework **Next.js**, Root Directory **gốc repo**, Production Branch **main**; không chọn `preview/` hoặc `.preview-dist`.
3. Install Command `npm ci`, Build Command `npm run build`, Output Directory để mặc định của Next.js. Không dùng static export. Region trong `vercel.json` là `sin1`.
4. Node.js **22.x**, đã ghim trong `package.json`. [Vercel hỗ trợ chọn major Node trong engines](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).
5. Lấy URL production thực tế trong Settings → Domains. Nếu lần import đầu build chạy khi chưa có env/database, chưa thể coi deploy thành công; hoàn tất các bước dưới rồi Redeploy.
6. Nếu dùng domain riêng, thêm domain ở Settings → Domains; chọn một hostname chính và redirect hostname còn lại nếu có.

Tham khảo [môi trường triển khai Vercel](https://vercel.com/docs/deployments/environments). Đừng trỏ Production vào Supabase dev để làm xanh build.

## 4. Xác minh domain email Resend

1. Resend → Domains → Add Domain, nhập domain/subdomain do chủ shop quản lý.
2. Vào nơi quản lý DNS, thêm **đúng** các bản ghi Resend trả về. Không tự đoán DKIM/SPF hoặc thay bản ghi mail đang có.
3. Bấm Verify, đợi trạng thái Verified; có thể dùng subdomain riêng cho thư giao dịch.
4. Tạo API key có quyền gửi thư phù hợp; `EMAIL_FROM` là địa chỉ tại domain Verified, dạng `Cham.stu <địa-chỉ-gửi-thật>`; `SHOP_NOTIFY_EMAIL` là hộp thư thật của shop.
5. Sender `onboarding@resend.dev` chỉ để thử nghiệm, không dùng để nghiệm thu gửi tới khách bất kỳ. [Resend yêu cầu xác minh domain sở hữu để gửi thư](https://resend.com/docs/dashboard/domains/introduction).

## 5. File riêng cho migrate/seed/check

Trong `C:\web_su`, sao chép `.env.example` thành **`.env.deploy.local`** rồi điền **kết nối prod**, không sao chép các giá trị từ `.env` dev. Không tạo `.env.production.local` chứa giá trị trống trong checkout dev: Next có thể tự nạp file đó và làm hỏng build local.

| Biến | Giá trị / nơi sử dụng |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | URL HTTPS production chính xác, không có path/query |
| `BETTER_AUTH_URL` | Giống hệt `NEXT_PUBLIC_SITE_URL` |
| `BETTER_AUTH_SECRET` | Secret riêng cho production, ngẫu nhiên ít nhất 32 ký tự |
| `DATABASE_URL` | Transaction pooler prod, 6543, TLS |
| `DIRECT_URL` | Session pooler prod, 5432, TLS; chỉ máy quản trị dùng migrate |
| `SUPABASE_URL` | URL project prod, cùng project với hai pooler |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret key prod, chỉ server |
| `SUPABASE_STORAGE_BUCKET` | `media` |
| `RESEND_API_KEY` | Key gửi thư thật |
| `EMAIL_FROM` | Địa chỉ tại domain đã Verified |
| `SHOP_NOTIFY_EMAIL` | Email nhận thông báo đơn/tin nhắn của shop |
| `ADMIN_SEED_EMAIL` | Email admin đầu tiên do chủ shop chọn |
| `ADMIN_SEED_PASSWORD` | Mật khẩu riêng mạnh, khuyến nghị ít nhất 16 ký tự |
| `TEST_DATABASE_URL` | Để trống, không dùng test DB ở production |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | Chỉ điền nếu thực sự bật Telegram |

Không đưa file này lên Git, không gửi qua chat. Các lệnh production mới chỉ đọc file này, ép `NODE_ENV=production`, từ chối project dev, pooler sai project/cổng, URL local, thiếu TLS và sender thử nghiệm. Chúng không lấy biến còn thiếu từ `.env` dev. Đừng sửa tay username/host cho vừa qua kiểm tra; lấy lại đúng URI từ Connect.

Chạy **lần lượt**, sau khi xác nhận đây là database production mới:

```powershell
npm run production:migrate
npm run production:seed
npm run production:check
```

- `production:migrate` áp dụng migration đã commit, không sinh hoặc sửa migration cũ. Không chạy `db:generate` để “sửa” schema production tại chỗ.
- `production:seed` chỉ tạo settings/admin còn thiếu; giữ nguyên settings/password đã có, **không có `--sample`**. Đổi `ADMIN_SEED_PASSWORD` rồi chạy seed không đổi mật khẩu tài khoản đã tồn tại.
- `production:check` chỉ đọc: đối chiếu bảng/RLS/policy, có admin hoạt động, không có mã sản phẩm mẫu, bucket media public. Không chứng minh domain email đã Verified, không gửi email hoặc tạo đơn; các mục đó nghiệm thu bên dưới.
- Khi lỗi: dừng ở bước đó, kiểm tra tên biến/project; không in/chia sẻ chuỗi kết nối hoặc toàn bộ provider error có thể chứa dữ liệu nhạy cảm.

## 6. Env trên Vercel và deploy

Project → Settings → Environment Variables → chọn **Production**, thêm 10 biến runtime: `NEXT_PUBLIC_SITE_URL`, `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`, `RESEND_API_KEY`, `EMAIL_FROM`, `SHOP_NOTIFY_EMAIL`; thêm hai biến Telegram khi dùng.

Không đưa `DIRECT_URL`, tài khoản/mật khẩu seed, `ADMIN_RECOVERY_*` hoặc `TEST_DATABASE_URL` lên Vercel. Đánh dấu giá trị nhạy cảm là Secret/Sensitive khi dashboard cho phép. Không chia sẻ biến Production sang Preview; nếu cần Next.js preview, dùng project database dev và URL/auth origin phù hợp riêng. GitHub Pages hiện có vẫn chạy độc lập.

Sau khi migrate/seed/check pass, Redeploy bản `main` mới nhất. Đợi trạng thái Ready; kiểm tra URL trỏ đúng deployment, không chỉ dựa vào một build local. Thay đổi env cần deployment mới; `NEXT_PUBLIC_SITE_URL` được gắn vào bundle lúc build. [Cấu hình env Vercel](https://vercel.com/docs/environment-variables).

## 7. Gắn domain web

Settings → Domains: dùng **đúng A/CNAME/TXT do project hiện tại trả về**, thêm tại nơi quản lý DNS; đợi cấu hình hợp lệ và HTTPS hoạt động. Không chép IP/CNAME của ví dụ hoặc project khác. Giữ nguyên các bản ghi mail; thường không cần đổi nameserver chỉ để trỏ web. [Hướng dẫn domain Vercel](https://vercel.com/docs/domains/working-with-domains/add-a-domain).

Đổi `NEXT_PUBLIC_SITE_URL` và `BETTER_AUTH_URL` sang cùng hostname chính trong `.env.deploy.local` và Vercel Production, Redeploy rồi đăng nhập lại admin. Kiểm tra canonical/sitemap/ảnh chia sẻ cùng domain, không còn `localhost` hoặc URL preview. Supabase Auth Site URL không điều khiển đăng nhập admin ứng dụng này: hệ thống dùng Better Auth trên Next.js.

## 8. Nghiệm thu đơn thật — bắt buộc trước khi đánh dấu Phase 13 xong

1. Chủ shop tạo sản phẩm/biến thể thật trong admin production; nhập đúng tồn kho, ảnh, giá, phí ship và thông tin liên hệ/ngân hàng. Đăng nhập bằng tài khoản production; không dùng tài khoản test.
2. Người nhận cung cấp thông tin giao hàng thật và chọn sản phẩm/số lượng thật. Không dùng tên/địa chỉ/số điện thoại bịa cho nghiệm thu. Không công khai link thành công chứa token.
3. Trên URL production chính thức: trang chủ → danh mục → sản phẩm → màu/size → giỏ → checkout COD (hoặc chuyển khoản khi thực sự thanh toán). Xác nhận tổng từ server, mã đơn, email khách/shop và tồn kho giảm đúng một lần.
4. Admin mở đơn → Xác nhận → Đang giao. Nhập hãng/mã vận đơn thật nếu có; xác minh email vận chuyển đến hộp thư. Không nhập mã vận đơn giả để thử.
5. Chỉ bấm **Hoàn thành** khi quy trình thực tế đã hoàn tất; COD sẽ tự ghi nhận tiền. Đây là dữ liệu doanh thu/tồn kho thật, không bấm hoàn thành một giao dịch chưa thực hiện chỉ để làm xanh checklist.
6. Tra cứu mã đơn + SĐT trên production; xác nhận trạng thái, dữ liệu che và khả năng dùng ở 375/768/1280px. Kiểm tra noindex khu vực riêng tư, sitemap/robots/HTTPS và ảnh upload.
7. Ghi URL chính thức, commit, ngày nghiệm thu, mã đơn và kết quả kho/mail trong ghi chú vận hành **riêng tư**. Báo cáo Git chỉ ghi kết quả tổng hợp, không có tên/SĐT/địa chỉ/token hoặc chứng từ cá nhân.

Không chạy Vitest/Playwright hoặc các script `e2e/` trên database production. Tiêu chí chưa xong nếu mới có URL Ready nhưng chưa xử lý đơn thật tới Hoàn thành.

## 9. Vận hành, cập nhật và khôi phục

- Thực hiện hằng ngày theo [README](../README.md#quy-trình-vận-hành-hằng-ngày). Theo dõi mail lỗi, đơn mới, tồn kho thấp và tin nhắn; dữ liệu khách chỉ dùng để xử lý đơn.
- Trước thay đổi schema/cập nhật quan trọng, tạo bản sao lưu production phù hợp gói Supabase và kiểm tra khả năng khôi phục. Backup database **không thay thế backup ảnh Storage**; giữ ảnh gốc riêng. [Phạm vi backup Supabase](https://supabase.com/docs/guides/platform/backups).
- Cập nhật mã: chạy lint/typecheck/test/build trên dev/test; review migration, backup, chạy `production:migrate` khi có migration mới, rồi đưa commit đã kiểm tra lên `main`. Không tự chạy migrate/seed trong mỗi build Vercel.
- Khi deployment lỗi, chọn deployment production đã kiểm tra trước trong Vercel và dùng chức năng Promote/Rollback phù hợp tài khoản. [Quản lý production deployment](https://vercel.com/docs/deployments/promoting-a-deployment). Không rollback database bằng xóa bảng hoặc sửa migration đã chạy; schema thay đổi cần xem tính tương thích trước khi quay lại mã cũ.
- Quên mật khẩu: ưu tiên admin khác đặt lại tại Tài khoản. Trường hợp mất quyền đăng nhập toàn bộ, dùng [quy trình khôi phục offline](../README.md#quên-mật-khẩu-admin), chỉ người giữ kết nối production được thực hiện.

## Trạng thái cần điền sau khi triển khai thực tế

| Hạng mục | Trạng thái hiện tại |
|---|---|
| Supabase dev / bucket media | Có, dùng cho local; không phải bằng chứng production |
| Supabase prod Singapore | Chưa tạo/xác minh trong phiên này |
| Vercel project, env và URL Ready | Chưa có kết nối tài khoản / chưa triển khai |
| Domain web / Resend Verified | Chủ shop chưa cung cấp |
| Đơn thật → Hoàn thành | Chưa thực hiện, Phase 13 chưa nghiệm thu |
