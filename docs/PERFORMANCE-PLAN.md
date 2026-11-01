# PERFORMANCE PLAN — Tăng tốc cửa hàng và trang quản trị (chỉ dùng miễn phí)

> **Dành cho Codex.** Đây là phần việc được giao thêm sau Phase 13, gọi là **Phase 15 — Tối ưu tốc độ**.
> - Đọc hết file trước khi làm.
> - Làm lần lượt **15.0 → 15A → 15B → 15C → 15D**; bước nào xong nghiệm thu mới sang bước sau.
> - Mọi quy tắc trong `AGENTS.md` vẫn áp dụng.
> - Không cần thêm thư viện nào.

---

## 0. Ràng buộc

- **Chỉ dùng gói miễn phí** đang có: Netlify Free, Supabase Free, GitHub (repo public nên GitHub Actions miễn phí).
  - Không nâng gói, không mua add-on, không thêm dịch vụ trả phí.
- **Không đổi nhà cung cấp hosting:**
  - Không dùng Vercel Hobby: gói này cấm dùng thương mại.
  - Không dùng Cloudflare Workers: gói free giới hạn 3 MB code và 10 ms CPU, không đủ cho app này.
- **Không giảm bảo mật:**
  - Mỗi request admin vẫn kiểm tra quyền và trạng thái khóa tài khoản trong DB.
  - Không đưa dữ liệu admin, đơn hàng hay thông tin khách vào cache dùng chung.
- **Netlify Free tính bằng credit.** Deploy production, request, compute và băng thông đều tốn credit; hết credit thì web bị tạm dừng tới kỳ sau. Vì vậy:
  - **Tối đa 4 lần deploy production cho cả Phase 15**: 1 lần sau mỗi bước 15A, 15B, 15C, và 1 lần dự phòng.
  - Commit chỉ sửa tài liệu thì thêm `[skip netlify]` vào message.
  - Trước khi bắt đầu, ghi số credit còn lại (Netlify → Usage) vào báo cáo.
- **Cần chủ shop xác nhận trước** khi:
  - tạo hoặc tạm dừng project Supabase;
  - đổi biến môi trường trên Netlify;
  - chép dữ liệu production.

---

## 1. Hiện trạng và nguyên nhân

### 1.1 Số đo hiện tại

Lấy từ `docs/PHASE-13-REPORT.md`, ngày 01/11/2026.

| Trang | Lượt đầu | Lượt sau |
|---|---|---|
| Trang chủ | 1,34 s | 0,055 s (cache hit) |
| Danh mục | 3,86 s | 2,10 s |
| Đăng nhập admin | 3,46 s | 0,39 s |
| Admin tổng quan | 2,08–2,37 s | |
| Admin sản phẩm | 2,28–2,93 s | |
| Admin đơn hàng | 1,83–2,26 s (có một lượt 6,35 s) | |

### 1.2 Nguyên nhân

Xếp theo mức ảnh hưởng, lớn nhất trước.

1. **Server và database ở hai đầu thế giới.**
   - Netlify Functions gói Free chạy cố định ở Ohio (`cmh`, AWS `us-east-2`), còn Supabase prod ở Singapore.
   - Mỗi truy vấn đi-về mất khoảng 200 ms.
   - Một trang admin chạy 4–6 truy vấn nối tiếp: đọc session → đọc lại user → đếm badge → dữ liệu trang. Chỉ riêng phần chờ mạng đã mất khoảng 1–1,5 s.
2. **Trang danh mục luôn phải chạy server.** Trang đọc `searchParams` cho bộ lọc nên không bao giờ được CDN cache. Ngoài ra `collections/[slug]/layout.tsx` và `page.tsx` cùng gọi `getListing`.
3. **Mỗi đơn hàng xóa cache của toàn bộ catalog.** `placeOrderAction` gọi `invalidate(CACHE_TAGS.products)` với `expire: 0`, nên khách tiếp theo vào trang chủ, mọi trang sản phẩm và danh mục đều phải chờ server dựng lại trang.
4. **Cache tự hết hạn mỗi 5 phút.** `revalidate: 300` nằm trong `src/server/cache.ts` và `products/[slug]/page.tsx`, trong khi mọi thao tác sửa đã tự xóa cache theo tag rồi.
5. **Một số request ghi DB trước khi làm việc chính.** Gợi ý tìm kiếm (`/api/search/suggest`) và quote giỏ hàng (`/api/cart/quote`) đều ghi bảng `rate_limits` trước, tức thêm một truy vấn nối tiếp mỗi lần gõ phím hoặc mở giỏ.
6. **Function bị khởi động lạnh (cold start)** sau một thời gian không có truy cập, làm lượt đầu chậm thêm 1–4 s. Sau mỗi lần deploy, toàn bộ cache cũng trống.
7. **Admin:**
   - `getSessionUser` chạy 2 truy vấn: đọc session, rồi đọc lại user;
   - trang login là trang động và có `no-store` nên không được cache;
   - mỗi lần bấm menu là một lượt dựng trang đầy đủ ở server.

