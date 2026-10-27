# DATABASE — Dữ liệu và quy tắc nghiệp vụ

## 1. Quy ước

- **Database:** PostgreSQL trên Supabase.
  - Schema viết bằng Drizzle, đặt trong `src/server/db/schema/`.
  - Migration sinh bằng `drizzle-kit generate`, nằm trong `src/server/db/migrations/`.
- **Tên bảng và cột:** snake_case. Bật Drizzle `casing: "snake_case"` để code TS dùng camelCase.
- **Khóa chính:** `uuid`, mặc định `gen_random_uuid()`. Riêng bảng auth của Better Auth dùng id dạng `text`.
- **Thời gian:** bảng chính có `created_at` và `updated_at` (`timestamptz`, mặc định `now()`). Service tự cập nhật `updated_at` mỗi lần sửa.
- **Tiền:** kiểu `integer` (VND). Không dùng float hay numeric.
- **Không xóa cứng:**
  - sản phẩm: đặt `status = 'archived'`;
  - đơn hàng: chuyển sang `cancelled`.
- **Extension:** `pg_trgm` (dùng cho tìm kiếm).
- **Cột tham chiếu tới user** (`actor_id`, `updated_by`…) có kiểu `text`, khớp với id của Better Auth.

## 2. Enum

```
product_status    draft | active | archived
order_status      pending | confirmed | shipping | completed | cancelled | returned
payment_method    cod | bank_transfer
payment_status    unpaid | paid | refunded
stock_reason      order | cancel | return | manual | import
order_event_type  created | status_changed | payment_updated | shipping_updated | note
contact_status    new | handled
discount_type     percent | fixed | free_shipping      (Phase 14a)
```

Nhãn tiếng Việt, đặt trong `src/lib/constants.ts`:

| Enum | Giá trị → nhãn |
|---|---|
| order_status | pending: Chờ xác nhận · confirmed: Đã xác nhận · shipping: Đang giao · completed: Hoàn thành · cancelled: Đã hủy · returned: Hoàn trả |
| payment_status | unpaid: Chưa thanh toán · paid: Đã thanh toán · refunded: Đã hoàn tiền |
| payment_method | cod: Thanh toán khi nhận hàng (COD) · bank_transfer: Chuyển khoản |
| product_status | draft: Nháp · active: Đang bán · archived: Lưu trữ |

---

## 3. Các bảng

### 3.1 Danh mục và sản phẩm

```
categories                         -- tối đa 2 cấp
  id              uuid pk
  parent_id       uuid null → categories.id (on delete restrict)
  name            text not null
  slug            text unique not null
  image_url       text null
  image_path      text null
  sort_order      integer not null default 0
  is_active       boolean not null default true
  created_at, updated_at

size_charts
  id              uuid pk
  name            text not null            -- "Bảng size áo thun"
  columns         jsonb not null           -- string[]: ["Size","Chiều cao","Cân nặng","Dài áo","Rộng áo"]
  rows            jsonb not null           -- string[][]
  note            text null
  created_at, updated_at

products
  id                uuid pk
  code              text unique not null   -- mã sản phẩm do shop đặt, ví dụ "TEE01" (tiền tố SKU)
  slug              text unique not null
  name              text not null
  category_id       uuid not null → categories.id (restrict)
  status            product_status not null default 'draft'
  price             integer not null check (price > 0)
  compare_at_price  integer null check (compare_at_price is null or compare_at_price > price)
  description       text not null default ''
  material          text null
  fit               text null              -- "Boxy", "Oversize", "Regular"...
  care              text[] not null default '{}'
  size_chart_id     uuid null → size_charts.id (set null)
  is_new            boolean not null default false   -- gắn nhãn NEW thủ công
  is_best_seller    boolean not null default false   -- ghim vào BEST SELLER
  sort_order        integer not null default 0       -- thứ tự "Nổi bật" (nhỏ đứng trước)
  sold_count        integer not null default 0
  search_text       text not null          -- xem 4.6, cập nhật mỗi lần lưu
  seo_title         text null
  seo_description   text null
  published_at      timestamptz null       -- lần đầu chuyển sang active
  created_at, updated_at
  index (status, category_id), index (status, published_at desc)
  gin index search_text gin_trgm_ops

product_colors
  id              uuid pk
  product_id      uuid not null → products.id (cascade)
  name            text not null            -- "Đen"
  code            text not null            -- "den" (slug của name, dùng cho bộ lọc và SKU)
  hex             text not null            -- "#111111"
  sort_order      integer not null default 0
  unique (product_id, code)

product_images
  id              uuid pk
  product_id      uuid not null → products.id (cascade)
  color_id        uuid null → product_colors.id (set null)
  url             text not null
  storage_path    text not null
  alt             text not null default ''
  sort_order      integer not null default 0   -- 0 = ảnh chính, 1 = ảnh hiện khi hover
  created_at

product_variants                   -- mọi biến thể dùng chung giá của sản phẩm
  id              uuid pk
  product_id      uuid not null → products.id (cascade)
  color_id        uuid not null → product_colors.id (cascade)
  size            text not null
  sku             text unique not null     -- mặc định {CODE}-{COLORCODE}-{SIZE}, viết hoa
  stock           integer not null default 0 check (stock >= 0)
  is_active       boolean not null default true
  created_at, updated_at
  unique (product_id, color_id, size)
```

