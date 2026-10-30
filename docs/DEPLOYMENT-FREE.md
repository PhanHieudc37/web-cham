# Triển khai miễn phí — Netlify + Supabase

Theo yêu cầu chủ shop ngày 30/10/2026: chỉ dùng gói miễn phí, không mua domain hoặc đăng ký dịch vụ trả phí. Phương án này thay Vercel làm lựa chọn mặc định của Phase 13; giữ nguyên Next.js, Better Auth, PostgreSQL và Storage hiện tại. **Chưa có deployment online được xác minh.**

## Chi phí và giới hạn

| Phần | Phương án |
|---|---|
| Web | Netlify Free, dùng URL HTTPS `*.netlify.app` do tài khoản thực sự cấp |
| Database/ảnh | Supabase Free; prod tách dev nếu còn quota tạo project |
| Domain web riêng | Chưa mua; dùng subdomain miễn phí |
| Email | Resend Free trong quota; gửi tới khách vẫn cần domain sở hữu đã Verified |

[Netlify cho phép dự án thương mại trên Free](https://www.netlify.com/blog/introducing-netlify-free-plan/). Gói Free hiện có 300 credit/tháng, hard limit và không auto recharge; hết credit có thể tạm dừng website tới kỳ sau. Deploy production, compute, bandwidth và request cùng tiêu credit; không cam kết lượng truy cập vô hạn. Xem [gói Free hiện tại](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/credit-based-pricing-plans/) và [trạng thái pause](https://docs.netlify.com/manage/accounts-and-billing/billing/resume-paused-projects/).

[Supabase Free](https://supabase.com/pricing) có hạn mức và giới hạn hai project active; dự án ít hoạt động có thể bị pause sau khoảng một tuần. Không tạo project trong organization trả phí để rồi tưởng vẫn là Free. Nếu tài khoản hết quota, dừng lại xử lý tài khoản/quota; không xóa dev hoặc chuyển test vào production.

**Giới hạn email:** URL `netlify.app` dùng cho web không phải domain do shop quản lý để xác minh Resend. Nếu chưa có domain gửi email, có thể tiếp tục xem/góp ý giao diện bằng local hoặc bản GitHub Pages; email khách và nghiệm thu production vẫn còn chờ. Không dùng sender thử nghiệm để coi như đã gửi được tới mọi khách, không bỏ validation email production để làm xanh kiểm tra. [Yêu cầu domain Resend](https://resend.com/docs/dashboard/domains/introduction).

## 1. Tạo tài khoản và import repo

1. Vào **https://app.netlify.com/signup**, đăng nhập bằng GitHub `PhanHieudc37`.
2. Chọn **Free**. Không chọn Personal/Pro, trial trả phí hoặc add-on; kiểm tra Usage & billing sau khi tạo tài khoản.
3. Add new project → Import an existing project → GitHub → chọn `PhanHieudc37/web-cham`. Chỉ cấp quyền repository cần dùng.
4. Production branch `main`, Base directory gốc repo; không chọn `preview/` hoặc `.preview-dist`.
5. Build command `npm run build`, Publish directory `.next`, Node 22. Repo đã có `netlify.toml` cho các giá trị này. `NPM_FLAGS=--include=dev` giữ các công cụ/CSS cần lúc build. Không tự đặt `NODE_ENV=production` trong bước cài dependency.
6. Dùng URL `netlify.app` do dashboard cấp. Chọn tên project còn khả dụng trong tài khoản, không coi một URL ví dụ là đã tồn tại.

Netlify tự quản lý adapter Next.js/OpenNext cho SSR, Server Actions, ISR/cache và `next/after`; không cần thêm package adapter hoặc đổi framework trong repo. Không upload riêng thư mục `.next` bằng kéo-thả, không bật static export hoặc thêm rewrite `/* → /index.html`. [Next.js trên Netlify](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/), [cấu hình build](https://www.netlify.com/knowledge-base/how-to-deploy-nextjs-astro-nuxt-or-sveltekit-to-netlify/).

Nếu deploy đầu tiên thất bại khi chưa có env/database, hoàn tất các bước dưới rồi build lại. Chưa coi build đó là website đã chạy.

## 2. Database production và seed

Làm [bước Supabase prod và bucket media](DEPLOYMENT.md#2-tạo-supabase-production-riêng), giữ project dev hiện tại. Giữ region database Singapore theo plan hiện tại. Netlify Free không tương đương region `sin1` trong `vercel.json`; cần kiểm tra độ trễ thực tế, không tự nâng gói để đổi region. [Tùy chọn region Functions](https://docs.netlify.com/build/functions/configuration/).

Chuẩn bị `.env.deploy.local` theo [bảng biến production](DEPLOYMENT.md#5-file-riêng-cho-migrateseedcheck), dùng URL Netlify thật cho **cả** `NEXT_PUBLIC_SITE_URL` và `BETTER_AUTH_URL`. Không dùng `.env` dev làm production; không chạy test hoặc seed sample trên prod.

Sau khi có đầy đủ thông tin thật, chạy lần lượt:

```powershell
npm run production:migrate
npm run production:seed
npm run production:check
```

Các lệnh này giữ nguyên guard đã có: khác project dev, pooler/TLS đúng project, không dùng sender Resend thử nghiệm. Nếu chưa có domain gửi email, bước chuẩn bị production chưa đầy đủ; không điền giá trị giả để vượt guard. Các lệnh có thể được chuẩn bị sẵn nhưng không chạy thành công thay cho tài khoản/domain còn thiếu.

## 3. Env trên Netlify

Project configuration → Environment variables: nhập **giá trị production thật**, cho context Production, khả dụng ở **Builds và Functions** (hoặc All scopes nếu giao diện gói Free chỉ có lựa chọn đó). Không ghi secret vào `netlify.toml`, Git hoặc chat. [Env và scope Netlify](https://docs.netlify.com/build/configure-builds/environment-variables/).

```text
NEXT_PUBLIC_SITE_URL
BETTER_AUTH_URL
BETTER_AUTH_SECRET
DATABASE_URL
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_STORAGE_BUCKET
RESEND_API_KEY
EMAIL_FROM
SHOP_NOTIFY_EMAIL
```

- Hai URL dùng cùng hostname HTTPS chính thức, không có path/query, không để localhost.
- `SUPABASE_STORAGE_BUCKET=media`; các key còn lại lấy từ project/account tương ứng.
- Không đưa `DIRECT_URL`, `TEST_DATABASE_URL`, mật khẩu seed hoặc `ADMIN_RECOVERY_*` lên hosting.
- Hai biến Telegram chỉ thêm nếu thực sự dùng. Không chia sẻ kết nối production sang Deploy Preview; nếu bật Next.js preview, cần env/dev database riêng.
- Sau khi đổi env hoặc hostname, deploy lại rồi đăng nhập lại. Public URL được đóng vào bundle khi build, không chỉ đổi bằng một alias bên ngoài.

## 4. Publish và kiểm tra

1. Trigger deploy bản `main` mới nhất sau khi migrate/seed/check đã pass. Kiểm tra build log có adapter Next.js hoạt động, không chỉ có file HTML tĩnh.
2. Netlify hiện có thể tạo project private trước khi publish. Khi cấu hình đã sẵn sàng, chọn publish/public theo giao diện để khách truy cập được mà không đăng nhập Netlify; không chọn add-on bảo vệ trả phí. [Cách tính production deploy và public access](https://www.netlify.com/pricing/).
3. Kiểm tra từ cửa sổ ẩn danh: trang chủ, ảnh, danh mục, sản phẩm, giỏ/quote, checkout, admin login/guard, canonical/sitemap/robots và noindex. Kiểm tra 375/768/1280px, cookie đăng nhập và email sau Server Action.
4. Kiểm tra `revalidateTag` làm mới sau khi admin sửa giá; kiểm tra `proxy.ts`, security headers và `after()` trên adapter thật. Tương thích theo tài liệu không thay cho nghiệm thu deployment của phiên bản Next đang cài.
5. Làm [nghiệm thu một đơn thật tới Hoàn thành](DEPLOYMENT.md#8-nghiệm-thu-đơn-thật--bắt-buộc-trước-khi-đánh-dấu-phase-13-xong) khi đủ dữ liệu thật, mail và quy trình giao nhận. Không ghi thông tin khách/token vào báo cáo Git.
6. Theo dõi Usage & billing; giữ gói Free và hard limit. Trước khi gần hết credit, dừng các deploy thử không cần thiết; nếu bị pause thì chờ reset, không tự mua thêm hoặc nâng gói.

`vercel.json` còn trong repo để tham khảo cấu hình cũ, không điều khiển Netlify. Các phần chỉ dẫn Vercel trong DEPLOYMENT.md là phương án cũ, không phải bước bắt buộc của phương án miễn phí này. Quên mật khẩu, backup, vận hành và tiêu chí nghiệm thu đơn thật vẫn dùng các quy trình đã viết; rollback hosting dùng deployment Netlify đã xác minh, không tự rollback database.

## Trạng thái hiện tại

Đã chuẩn bị config và hướng dẫn; chưa đăng nhập/tạo project Netlify, chưa xác minh adapter trên hosting, Supabase prod hoặc email khách. Công cụ tích hợp hiện không có Netlify để tự thao tác tài khoản; chủ shop cần đăng nhập dashboard và import repo. Phase 13 vẫn chưa nghiệm thu.