---

## 2. Phase 15.0 — Công cụ đo và số đo gốc (không deploy)

1. **Viết `scripts/measure-performance.ts`** bằng Playwright (đã có sẵn trong dự án), thêm script `npm run perf:measure`.
   - Với mỗi URL: 1 lượt làm ấm, sau đó đo 5 lượt.
   - Ghi lại cho từng lượt:
     - TTFB;
     - thời gian tới khi thấy nội dung chính (chờ heading của trang);
     - số request gửi tới server ứng dụng (không tính ảnh / file tĩnh);
     - header cache của Netlify (`Cache-Status`, `Age`).
   - Xuất bảng trung vị và p90 vào `docs/PERFORMANCE-REPORT.md`.
2. **Danh sách URL cần đo:**
   - **Cửa hàng:** trang chủ, 1 danh mục, 1 danh mục có bộ lọc, 1 sản phẩm, `/search?q=ao`, `/gioi-thieu`, `POST /api/cart/quote`.
   - **Admin:** đăng nhập → tổng quan, đơn hàng, 1 chi tiết đơn (nếu có), sản phẩm, form 1 sản phẩm (nếu có), quay lại trang vừa xem.
3. **Cách đăng nhập khi đo:**
   - Dùng tài khoản trong `.env.deploy.local`. Không in mật khẩu ra log.
   - Chỉ đọc dữ liệu: **không** tạo đơn, sản phẩm hay tin nhắn trên production.
4. **Đo trên máy của chủ shop** (mạng Việt Nam). Ghi rõ thời điểm đo và loại mạng.
5. **Số đo gốc:** chạy 1 lần trên production hiện tại, lưu thành mục "Baseline".

---

## 3. Phase 15A — Đưa database về cùng region với server (ưu tiên số 1)

**Mục tiêu:** truy vấn từ function tới DB dưới 10 ms (hiện khoảng 200 ms).

**Vì sao phải làm ngay:** theo `PHASE-13-REPORT`, production hiện chưa có sản phẩm hay đơn thật. Chuyển bây giờ gần như không mất gì; càng để lâu thì càng nhiều dữ liệu phải chuyển.

### 3.1 Các bước

1. **Xác minh region của Functions** trong Netlify (Project configuration → Functions).
   - Nếu là Ohio / `us-east-2` thì dùng region Supabase **East US (Ohio)**.
   - Nếu là region khác thì chọn region Supabase trùng hoặc gần nhất, và ghi lý do vào báo cáo.
2. **Kiểm tra dữ liệu thật trong prod Singapore**, rồi báo kết quả cho chủ shop. Cần đếm:
   - số dòng của `products`, `orders`, `contact_messages`;
   - số tài khoản trong `user` (ngoài admin);
   - số object trong bucket `media`;
   - các key `settings` đã được sửa khác giá trị mặc định.
3. **Xin chủ shop xác nhận 2 việc:**
   - tạo project mới (ví dụ `cham-stu-prod-us`) ở Ohio, gói Free;
   - sau khi chuyển xong thì **tạm dừng (pause) project Singapore, không xóa**. Gói Free chỉ cho 2 project active: dev Tokyo và prod mới.
4. **Dựng project mới:**
   - Tạo bucket `media`: public, giới hạn 2 MB, cho phép WebP/JPEG/PNG.
   - Chạy `production:migrate`, sau đó `production:seed` (không có `--sample`).
   - Cập nhật `.env.deploy.local`: project ref, 2 pooler URL, `SUPABASE_URL`, service key.
   - Nếu `scripts/production.ts` đang ghim project ref cũ thì cập nhật cho đúng ref mới.