### 3.2 Bộ sưu tập và banner

```
collections                        -- bộ sưu tập thủ công, ví dụ "THU ĐÔNG 2026"
  id              uuid pk
  slug            text unique not null
  title           text not null
  description     text null
  banner_url      text null
  banner_path     text null
  is_active       boolean not null default true
  show_on_home    boolean not null default false  -- hiện thành 1 section ở trang chủ
  show_in_menu    boolean not null default false  -- hiện trên menu chính
  sort_order      integer not null default 0
  created_at, updated_at

collection_products
  collection_id   uuid → collections.id (cascade)
  product_id      uuid → products.id (cascade)
  sort_order      integer not null default 0
  primary key (collection_id, product_id)

banners
  id                  uuid pk
  title               text not null        -- tên nội bộ
  desktop_image_url   text not null
  desktop_image_path  text not null
  mobile_image_url    text not null
  mobile_image_path   text not null
  alt                 text not null
  href                text not null
  cta_label           text not null default 'MUA NGAY'
  sort_order          integer not null default 0
  is_active           boolean not null default true
  starts_at           timestamptz null
  ends_at             timestamptz null
  created_at, updated_at
```

### 3.3 Đơn hàng

```
orders
  id                  uuid pk
  code                text unique not null       -- CS2610274821 (xem 4.9)
  access_token_hash   text not null
  idempotency_key     text unique not null
  status              order_status not null default 'pending'
  payment_method      payment_method not null
  payment_status      payment_status not null default 'unpaid'
  customer_name       text not null
  customer_phone      text not null              -- đã chuẩn hóa dạng 0xxxxxxxxx
  customer_email      text null
  province            text not null
  ward                text not null
  address_line        text not null
  note                text null
  subtotal            integer not null
  discount_amount     integer not null default 0
  shipping_fee        integer not null
  total               integer not null
  discount_code       text null
  carrier             text null                  -- "GHN", "GHTK", "Viettel Post", "J&T"...
  tracking_code       text null
  admin_note          text null
  cancel_reason       text null
  customer_id         text null → user.id (set null)   -- dùng từ Phase 14d
  ip                  text null
  created_at, updated_at
  confirmed_at, shipped_at, completed_at, cancelled_at, returned_at, paid_at   timestamptz null
  index (status, created_at desc), index (customer_phone), index (created_at desc)

order_items                        -- lưu bản chụp (snapshot): sửa/xóa sản phẩm sau này không ảnh hưởng đơn cũ
  id              uuid pk
  order_id        uuid not null → orders.id (cascade)
  product_id      uuid null → products.id (set null)
  variant_id      uuid null → product_variants.id (set null)
  product_name    text not null
  product_slug    text not null
  color_name      text not null
  size            text not null
  sku             text not null
  image_url       text null
  unit_price      integer not null
  quantity        integer not null check (quantity > 0)
  line_total      integer not null

order_events                       -- lịch sử đơn, hiển thị dạng timeline trong admin
  id              uuid pk
  order_id        uuid not null → orders.id (cascade)
  type            order_event_type not null
  from_status     order_status null
  to_status       order_status null
  message         text null
  actor_id        text null          -- null = hệ thống hoặc khách
  created_at

stock_movements                    -- mọi thay đổi tồn kho đều ghi vào đây
  id              uuid pk
  variant_id      uuid not null → product_variants.id (cascade)
  delta           integer not null   -- số âm = trừ kho
  stock_after     integer not null
  reason          stock_reason not null
  order_id        uuid null → orders.id (set null)
  actor_id        text null
  note            text null
  created_at
  index (variant_id, created_at desc)
```

### 3.4 Bảng khác

```
contact_messages
  id              uuid pk
  name            text not null
  phone           text not null
  email           text null
  message         text not null
  status          contact_status not null default 'new'
  ip              text null
  handled_at      timestamptz null
  handled_by      text null
  created_at

settings
  key             text pk            -- xem mục 5
  value           jsonb not null
  updated_at      timestamptz not null default now()
  updated_by      text null

rate_limits
  key             text pk            -- ví dụ "order:1.2.3.4"
  count           integer not null
  reset_at        timestamptz not null
```

### 3.5 Bảng auth (Better Auth)

Gồm `user`, `session`, `account`, `verification`:
- Sinh bằng CLI của Better Auth, xuất ra schema Drizzle (`src/server/db/schema/auth.ts`).
- Bảng `user` có thêm các cột của plugin `admin` (`role`, `banned`, `ban_reason`, `ban_expires`).
- **Không tự viết tay các bảng này.**

### 3.6 Phase 14 (không tạo ở Phase 1)

```
discount_codes (14a)
  id, code text unique (viết hoa), type discount_type, value integer (1–100 nếu percent, VND nếu fixed),
  min_subtotal integer default 0, max_discount integer null, usage_limit integer null,
  used_count integer default 0, starts_at null, ends_at null, is_active boolean, created_at, updated_at

payment_transactions (14b)
  id, provider text ('sepay'), provider_txn_id text, amount integer, content text,
  transferred_at timestamptz, order_id uuid null, matched boolean, raw jsonb, created_at
  unique (provider, provider_txn_id)
```

---

## 4. Quy tắc nghiệp vụ

### 4.1 Sản phẩm nào hiện trên cửa hàng

- Sản phẩm phải có `status = 'active'`; danh mục của nó và danh mục cha (nếu có) đều phải `is_active`.
- **Hết hàng** = mọi biến thể đang bán đều có `stock = 0`. Sản phẩm hết hàng vẫn hiện, kèm nhãn "HẾT HÀNG", và luôn **xếp cuối** danh sách bất kể cách sắp xếp.
- Danh mục không còn sản phẩm nào đang hiện thì tự ẩn khỏi menu.

### 4.2 Giá và sale

- Sản phẩm đang sale khi `compare_at_price > price`.
- `% giảm = round((1 - price / compare_at_price) * 100)`.

### 4.3 Thứ tự size

Thứ tự chuẩn: `XS, S, M, L, XL, XXL, 3XL, Freesize`. Size không có trong danh sách này đứng sau, xếp theo A-Z. Hàm sắp nằm trong `lib/domain/sizes.ts`.

### 4.4 Collection tự động

Không lưu trong DB, logic nằm trong `catalog.service`.

| slug | Tiêu đề | Điều kiện | Sắp xếp mặc định |
|---|---|---|---|
| `all` | TẤT CẢ SẢN PHẨM | mọi sản phẩm đang hiện | Nổi bật (`sort_order`, rồi `published_at` giảm dần) |
| `new-arrival` | NEW ARRIVAL | `is_new = true` HOẶC `published_at` trong 30 ngày gần nhất | Mới nhất |
| `best-seller` | BEST SELLER | `is_best_seller = true` HOẶC `sold_count > 0` | sản phẩm `is_best_seller` lên trước, rồi `sold_count` giảm dần |
| `sale` | SALE | `compare_at_price > price` | % giảm nhiều nhất |

### 4.5 Slug

- **Tự sinh:** lấy `name`, chạy `normalizeVietnamese`, thay ký tự không phải chữ/số bằng `-`, bỏ `-` thừa. Nếu trùng thì thêm `-2`, `-3`…
- **Slug do người dùng tự nhập mà bị trùng:** trả lỗi `CONFLICT` gắn vào field `slug`.
- **Danh mục và bộ sưu tập dùng chung đường dẫn** `/collections/{slug}`, nên slug phải duy nhất **giữa cả 2 bảng** (service kiểm tra).
- **Slug dành riêng**, không được dùng: `all`, `new-arrival`, `best-seller`, `sale`.