5. **Xử lý dữ liệu cũ:**
   - **Bước 2 có dữ liệu thật:**
     - Viết `scripts/copy-production.ts` (chỉ chạy một lần, có chế độ `--dry-run` chạy trước).
     - Chép dữ liệu các bảng trong schema public theo thứ tự khóa ngoại, gồm cả bảng auth của Better Auth.
     - Chép object trong bucket `media`, giữ nguyên path.
     - So khớp số dòng từng bảng và số object giữa 2 project.
   - **Không có dữ liệu thật:**
     - Chỉ seed admin, đặt mật khẩu mới và lưu vào `.env.deploy.local`.
     - Nhập lại các settings mà chủ shop đã sửa (nếu có).
6. **Cập nhật biến môi trường Netlify (Production):** `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, và mọi biến khác còn chứa ref cũ. `remotePatterns` của ảnh tự lấy theo `SUPABASE_URL`, không cần sửa.
7. **Thêm route `GET /api/health`:**
   - không cần đăng nhập, header `Cache-Control: no-store`;
   - trả về `{ ok, commit, dbMs }`:
     - `commit`: giá trị `COMMIT_REF` mà Netlify cung cấp **lúc build**, nhúng vào bundle (ví dụ qua `env` trong `next.config`);
     - `dbMs`: thời gian chạy `select 1`, chỉ đo khi URL có `?db=1`.
   - không trả bất kỳ thông tin bí mật nào;
   - không cần rate limit vì route không ghi DB.
8. **Deploy lần #1.** Chạy `production:check` (phải pass), sau đó chạy `npm run perf:measure`.
9. **Cập nhật tài liệu:** `DEPLOYMENT-FREE.md`, `DEPLOYMENT.md`, `PLAN.md` (region mới), và trang chính sách bảo mật nếu có nhắc nơi lưu dữ liệu.

### 3.2 Nghiệm thu 15A

- Gọi `/api/health?db=1` trên production 5 lần: trung vị `dbMs` < 10 ms.
- Đo từ Việt Nam khi function đã ấm: các trang admin tổng quan, đơn hàng, sản phẩm có trung vị < 1 s.
- Project Singapore đã pause (sau khi chủ shop xác nhận). Project dev Tokyo giữ nguyên.

---

## 4. Phase 15B — Trang cửa hàng phục vụ từ cache CDN

**Mục tiêu:** mọi trang công khai (trang chủ, danh mục, sản phẩm, tìm kiếm, trang thông tin) được trả từ cache CDN của Netlify. Server chỉ phải chạy khi dữ liệu thật sự thay đổi.

### 4.1 Trang danh mục tĩnh, lọc ngay trên trình duyệt

- **Server:** `collections/[slug]/page.tsx` **không đọc `searchParams` nữa**.
  - Trả về **toàn bộ** card sản phẩm của danh mục (sắp theo thứ tự mặc định) kèm facets.
  - Trang được cache (ISR) với tag như hiện tại.
- **Client:** mở rộng `ListingControls` thành client component.
  - Đọc `useSearchParams` (bọc trong `Suspense`).
  - Lọc, sắp xếp, phân trang bằng hàm thuần mới trong `src/lib/listing.ts`.
  - Giữ nguyên định dạng URL hiện tại: `?size=…&color=…&price=…&instock=1&sort=…&page=…`.
  - Khi đổi bộ lọc thì dùng `router.replace`: không tải lại trang, không gọi server.
- **SEO:** HTML dựng sẵn vẫn chứa 12 sản phẩm đầu. Canonical không đổi.
- **`listing.ts` phải cho kết quả giống hệt truy vấn SQL hiện tại.**
  - Viết test so sánh với `getListing` trên dữ liệu seed, cho mọi tổ hợp lọc / sắp xếp mẫu.
  - Khi test đã pass, có thể bỏ nhánh lọc SQL không còn dùng.
- **Chỉ đọc dữ liệu 1 lần mỗi request:** layout và page dùng chung một lần đọc bằng cách bọc hàm đọc trong React `cache`. Slug sai vẫn trả HTTP 404 như hiện tại.
- **Giới hạn an toàn:** danh mục nào có hơn 500 sản phẩm thì in cảnh báo lúc build. Shop hiện còn nhỏ, chưa cần phân trang phía server.

### 4.2 Tìm kiếm ngay trên trình duyệt

- **Thêm route `GET /search-index.json`** (route handler, cache theo tag `products` và `categories`). Mỗi phần tử gồm:
  - `slug`, `name`;
  - `n`: chuỗi tìm kiếm đã bỏ dấu;
  - `price`, `compareAtPrice`;
  - `image`: URL ảnh nhỏ;
  - `isSoldOut`, `soldCount`.
- **Client tìm cục bộ:**
  - `SearchOverlay` và trang `/search` tải file này đúng một lần (lần đầu mở tìm kiếm).
  - Tìm bằng `normalizeVietnamese`, không gọi server mỗi lần gõ phím.
  - `/search` chuyển thành trang tĩnh + client.
- **Bỏ `/api/search/suggest`** sau khi không còn chỗ nào gọi. Nhờ vậy gõ tìm kiếm không còn ghi vào `rate_limits`.

### 4.3 Đơn hàng không còn xóa cache toàn catalog

- **Trang sản phẩm:**
  - HTML (đã cache) vẫn chứa tồn kho tại lúc dựng trang, dùng làm giá trị ban đầu.
  - Khi trang mở, client gọi route mới `GET /api/products/[id]/availability`. Route này `no-store`, chỉ đọc, chạy 1 truy vấn, trả về:
    - size nào còn / hết;
    - `maxQuantity`, `lowStockCount`;
    - giá hiện tại.
  - Trong lúc chờ: nút mua bị disabled trong chốc lát, layout không được nhảy.
- **`placeOrderAction`:** chỉ gọi `invalidate(products)` khi đơn làm **ít nhất 1 sản phẩm chuyển sang hết hàng hoàn toàn**, để nhãn HẾT HÀNG ở trang danh sách vẫn đúng.
  - `order.service` trả thêm danh sách id các sản phẩm vừa hết hàng.
- **Admin hủy hoặc hoàn trả đơn:** làm tương tự, chỉ invalidate khi có sản phẩm từ hết hàng trở lại còn hàng.

### 4.4 Thời gian cache

| Nơi | Giá trị hiện tại | Giá trị mới | Lý do |
|---|---|---|---|
| `cached()` trong `src/server/cache.ts` | 300 | 86400 (1 ngày) | Mọi thao tác sửa đã tự invalidate theo tag nên dữ liệu không bị cũ |
| `products/[slug]/page.tsx` | 300 | 86400 | Như trên |
| Trang chủ | (theo `cached`) | 3600 | Banner có `starts_at` / `ends_at`; giữ 1 giờ để banner hẹn giờ bật/tắt đúng trong vòng 1 giờ |
| Trang thông tin (chính sách, giới thiệu…) | (theo `cached`) | 86400 | Đọc settings, đã có tag `settings` |

### 4.5 Làm ấm cache sau khi sửa và sau khi deploy

- **Hàm `warmPaths(paths: string[])`** trong `src/server/cache.ts`:
  - chạy trong `after()`;
  - gọi `fetch(NEXT_PUBLIC_SITE_URL + path)` lần lượt từng path, timeout 10 s;
  - tối đa 10 path mỗi lần, lỗi thì chỉ log.
- **Gọi `warmPaths` sau các action admin có invalidate:**

  | Action | Path cần làm ấm |
  |---|---|
  | Lưu sản phẩm | `/`, `/products/{slug}`, các danh mục của sản phẩm |
  | Sửa banner, settings | `/` |
  | Sửa danh mục, bộ sưu tập | `/`, `/collections/{slug}` |

- **Workflow `.github/workflows/warm-after-deploy.yml`** (chạy khi push lên `main`):
  1. Đợi tới khi `/api/health` trả `commit` bằng `github.sha`: cứ 30 s kiểm tra một lần, tối đa 15 phút.
  2. Gọi lần lượt các URL trong `/sitemap.xml`: tối đa 200 URL, mỗi URL cách nhau 300 ms.
  3. Bỏ qua workflow khi commit message có `[skip netlify]`.

### 4.6 Giữ function luôn ấm

- **Workflow `.github/workflows/keep-warm.yml`:**
  - `schedule: "*/5 * * * *"`: cứ 5 phút gọi `/api/health` một lần;
  - mỗi giờ gọi thêm `/api/health?db=1` một lần, để Supabase không bị pause khi vắng khách.
- **README cần ghi chú:**
  - GitHub có thể chạy trễ lịch vài phút.
  - GitHub tự tắt lịch chạy của repo public sau 60 ngày không có commit. Khi đó vào tab Actions để bật lại, hoặc dùng cron-job.org (miễn phí) gọi cùng URL.
- **Chi phí ước tính:** khoảng 9.000 request/tháng. Sau 1 tuần, ghi mức credit tiêu thụ thực tế vào báo cáo.

### 4.7 Quote giỏ hàng

- `/api/cart/quote`: chạy `rateLimit` và `quoteCart` song song (`Promise.all`).
  - Nếu rate limit báo vượt giới hạn thì vẫn trả lỗi `RATE_LIMITED` như cũ.
  - Không đổi logic tính giá.

### 4.8 Nghiệm thu 15B

- **Cache:** trang chủ, 1 danh mục, 1 sản phẩm, `/search`, `/gioi-thieu`, từ lượt thứ 2 trở đi:
  - header của Netlify báo cache hit;
  - TTFB trung vị < 200 ms khi đo từ Việt Nam.
- **Danh mục:** đổi bộ lọc / sắp xếp / trang thì không có request nào tới server (kiểm tra bằng Playwright), giao diện cập nhật trong < 100 ms.
- **Tìm kiếm:** sau khi đã tải index, gõ tìm kiếm không phát sinh request tới server.
- **Đơn hàng và cache:**
  - Đặt 1 đơn không làm sản phẩm nào hết hàng (trên dev/test): trang chủ và trang sản phẩm vẫn cache hit ngay sau đó.
  - Đặt đơn làm một sản phẩm hết hàng: nhãn HẾT HÀNG xuất hiện ở trang danh sách.
- **Tồn kho:** trang sản phẩm luôn hiện tồn kho đúng ngay sau khi có đơn (lấy từ route availability).
- **Sau deploy:** workflow làm ấm chạy xong, và lượt truy cập đầu tiên của khách vào trang chủ đã là cache hit.
- **Test:**
  - Toàn bộ test cũ vẫn pass.
  - Có test mới cho: `listing.ts` (khớp với SQL), search index, route availability, logic chỉ invalidate khi có sản phẩm đổi trạng thái hết hàng.

---

## 5. Phase 15C — Trang quản trị

**Mục tiêu:**
- Chuyển trang trong admin có trung vị < 700 ms khi function đã ấm.
- Các thao tác (đổi trạng thái đơn, lưu) phản hồi ngay trên giao diện.

### 5.1 Việc cần làm

1. **Một truy vấn cho phiên đăng nhập.**
   - `getSessionUser` dùng luôn dữ liệu user (`role`, `banned`) mà Better Auth trả về cùng session (joins đã bật). Bỏ câu `SELECT user` thứ hai.
   - **Vẫn không bật `cookieCache`**, để việc khóa tài khoản có hiệu lực ngay lập tức.
   - Sửa test đếm truy vấn thành đúng 1 SELECT.
2. **Chạy song song thay vì nối tiếp.**
   - Trong mỗi page admin: kiểm tra quyền và đọc dữ liệu cùng lúc (`Promise.all`), xong mới render.
   - Layout đọc số badge song song với page, không await nối tiếp.
   - Danh sách đơn, sản phẩm, tin nhắn: gộp truy vấn đếm tổng và truy vấn danh sách thành 1 câu (`count(*) over()`).
3. **Trang login thành trang tĩnh.**
   - `/admin/login` không đọc session ở server.
   - Proxy không đặt `no-store` cho riêng trang này. Vẫn giữ `noindex`.
   - Nếu người dùng đã đăng nhập: sau khi trang hiện, client gọi `GET /api/auth/get-session` rồi chuyển vào `/admin`.
4. **Cache điều hướng phía trình duyệt.**
   - Bật router cache cho trang dynamic, để từ chi tiết đơn quay lại danh sách đơn là hiện ngay. Kiểm tra tên cấu hình đúng với Next 16 đang cài trong `node_modules/next/dist/docs/`, ví dụ `staleTimes.dynamic = 30`.
   - **Bắt buộc:** mọi Server Action sửa dữ liệu phải làm mới đúng trang liên quan (`revalidatePath` / `refresh`), để không hiện dữ liệu cũ.
   - Thêm E2E: đổi trạng thái một đơn, quay lại danh sách đơn, thấy trạng thái mới.
5. **Prefetch khi người dùng sắp bấm.**
   - Link ở sidebar và các dòng trong bảng đơn / sản phẩm gọi `router.prefetch(href)` khi có `onMouseEnter`, `onFocus` hoặc `onTouchStart`.
   - **Không** prefetch tự động theo viewport như trước: vẫn phải có 0 request prefetch khi chỉ mở trang.
6. **Cập nhật lạc quan (optimistic update)** cho các thao tác:
   - đổi trạng thái đơn;
   - đánh dấu đã nhận tiền;
   - đánh dấu tin nhắn đã xử lý;
   - bật/tắt hiển thị.

   Cách làm:
   - Dùng `useOptimistic` để cập nhật giao diện ngay, sau đó mới gọi action.
   - Action lỗi thì hoàn tác và hiện toast.
   - Khi được, dùng dữ liệu action trả về thay cho `router.refresh()` toàn trang.
7. **Ảnh trong admin:** ảnh trong bảng và lưới dùng `sizes` nhỏ (≤ 96px) và `loading="lazy"`.
8. **Ngân sách truy vấn.** Viết test tự động đếm số query mỗi page service phải chạy; không được có N+1.

   | Trang | Số query tối đa |
   |---|---|
   | Tổng quan (chạy song song) | 4 |
   | Danh sách đơn | 3 |
   | Chi tiết đơn | 4 |
   | Danh sách sản phẩm | 3 |
   | Form sản phẩm | 5 |

### 5.2 Nghiệm thu 15C

- Đo từ Việt Nam khi function đã ấm, cho các trang tổng quan, đơn hàng, chi tiết đơn, sản phẩm, form sản phẩm:
  - trung vị < 700 ms, p90 < 1,2 s;
  - quay lại trang vừa xem < 150 ms.
- Lượt đầu tiên sau 30 phút không dùng (function có thể đã lạnh): < 2,5 s.
- Từ lúc bấm đăng nhập tới khi thấy trang tổng quan: < 1,5 s.
- Toàn bộ test cũ về phân quyền và khóa tài khoản vẫn pass.

---

## 6. Phase 15D — Báo cáo và cập nhật tài liệu

1. **Đo 3 mốc** bằng `npm run perf:measure` (cùng máy, cùng mạng):
   - baseline (đã đo ở 15.0);
   - sau 15A;
   - sau 15B + 15C.

   Ghi cả 3 vào `docs/PERFORMANCE-REPORT.md`.
2. **Lighthouse mobile** cho trang chủ và 1 trang sản phẩm: điểm phải giữ ít nhất bằng mức đã đạt ở Phase 12.
3. **Cập nhật tài liệu:**
   - `ARCHITECTURE.md`: cache, danh mục lọc ở client, search index, route availability, làm ấm cache;
   - `STOREFRONT.md` mục 4–6;
   - `DEPLOYMENT-FREE.md`: region mới, các workflow mới;
   - README: keep-warm, cách bật lại lịch chạy khi GitHub tự tắt.
4. **Ghi credit Netlify:** số credit đã dùng trong đợt này và mức dự kiến mỗi tháng.

---

## 7. Mục tiêu tổng hợp

Đo từ mạng Việt Nam.

| Hạng mục | Hiện tại | Mục tiêu |
|---|---|---|
| Truy vấn DB từ server | ~200 ms/lần | < 10 ms/lần |
| Trang chủ, sản phẩm, danh mục (cache hit) | trang chủ 0,055 s; danh mục 2,1 s | TTFB < 200 ms cho cả 3 |
| Đổi bộ lọc danh mục | gọi server mỗi lần | < 100 ms, không gọi server |
| Gõ tìm kiếm | gọi server + ghi DB | tức thì, không gọi server |
| Admin chuyển trang (function ấm) | 1,8–2,9 s | trung vị < 0,7 s |
| Admin quay lại trang vừa xem | như mở mới | < 150 ms |
| Lượt đầu khi function lạnh | 3,5–6,6 s | < 2,5 s |
| Chi phí | 0đ | 0đ |

---

## 8. Không được làm

- Không nâng gói Netlify hay Supabase, không mua add-on, không chuyển sang Vercel Hobby.
- Không bật `cookieCache` của Better Auth.
- Không cache dữ liệu admin, đơn hàng hay thông tin khách trên CDN hoặc trong `unstable_cache`.
- Không bỏ rate limit ở các chỗ: đặt hàng, tra cứu đơn, liên hệ, đăng nhập.
- Không xóa project Supabase cũ: chỉ pause, và chỉ sau khi chủ shop xác nhận.
- Không deploy production quá 4 lần trong Phase 15.