### 4.6 Tìm kiếm

- `search_text` = `normalizeVietnamese(name + code + tên danh mục + tên danh mục cha + tên các màu)`.
- Truy vấn được chuẩn hóa rồi tách thành từng từ; mỗi từ phải khớp `search_text ILIKE '%từ%'` (điều kiện AND).
- Kết quả xếp theo `similarity(search_text, q)` giảm dần, sau đó theo `sold_count`.
- Truy vấn ngắn hơn 2 ký tự thì trả về rỗng.
- `normalizeVietnamese`: chuyển chữ thường, NFD rồi bỏ dấu, `đ` → `d`, gộp khoảng trắng thừa.

### 4.7 Tính tiền (`lib/domain/pricing.ts`, hàm thuần, có test)

```
subtotal       = Σ price × quantity                 (chỉ tính các dòng hợp lệ)
freeShip       = (freeShipMinItems  != null && itemCount >= freeShipMinItems)
              || (freeShipMinAmount != null && subtotal  >= freeShipMinAmount)
shippingFee    = freeShip ? 0 : shipping.fee
discountAmount = 0                                   (Phase 14a: tính từ mã trên subtotal)
total          = max(0, subtotal - discountAmount + shippingFee)
```

Ngưỡng freeship luôn so với `subtotal` **trước** khi trừ giảm giá.

### 4.8 Tạo đơn (`order.service.placeOrder`)

```
1. rateLimit("order:" + ip, 5, 600)            → vượt thì RATE_LIMITED
2. Ô honeypot có giá trị                        → trả ok giả, không ghi DB
3. checkoutSchema.parse(input)                  → sai thì VALIDATION_ERROR
4. Đã có đơn với idempotency_key này            → trả lại đơn đó (không tạo mới)
5. BEGIN TRANSACTION
   a. SELECT variant + product theo các variantId, sắp id tăng dần (tránh deadlock), FOR UPDATE trên variants
   b. Kiểm tra từng dòng: product active, variant active, stock >= quantity
      → không đạt thì OUT_OF_STOCK, details = [{ variantId, available }]
   c. Tính tiền theo 4.7, dùng giá trong DB
   d. total != expectedTotal                   → PRICE_CHANGED, details = quote mới
   e. Sinh code (trùng thì thử lại, tối đa 3 lần) và access token (4.9)
   f. INSERT orders, INSERT order_items (snapshot)
   g. UPDATE product_variants SET stock = stock - qty; INSERT stock_movements (reason 'order', delta -qty)
   h. UPDATE products SET sold_count = sold_count + qty
   i. INSERT order_events (type 'created', to_status 'pending')
   j. (14a) tăng used_count của mã giảm giá, kiểm tra usage_limit
6. COMMIT
7. after(): email cho khách (nếu có email), email + Telegram cho shop
8. Trả { orderCode, accessToken }
```

### 4.9 Mã đơn và access token

- **Mã đơn** = `orders.codePrefix` (mặc định `CS`) + `yyMMdd` (giờ Việt Nam) + 4 chữ số ngẫu nhiên. Ví dụ: `CS2610274821`.
- **Access token:** 32 byte ngẫu nhiên, mã hóa base64url. Chỉ trả cho khách một lần (trên URL trang thành công); DB chỉ lưu SHA-256 của token.
- **Tra cứu đơn** dùng mã đơn + SĐT, không dùng token.

### 4.10 Trạng thái đơn (`lib/domain/order-status.ts`)

| Từ \ Sang | confirmed | shipping | completed | cancelled | returned |
|---|---|---|---|---|---|
| **pending** | ✓ | | | ✓ | |
| **confirmed** | | ✓ | | ✓ | |
| **shipping** | | | ✓ | | ✓ |
| **completed** | | | | | ✓ |
| cancelled / returned | (trạng thái cuối, không chuyển tiếp) | | | | |

Tác động kèm theo mỗi lần chuyển. Mọi lần chuyển đều chạy trong transaction và ghi một dòng `order_events`.

- **→ confirmed:** ghi `confirmed_at`. Đơn chuyển khoản mà chưa thanh toán thì admin thấy cảnh báo trước khi xác nhận.
- **→ shipping:** ghi `shipped_at`. Nếu có email khách thì gửi `order-shipped` (kèm hãng và mã vận đơn nếu đã nhập).
- **→ completed:** ghi `completed_at`. Đơn COD đang `unpaid` thì tự chuyển sang `paid` và ghi `paid_at`.
- **→ cancelled:**
  - **Bắt buộc** có `cancel_reason`; ghi `cancelled_at`.
  - Hoàn kho (`stock_movements` reason `cancel`) và trừ lại `sold_count`.
  - Đơn đã `paid` thì hiện nhắc "Cần hoàn tiền cho khách"; admin bấm "Đã hoàn tiền" thì chuyển `payment_status` sang `refunded`.
- **→ returned:** ghi `returned_at`, hoàn kho (reason `return`), trừ lại `sold_count`.

### 4.11 Thanh toán

- **COD:** `unpaid` cho tới khi đơn `completed`, hoặc admin tự đánh dấu.
- **Chuyển khoản:**
  - Khách quét QR trên trang thành công, nội dung chuyển khoản là mã đơn.
  - Admin kiểm tra tài khoản ngân hàng rồi bấm "Đã nhận tiền": `paid`, ghi `paid_at` và một `order_events` loại `payment_updated`.
  - Phase 14b: SePay tự đánh dấu.
- **Đánh dấu thanh toán không tự đổi `status` của đơn.**

### 4.12 Tồn kho

- Tồn kho không bao giờ âm (đã có ràng buộc `check` trong DB).
- **Admin sửa tồn kho:**
  - Form gửi lên giá trị tồn kho lúc mở form (`expectedStock`) và giá trị mới (`newStock`).
  - Server tính `delta = newStock - expectedStock` rồi chạy `UPDATE ... SET stock = stock + delta WHERE stock + delta >= 0`.
  - Làm vậy để nếu có đơn mới trong lúc admin đang mở form thì số trừ của đơn không bị ghi đè mất.
  - Mỗi lần sửa ghi `stock_movements` reason `manual`.
- **Sắp hết hàng** khi `stock <= orders.lowStockThreshold` (mặc định 3).

### 4.13 Doanh thu (trang tổng quan)

- Doanh thu = tổng `total` của đơn có trạng thái `confirmed`, `shipping` hoặc `completed`, tính theo ngày tạo đơn (giờ Việt Nam).
- Đơn `pending` hiển thị riêng ở mục "chờ xác nhận"; đơn `cancelled` / `returned` không tính.

### 4.14 Rate limit (`server/rate-limit.ts`)

```sql
INSERT INTO rate_limits (key, count, reset_at)
VALUES ($1, 1, now() + make_interval(secs => $2))
ON CONFLICT (key) DO UPDATE SET
  count    = CASE WHEN rate_limits.reset_at < now() THEN 1 ELSE rate_limits.count + 1 END,
  reset_at = CASE WHEN rate_limits.reset_at < now() THEN EXCLUDED.reset_at ELSE rate_limits.reset_at END
RETURNING count, reset_at;
```

- Nếu `count` vượt giới hạn thì trả `RATE_LIMITED`.
- Dọn dữ liệu cũ: khoảng 1% số lần gọi sẽ chạy thêm `DELETE FROM rate_limits WHERE reset_at < now() - interval '1 day'`.

---

## 5. Settings

Mỗi key có một zod schema trong `lib/validation/settings.ts` và giá trị mặc định trong code. Chuỗi rỗng nghĩa là "chưa có", giao diện tự ẩn phần đó.

| Key | Giá trị mặc định |
|---|---|
| `shop` | `{ name: "Cham.stu", description: "", logoUrl: null, phone: "", zaloPhone: "", email: "", address: "", workingHours: "" }` |
| `social` | `{ facebook: "", messenger: "", instagram: "", tiktok: "", shopee: "https://shopee.vn/cham.stu" }` |
| `announcements` | `["Miễn phí vận chuyển cho đơn từ 3 sản phẩm"]` |
| `policies` | `[{icon:"truck",text:"Freeship đơn từ 3 sản phẩm"},{icon:"refresh",text:"Đổi size trong 7 ngày"},{icon:"wallet",text:"Thanh toán khi nhận hàng"},{icon:"message",text:"Hỗ trợ qua Zalo / Messenger"}]` |
| `returnPolicySummary` | `""` |
| `shipping` | `{ fee: 30000, freeShipMinItems: 3, freeShipMinAmount: null }` |
| `bank` | `{ bankBin: "", bankName: "", accountNo: "", accountName: "" }` |
| `legal` | `{ businessName: "", taxCode: "", businessAddress: "", bctNotificationUrl: "", bctBadgeUrl: "" }` |
| `orders` | `{ codePrefix: "CS", autoCancelUnpaidHours: 48, lowStockThreshold: 3, maxQtyPerLine: 10 }` |
| `seo` | `{ defaultTitle: "Cham.stu", defaultDescription: "", ogImageUrl: null }` |

- `bank.bankBin` là mã BIN của ngân hàng theo VietQR (danh sách ở https://api.vietqr.io/v2/banks).
- `bankTransferEnabled = true` khi đã điền đủ `bankBin`, `accountNo` và `accountName`.
- Các giá trị ship, chính sách, thông báo ở trên chỉ là mặc định để web chạy được. Chủ shop sửa lại trong admin.

---

## 6. Thiết lập Supabase

Ghi các bước này vào README ở Phase 13.

1. Tạo project ở **region Singapore**.
2. Lấy connection string:
   - **Transaction pooler** (cổng 6543) → `DATABASE_URL`;
   - **Session pooler** (cổng 5432) → `DIRECT_URL`.
3. Trong code, client tạo bằng `postgres(DATABASE_URL, { prepare: false })`, vì transaction pooler không hỗ trợ prepared statement.
4. Migration chạy `CREATE EXTENSION IF NOT EXISTS pg_trgm;` và `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` cho **mọi bảng** (không tạo policy).
5. Tạo bucket **public** tên `media`.
6. Lấy `SUPABASE_URL` và `SUPABASE_SERVICE_ROLE_KEY` (chỉ dùng ở server).

---

## 7. Seed (`npm run db:seed [-- --sample]`)

Seed phải **chạy lại được nhiều lần** mà không nhân đôi dữ liệu (upsert theo `slug`, `code`, `key`, `email`).

**Luôn chạy:**
- Tạo các settings còn thiếu bằng giá trị mặc định ở mục 5. Không ghi đè settings đã có.
- Tạo tài khoản admin từ `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD` nếu email đó chưa tồn tại.

**Chỉ chạy khi có `--sample`** (từ chối nếu `NODE_ENV=production`):
- **Danh mục mẫu.** Chủ shop sẽ sửa lại trong admin; danh mục trống tự ẩn khỏi menu.
  - **ÁO** (`ao`): Áo thun (`ao-thun`), Áo sơ mi (`ao-so-mi`), Áo polo (`ao-polo`), Áo khoác / Hoodie (`ao-khoac`)
  - **QUẦN & VÁY** (`quan-vay`): Quần dài (`quan-dai`), Quần short (`quan-short`), Chân váy (`chan-vay`)
  - **PHỤ KIỆN** (`phu-kien`): Túi (`tui`), Mũ (`mu`)
- **2 bảng size** ("Bảng size áo", "Bảng size quần"). Ô số đo để `"—"`, ghi chú "Chủ shop cập nhật số đo thật".
- **12 sản phẩm mẫu:**
  - nằm trong ít nhất 4 danh mục, giá từ 129.000₫ đến 399.000₫, mã `SAMPLE01` … `SAMPLE12`;
  - ≥ 3 sản phẩm sale, ≥ 4 sản phẩm `is_best_seller`, ≥ 4 sản phẩm `is_new`;
  - 1 sản phẩm hết hàng toàn bộ, 2 sản phẩm có biến thể tồn kho 1–3 (sắp hết);
  - mỗi sản phẩm có 1–4 màu và 2–4 size;
  - ảnh dùng `/images/placeholder.svg`.
- **1 bộ sưu tập mẫu** "THU ĐÔNG 2026" (`show_on_home`, `show_in_menu`), gồm 4 sản phẩm.
- **1 banner** dùng ảnh placeholder.
