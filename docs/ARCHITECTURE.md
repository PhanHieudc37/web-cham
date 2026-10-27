# ARCHITECTURE — Kiến trúc Frontend / Backend

## 1. Tổng quan

Toàn bộ FE và BE nằm trong **một ứng dụng Next.js**.

- **FE**:
  - Server Components render HTML ở server.
  - Client Components chỉ dùng cho phần cần tương tác.
- **BE**: tầng `src/server/`.
  - **services**: chứa nghiệp vụ.
  - **Drizzle**: truy cập Postgres.

FE gọi BE theo đúng 3 đường:

1. **Đọc dữ liệu:** Server Component (page/layout) gọi thẳng service.
2. **Ghi dữ liệu:** Client Component gọi **Server Action**.
3. **Route Handler** (`/api/*`), dùng cho 3 trường hợp:
   - client cần lấy dữ liệu theo yêu cầu (quote giỏ hàng, gợi ý tìm kiếm);
   - upload file;
   - dịch vụ bên ngoài gọi vào (webhook, cron).

```
                 ┌─────────────────── Next.js trên Vercel (region sin1) ───────────────────┐
Trình duyệt ───► │ Server Components (page/layout) ──► services ──► Drizzle ───────────────┼──► Postgres (Supabase)
                 │ Client Components ──► Server Actions ──► services                       │
                 │                   └─► fetch /api/cart/quote, /api/search/suggest       │
Admin upload ──► │ /api/admin/upload ──► media.service ────────────────────────────────────┼──► Supabase Storage (ảnh)
Dịch vụ ngoài ─► │ /api/webhooks/*, /api/cron/* ──► services                              │
                 │ services ──► after(): Resend (email), Telegram                          │
                 └─────────────────────────────────────────────────────────────────────────┘
Ảnh hiển thị: next/image ◄── https://<ref>.supabase.co/storage/v1/object/public/media/...
```

---

## 2. Cấu trúc thư mục

```
/
├─ AGENTS.md
├─ docs/
├─ public/images/placeholder.svg
├─ vercel.json                    # { "regions": ["sin1"] }
├─ drizzle.config.ts              # dùng DIRECT_URL, casing snake_case
├─ e2e/                           # Playwright
└─ src/
   ├─ app/
   │  ├─ layout.tsx               # <html lang="vi">, font, <Toaster />
   │  ├─ not-found.tsx, sitemap.ts, robots.ts
   │  ├─ (shop)/
   │  │  ├─ layout.tsx            # AnnouncementBar, Header, Footer, CartDrawer, FloatingContact, CartHydrator
   │  │  ├─ page.tsx              # trang chủ
   │  │  ├─ error.tsx
   │  │  ├─ collections/[slug]/page.tsx (+ loading.tsx)
   │  │  ├─ products/[slug]/page.tsx    (+ loading.tsx)
   │  │  ├─ search/page.tsx
   │  │  ├─ cart/page.tsx
   │  │  ├─ kiem-tra-don-hang/page.tsx
   │  │  └─ gioi-thieu/ lien-he/ huong-dan-chon-size/ chinh-sach-doi-tra/ chinh-sach-bao-mat/ dieu-khoan-dich-vu/
   │  ├─ (checkout)/
   │  │  ├─ layout.tsx            # header rút gọn
   │  │  ├─ checkout/page.tsx
   │  │  └─ checkout/success/page.tsx
   │  ├─ admin/
   │  │  ├─ login/page.tsx
   │  │  └─ (panel)/
   │  │     ├─ layout.tsx         # requireRolePage("staff") + AdminShell
   │  │     ├─ page.tsx           # tổng quan
   │  │     ├─ orders/page.tsx, orders/[id]/page.tsx, orders/[id]/print/page.tsx
   │  │     ├─ products/page.tsx, products/new/page.tsx, products/[id]/page.tsx
   │  │     ├─ categories/page.tsx
   │  │     ├─ collections/page.tsx, collections/[id]/page.tsx
   │  │     ├─ banners/page.tsx
   │  │     ├─ messages/page.tsx
   │  │     ├─ settings/page.tsx  # chỉ admin
   │  │     └─ users/page.tsx     # chỉ admin
   │  └─ api/
   │     ├─ auth/[...all]/route.ts
   │     ├─ cart/quote/route.ts
   │     ├─ search/suggest/route.ts
   │     ├─ admin/upload/route.ts
   │     ├─ admin/orders/export/route.ts
   │     ├─ webhooks/sepay/route.ts      # Phase 14b
   │     └─ cron/cancel-unpaid/route.ts  # Phase 14c
   ├─ server/                     # CHỈ chạy trên server
   │  ├─ env.ts                   # validate env bằng zod
   │  ├─ cache.ts                 # cached(), invalidate(), CACHE_TAGS
   │  ├─ errors.ts                # AppError
   │  ├─ run-action.ts            # runAction()
   │  ├─ request.ts               # getClientIp()
   │  ├─ rate-limit.ts
   │  ├─ db/
   │  │  ├─ client.ts             # postgres(DATABASE_URL, { prepare: false }) + drizzle
   │  │  ├─ schema/               # catalog.ts, orders.ts, content.ts, system.ts, auth.ts, index.ts
   │  │  ├─ migrations/
   │  │  ├─ seed.ts
   │  │  └─ seed-data/
   │  ├─ auth/ auth.ts, guards.ts
   │  ├─ services/
   │  │  ├─ catalog.service.ts    # đọc cho cửa hàng
   │  │  ├─ product.service.ts    # CRUD cho admin
   │  │  ├─ category.service.ts, collection.service.ts, banner.service.ts
   │  │  ├─ cart.service.ts       # quote
   │  │  ├─ order.service.ts, inventory.service.ts
   │  │  ├─ settings.service.ts, contact.service.ts, dashboard.service.ts
   │  │  ├─ media.service.ts      # Supabase Storage
   │  │  └─ notification.service.ts
   │  ├─ emails/                  # order-confirmation.ts, order-shipped.ts, new-order.ts, new-contact.ts, layout.ts
   │  └─ actions/
   │     ├─ shop/  checkout.ts, contact.ts, order-lookup.ts
   │     └─ admin/ products.ts, categories.ts, collections.ts, banners.ts, orders.ts, contacts.ts, settings.ts, users.ts
   ├─ lib/                        # code thuần, dùng được ở cả client và server
   │  ├─ domain/                  # pricing.ts, shipping.ts, order-status.ts, variants.ts, sizes.ts (+ *.test.ts)
   │  ├─ validation/              # common.ts (phone, slug…), checkout.ts, contact.ts, product.ts, category.ts,
   │  │                           # collection.ts, banner.ts, settings.ts, order-admin.ts
   │  ├─ format.ts, normalize.ts, slug.ts, vietqr.ts, provinces.ts, constants.ts
   │  ├─ result.ts                # ActionResult, ErrorCode, ERROR_MESSAGES
   │  ├─ auth-client.ts           # Better Auth client (dùng ở trang login/admin)
   │  ├─ image/resize.ts          # chỉ chạy trên trình duyệt
   │  └─ utils.ts                 # cn()
   ├─ components/
   │  ├─ ui/                      # shadcn: chỉ chỉnh style theo token, không đổi logic
   │  ├─ shop/ layout/ home/ product/ collection/ cart/ checkout/ order/ common/
   │  └─ admin/ shell/ products/ orders/ common/   # common: DataTable, ImageUploader, StatusBadge, ConfirmDialog, PageHeader, EmptyState
   ├─ hooks/                      # use-cart-quote.ts, use-debounce.ts, use-unsaved-changes.ts
   ├─ store/                      # cart.ts, ui.ts (zustand)
   └─ types/dto.ts                # kiểu dữ liệu services trả cho UI
```

---

## 3. Quy tắc phân lớp

| Lớp | Được import | KHÔNG được import |
|---|---|---|
| `app/**` (page, layout) | services, components, lib, types | `server/db` (phải đi qua service) |
| `components/**` (client) | lib, hooks, store, components, types, **server actions** | `server/**` (trừ server actions) |
| `server/actions/**` | services, auth/guards, lib, cache | components |
| `server/services/**` | db, lib, service khác, media/notification | actions, components, `next/navigation` |
| `lib/**` | lib | server, components, store |

- Mọi file trong `src/server/**` có `import "server-only"` ở dòng đầu. **Ngoại lệ:** file action, vì file action bắt đầu bằng `"use server"`.
- Service nhận input **đã validate** và trả về **DTO** (`src/types/dto.ts`), không trả nguyên row của DB. Gặp lỗi nghiệp vụ thì `throw new AppError(code, message, details?)`.
- Service **không** gọi `redirect`, `cookies()`, `invalidate()`. Những việc này thuộc về action hoặc page.
- Thao tác ghi vào nhiều bảng phải nằm trong `db.transaction()`.
- Action **không** gọi `redirect()`. Action trả kết quả, client tự điều hướng khi `ok`.

---

## 4. Server Components và Client Components

Mặc định mọi component là **Server Component**. Chỉ thêm `"use client"` cho component **lá** cần state, effect, sự kiện hoặc API trình duyệt. Client component nhận dữ liệu qua props dạng DTO (serializable).

| Component | Loại | Lý do |
|---|---|---|
| Mọi `page.tsx`, `layout.tsx` | Server | lấy dữ liệu |
| Header (khung, logo, menu desktop), Footer, Breadcrumb, Pagination | Server | chỉ hiển thị / link |
| ProductGrid, ProductCard, PriceTag, CategoryTiles, BrandStory, PolicyStrip, SizeChartTable, JsonLd | Server | hover ảnh làm bằng CSS |
| AnnouncementBar | Client | tự chuyển câu |
| HeaderActions (nút menu, tìm kiếm, giỏ + badge), MobileMenu, MegaMenu, SearchOverlay | Client | trạng thái mở/đóng |
| HeroSlider, ProductGallery | Client | embla |
| ProductPurchasePanel (chọn màu/size, số lượng, nút mua, StickyBuyBar) | Client | trạng thái biến thể |
| FilterPanel, SortSelect | Client | cập nhật URL |
| CartDrawer, CartPageView, CartHydrator | Client | store |
| CheckoutForm, ContactForm, OrderLookupForm, CopyButton, BackToTop | Client | form / tương tác |
| FloatingContact | Server (bọc BackToTop client) | |
| Admin: page/layout | Server | |
| Admin: form, bảng có thao tác, ImageUploader, VariantMatrix | Client | |

---

## 5. Luồng dữ liệu

### 5.1 Đọc (cửa hàng)

```tsx
// src/app/(shop)/products/[slug]/page.tsx
export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductDetail(slug);          // catalog.service, có cache
  if (!product) notFound();
  const related = await getRelatedProducts(product.id, 4);
  return (
    <>
      <ProductGallery images={product.images} />        {/* client */}
      <ProductPurchasePanel product={product} />        {/* client */}
      <ProductGrid products={related} />                 {/* server */}
    </>
  );
}
```

### 5.2 Ghi (Server Action)

```ts
// src/server/run-action.ts
export async function runAction<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (e) {
    if (e instanceof ZodError) return validationError(e);      // fields: { "phone": "Số điện thoại không hợp lệ" }
    if (e instanceof AppError) return { ok: false, error: e.toJSON() };
    console.error("[action]", e);
    return { ok: false, error: { code: "INTERNAL", message: ERROR_MESSAGES.INTERNAL } };
  }
}
```

```ts
// src/server/actions/admin/products.ts
"use server";
export async function updateProductAction(input: unknown) {
  return runAction(async () => {
    const user = await requireRole("staff");
    const data = productInputSchema.parse(input);
    const result = await productService.update(data, user.id);
    invalidate(CACHE_TAGS.products);
    return result;                                        // { id }
  });
}
```

```tsx
// Client: hiển thị lỗi theo từng field hoặc toast
const res = await placeOrderAction(values);
if (!res.ok) {
  if (res.error.fields) {
    for (const [name, message] of Object.entries(res.error.fields)) {
      form.setError(name as keyof CheckoutValues, { message });
    }
  } else {
    toast.error(res.error.message);
  }
  return;
}
router.push(`/checkout/success?code=${res.data.orderCode}&t=${res.data.accessToken}`);
```

### 5.3 Route Handler

Route Handler trả JSON cùng format với `ActionResult`. HTTP status lấy theo bảng mã lỗi ở mục 6.1.

---

## 6. Hợp đồng dữ liệu

### 6.1 `ActionResult` và mã lỗi (`src/lib/result.ts`)

```ts
export type ErrorCode =
  | "VALIDATION_ERROR" | "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND"
  | "OUT_OF_STOCK" | "PRICE_CHANGED" | "INVALID_TRANSITION" | "CONFLICT"
  | "RATE_LIMITED" | "INTERNAL";

export type ActionError = {
  code: ErrorCode;
  message: string;                       // tiếng Việt, hiển thị được cho người dùng
  fields?: Record<string, string>;       // lỗi theo từng ô của form
  details?: unknown;                     // ví dụ: danh sách dòng hết hàng, quote mới
};

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: ActionError };
```

| Mã | HTTP | Thông báo mặc định |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Thông tin chưa hợp lệ, vui lòng kiểm tra lại. |
| `UNAUTHORIZED` | 401 | Vui lòng đăng nhập. |
| `FORBIDDEN` | 403 | Bạn không có quyền thực hiện thao tác này. |
| `NOT_FOUND` | 404 | Không tìm thấy dữ liệu. |
| `OUT_OF_STOCK` | 409 | {Tên sp} ({màu} / {size}) chỉ còn {n} sản phẩm. |
| `PRICE_CHANGED` | 409 | Giá sản phẩm vừa thay đổi, vui lòng kiểm tra lại đơn hàng. |
| `INVALID_TRANSITION` | 409 | Không thể chuyển đơn sang trạng thái này. |
| `CONFLICT` | 409 | Dữ liệu bị trùng (ví dụ: slug, mã sản phẩm). |
| `RATE_LIMITED` | 429 | Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút. |
| `INTERNAL` | 500 | Đã có lỗi xảy ra, vui lòng thử lại hoặc liên hệ shop. |

Thông báo lỗi validate của zod viết tiếng Việt ngay trong schema, ví dụ "Vui lòng nhập họ tên", "Số điện thoại không hợp lệ".

### 6.2 DTO chính (`src/types/dto.ts`)

```ts
export type ImageDTO = { url: string; alt: string };

export type ProductCardDTO = {
  id: string; slug: string; name: string;
  price: number; compareAtPrice: number | null; discountPercent: number | null;
  image: ImageDTO | null; hoverImage: ImageDTO | null;
  colors: { name: string; hex: string }[];
  isNew: boolean; isSoldOut: boolean;
};

export type ProductDetailDTO = ProductCardDTO & {
  code: string;
  description: string; material: string | null; fit: string | null; care: string[];
  category: { name: string; slug: string; parent: { name: string; slug: string } | null };
  images: (ImageDTO & { id: string; colorId: string | null })[];
  colorOptions: { id: string; name: string; code: string; hex: string }[];
  sizes: string[];                               // đã sắp theo thứ tự chuẩn (DATABASE 4.3)
  variants: {
    id: string; colorId: string; size: string; sku: string;
    available: boolean;                          // đang bán và stock > 0
    maxQuantity: number;                         // min(stock, maxQtyPerLine)
    lowStockCount: number | null;                // chỉ có giá trị khi stock <= lowStockThreshold
  }[];
  sizeChart: { name: string; columns: string[]; rows: string[][]; note: string | null } | null;
  seo: { title: string; description: string };
};

export type ListingDTO = {
  title: string; description: string | null; bannerUrl: string | null;
  breadcrumb: { label: string; href: string }[];
  subcategories: { name: string; slug: string }[];
  facets: { sizes: string[]; colors: { code: string; name: string; hex: string }[] };
  products: ProductCardDTO[]; total: number; page: number; totalPages: number;
};

export type CartQuoteDTO = {
  lines: {
    variantId: string; productId: string; slug: string; name: string;
    colorName: string; size: string; image: ImageDTO | null;
    unitPrice: number; compareAtPrice: number | null;
    requestedQuantity: number; quantity: number; maxQuantity: number; lineTotal: number;
    issue: null | "UNAVAILABLE" | "OUT_OF_STOCK" | "QUANTITY_REDUCED";
  }[];
  itemCount: number; subtotal: number; discountAmount: number; shippingFee: number; total: number;
  freeShip: { eligible: boolean; remainingItems: number | null; remainingAmount: number | null };
  discount: null | { code: string; valid: boolean; message: string | null };   // Phase 14a
};
// Dòng có issue UNAVAILABLE/OUT_OF_STOCK không được tính vào tổng.

export type PublicSettingsDTO = {
  shop; social; announcements; policies; returnPolicySummary; shipping; legal; seo;
  bankTransferEnabled: boolean;          // true khi đã nhập đủ thông tin ngân hàng
};                                       // các field lấy từ settings (DATABASE mục 5)
```

DTO cho đơn hàng: `OrderSuccessDTO`, `OrderPublicDTO` (tra cứu, SĐT che bớt dạng `0912***678`), `OrderAdminListItemDTO`, `OrderAdminDetailDTO`.

---

## 7. Danh sách Server Actions và Route Handlers

### 7.1 Server Actions

| Action | File | Quyền | Input → Output | Invalidate |
|---|---|---|---|---|
| `placeOrderAction` | shop/checkout.ts | công khai + rate limit | `CheckoutInput` → `{ orderCode, accessToken }` | products |
| `getPaymentStatusAction` (14b) | shop/checkout.ts | code + token | `{ code, token }` → `{ paymentStatus }` | – |
| `submitContactAction` | shop/contact.ts | công khai + rate limit | `ContactInput` → `null` | – |
| `lookupOrderAction` | shop/order-lookup.ts | công khai + rate limit | `{ code, phone }` → `OrderPublicDTO` | – |
| `createProductAction`, `updateProductAction`, `archiveProductAction`, `duplicateProductAction` | admin/products.ts | staff | `ProductInput` → `{ id }` | products |
| `create/update/delete/reorderCategoryAction` | admin/categories.ts | staff | | categories, products |
| `create/update/deleteCollectionAction` | admin/collections.ts | staff | | collections |
| `create/update/delete/reorderBannerAction` | admin/banners.ts | staff | | banners |
| `updateOrderStatusAction` | admin/orders.ts | staff | `{ orderId, toStatus, reason? }` → `OrderAdminDetailDTO` | products |
| `markOrderPaidAction`, `markOrderRefundedAction` | admin/orders.ts | staff | `{ orderId }` | – |
| `updateShippingAction` | admin/orders.ts | staff | `{ orderId, carrier, trackingCode }` | – |
| `addOrderNoteAction` | admin/orders.ts | staff | `{ orderId, message }` | – |
| `markContactHandledAction` | admin/contacts.ts | staff | `{ id }` | – |
| `updateSettingsAction` | admin/settings.ts | **admin** | `{ key, value }` | settings |
| `createAdminUserAction`, `setUserRoleAction`, `setUserBannedAction` | admin/users.ts | **admin** | | – |

### 7.2 Route Handlers

| Route | Method | Quyền | Mô tả |
|---|---|---|---|
| `/api/auth/[...all]` | GET, POST | – | Better Auth |
| `/api/cart/quote` | POST | công khai, 60 lần/phút/IP | `{ lines: {variantId, quantity}[], discountCode? }` → `CartQuoteDTO`. Không cache |
| `/api/search/suggest?q=` | GET | công khai, 60 lần/phút/IP | Trả tối đa 6 `ProductCardDTO`. `Cache-Control: public, s-maxage=60` |
| `/api/admin/upload` | POST multipart | staff | `file`, `folder` → `{ url, path }` |
| `/api/admin/orders/export` | GET | **admin** | CSV theo bộ lọc của danh sách đơn |
| `/api/webhooks/sepay` (14b) | POST | header API key | Ghi giao dịch, khớp đơn |
| `/api/cron/cancel-unpaid` (14c) | GET | `Authorization: Bearer CRON_SECRET` | Hủy đơn quá hạn |

---

## 8. Cache

- Mọi hàm đọc của `catalog.service` và `settings.service` được bọc bằng `cached(fn, keyParts, tags)` trong `src/server/cache.ts`.
- Mỗi thao tác ghi gọi `invalidate(...tags)`.
- File `cache.ts` dùng cơ chế cache của **đúng bản Next.js đang cài** (`unstable_cache` hoặc `"use cache"` + `cacheTag`, đọc docs của bản đó). Nhờ gói gọn ở một chỗ, sau này đổi cơ chế cache chỉ phải sửa một file.

| Tag | Dữ liệu | Invalidate khi |
|---|---|---|
| `products` | danh sách, chi tiết, tìm kiếm, sitemap | lưu / lưu trữ sản phẩm; đặt đơn; hủy hoặc hoàn đơn (tồn kho và sold_count thay đổi) |
| `categories` | menu, danh mục | sửa danh mục |
| `collections` | bộ sưu tập | sửa bộ sưu tập |
| `banners` | banner trang chủ | sửa banner |
| `settings` | cài đặt công khai | lưu cài đặt |

**Không cache:** `/api/cart/quote`, checkout, trang đặt hàng thành công, tra cứu đơn, toàn bộ admin. Tính đúng của giá và tồn kho khi đặt hàng **không phụ thuộc vào cache**, vì quote và `placeOrder` luôn đọc trực tiếp từ DB.

---

## 9. Đăng nhập và phân quyền

- **Cấu hình Better Auth** (`src/server/auth/auth.ts`):
  - Drizzle adapter (provider `pg`).
  - `emailAndPassword` bật, mật khẩu tối thiểu 8 ký tự.
  - **Tắt đăng ký công khai** cho tới Phase 14d.
  - Plugin `admin` (role, khóa tài khoản), plugin `nextCookies` (để Server Action set được cookie).
  - Bật rate limit có sẵn của Better Auth.
  - Route: `src/app/api/auth/[...all]/route.ts`.
- **Role:** `user` (khách) < `staff` < `admin`.

  | Chức năng | staff | admin |
  |---|---|---|
  | Tổng quan (số đơn, đơn cần xử lý, sắp hết hàng) | ✓ | ✓ |
  | Doanh thu, xuất CSV | – | ✓ |
  | Đơn hàng: xem, đổi trạng thái, thanh toán, vận đơn, in phiếu | ✓ | ✓ |
  | Sản phẩm, danh mục, bộ sưu tập, banner, tin nhắn | ✓ | ✓ |
  | Cài đặt shop, tài khoản quản trị | – | ✓ |

- **Guard** (`src/server/auth/guards.ts`):
  - `getSessionUser()`.
  - `requireRole(min)`: dùng trong action và route. Không có session thì ném `UNAUTHORIZED`; không đủ quyền thì ném `FORBIDDEN`.
  - `requireRolePage(min)`: dùng trong page và layout. Thay vì ném lỗi thì `redirect("/admin/login")` hoặc hiện trang 403.
- `middleware`/`proxy` (tên tùy phiên bản Next) chỉ chuyển hướng sơ bộ khi không có cookie phiên. **Đây không phải lớp bảo mật.** Mọi action và page admin vẫn phải tự gọi guard.
- **Tài khoản admin đầu tiên** do seed tạo từ `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD`, theo cách tạo user ở server mà Better Auth hỗ trợ (đọc docs của bản đang cài).

---

## 10. Giỏ hàng

- **Store** (`src/store/cart.ts`, zustand + persist):
  - Key `cham-cart-v1`, có `version` để migrate cấu trúc sau này.
  - State: `{ lines: { variantId, quantity }[], note, discountCode }`.
  - Action: `add(variantId, qty, maxQuantity)`, `setQuantity`, `remove`, `clear`, `setNote`, `setDiscountCode`.
  - Dùng `skipHydration`. Component `CartHydrator` (đặt trong layout shop) gọi rehydrate, sau đó đặt `hasHydrated = true`.
  - Badge giỏ và giỏ hàng chỉ render sau khi đã hydrate.
- **Giới hạn:** tối đa 20 dòng; mỗi dòng không vượt `min(maxQuantity, maxQtyPerLine)`. Thêm biến thể đã có trong giỏ thì cộng dồn số lượng.
- **Store chỉ lưu `variantId` + số lượng.** Tên, giá, ảnh luôn lấy từ `POST /api/cart/quote` qua hook `useCartQuote()`. Hook gọi quote khi:
  - dòng hàng hoặc mã giảm giá thay đổi (debounce 300ms);
  - mở drawer;
  - vào trang `/cart` hoặc `/checkout`.

  Hook giữ lại quote gần nhất để giao diện không bị nháy.
- **Xử lý dòng có `issue`:**
  - `QUANTITY_REDUCED`: tự cập nhật số lượng trong store và hiện "Chỉ còn N sản phẩm".
  - `OUT_OF_STOCK` / `UNAVAILABLE`: hiện cảnh báo kèm nút xóa. Không cho thanh toán khi còn dòng loại này.
- **Checkout** gửi `lines` + `expectedTotal` (= `quote.total`) + `idempotencyKey`:
  - `idempotencyKey` là `crypto.randomUUID()`, sinh khi vào trang checkout và giữ trong `sessionStorage` cho tới khi đặt hàng thành công.
- **Store UI** (`src/store/ui.ts`, không persist): `cartOpen`, `menuOpen`, `searchOpen`.

---

## 11. Ảnh và upload

- **Lưu trữ:** bucket `media` cho phép đọc công khai; chỉ server ghi được (dùng service role key).
  - Đường dẫn: `{folder}/{yyyy}/{mm}/{uuid}.{ext}`.
  - `folder` thuộc một trong: `products`, `banners`, `categories`, `settings`.
- **Resize trên trình duyệt trước khi upload** (`src/lib/image/resize.ts`):
  - `square`: 1200×1200, `contain`, nền `#FFFFFF`, không cắt ảnh. Dùng cho ảnh sản phẩm (khung vuông kiểu Shopee).
  - `fit`: giữ tỉ lệ, cạnh dài tối đa 1920px. Dùng cho banner, logo, ảnh danh mục.
  - Xuất WebP chất lượng 0.85. Trình duyệt không xuất được WebP thì dùng JPEG 0.85.
  - Mục đích: file luôn nhỏ hơn 1MB, không chạm giới hạn body 4.5MB của Vercel.
- **`/api/admin/upload`:**
  - Yêu cầu quyền staff.
  - Chỉ nhận MIME `image/webp|jpeg|png`, dung lượng ≤ 2MB.
  - Tên file do server sinh.
  - Trả `{ url, path }`.
- **DB lưu cả `url` và `storage_path`.** Gỡ ảnh khỏi sản phẩm thì xóa file trên storage **sau khi** transaction DB đã commit (best effort, lỗi thì chỉ log).
- **`next/image`:**
  - `remotePatterns` lấy host từ `SUPABASE_URL`, `pathname: /storage/v1/object/public/**`.
  - Luôn có `sizes`.
  - Ảnh lỗi hoặc thiếu thì dùng `/images/placeholder.svg`.

---

## 12. Email và thông báo

- File: `src/server/services/notification.service.ts`. Template nằm trong `src/server/emails/*.ts`, mỗi template trả `{ subject, html, text }`. HTML dùng CSS inline, đọc tốt trên điện thoại, viết tiếng Việt.

  | Template | Gửi tới | Khi nào |
  |---|---|---|
  | `order-confirmation` | khách (nếu có email) | đặt đơn thành công |
  | `new-order` | `SHOP_NOTIFY_EMAIL` (+ Telegram) | đặt đơn thành công |
  | `order-shipped` | khách (nếu có email) | đơn chuyển "Đang giao", kèm hãng vận chuyển và mã vận đơn |
  | `new-contact` | `SHOP_NOTIFY_EMAIL` | có tin nhắn liên hệ |

- Gửi bên trong `after()` (`next/server`) để không làm chậm phản hồi cho khách. Gửi lỗi thì log kèm mã đơn, **không** làm hỏng đơn.
- Ở dev chưa có `RESEND_API_KEY` thì in nội dung email ra console.
- Có `TELEGRAM_BOT_TOKEN` và `TELEGRAM_CHAT_ID` thì gửi thêm tin Telegram cho shop, gồm: mã đơn, tổng tiền, phương thức thanh toán, link `/admin/orders/{id}`.

---

## 13. Bảo mật

1. Server Action và Route Handler là endpoint công khai. Luôn validate và kiểm tra quyền **bên trong** chúng.
2. **Secret chỉ ở server:**
   - Biến public duy nhất là `NEXT_PUBLIC_SITE_URL`.
   - Không dùng Supabase anon key ở bất kỳ đâu.
3. **Supabase:** bật RLS cho **mọi bảng** và không tạo policy nào. Nhờ vậy Data API của Supabase không đọc được gì; app vẫn truy cập DB bình thường qua connection string.
4. **Rate limit** (bảng `rate_limits`, DATABASE 4.14):

   | Hành động | Giới hạn mỗi IP |
   |---|---|
   | Đặt đơn | 5 lần / 10 phút |
   | Gửi liên hệ | 3 lần / 10 phút |
   | Tra cứu đơn | 10 lần / 10 phút |
   | Quote giỏ hàng | 60 lần / phút |
   | Gợi ý tìm kiếm | 60 lần / phút |

   Đăng nhập dùng rate limit có sẵn của Better Auth. IP lấy giá trị đầu tiên của header `x-forwarded-for`.
5. **Honeypot:** form công khai có ô ẩn `website`. Ô này có giá trị thì trả về thành công giả và không ghi gì vào DB.
6. **Access token của đơn:**
   - 32 byte ngẫu nhiên, mã hóa base64url.
   - DB chỉ lưu SHA-256 của token.
   - So sánh bằng `timingSafeEqual`.
7. **Upload:** chỉ staff được upload; kiểm tra MIME và dung lượng; tên file do server sinh.
8. **Header** (khai báo trong `next.config`):
   - `X-Content-Type-Options: nosniff`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `X-Frame-Options: DENY`
   - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
9. **`noindex`** cho `/admin/*`, `/checkout*`, `/kiem-tra-don-hang`.
10. **Log:** chỉ ghi mã đơn / id. **Không** ghi tên, SĐT, địa chỉ, email của khách.
11. **Webhook:**
    - Xác thực bằng API key.
    - Idempotent theo id giao dịch của bên gửi (nhận trùng thì không xử lý lại).
12. **Không xóa cứng** sản phẩm (dùng `archived`) và đơn hàng (dùng `cancelled`).

---

## 14. Biến môi trường

Toàn bộ được validate trong `src/server/env.ts`. Ở production thiếu biến bắt buộc thì app phải lỗi ngay khi khởi động.

| Biến | Bắt buộc | Mô tả |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | ✓ | URL web, ví dụ `https://chamstu.vn` |
| `DATABASE_URL` | ✓ | Supabase **Transaction pooler** (cổng 6543), dùng khi app chạy. Client khởi tạo với `prepare: false` |
| `DIRECT_URL` | ✓ (migrate) | Supabase **Session pooler** (cổng 5432), dùng cho drizzle-kit. Mạng gia đình thường chỉ có IPv4 nên không dùng direct connection |
| `TEST_DATABASE_URL` | – | Postgres riêng cho test. Thiếu thì bỏ qua integration test |
| `SUPABASE_URL` | ✓ | `https://<ref>.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | ✓ | Chỉ dùng ở server, để upload ảnh |
| `SUPABASE_STORAGE_BUCKET` | ✓ | `media` |
| `BETTER_AUTH_SECRET` | ✓ | Chuỗi ngẫu nhiên ≥ 32 ký tự |
| `BETTER_AUTH_URL` | ✓ | Bằng `NEXT_PUBLIC_SITE_URL` |
| `RESEND_API_KEY` | prod | Ở dev có thể bỏ trống (email sẽ in ra console) |
| `EMAIL_FROM` | prod | Ví dụ `Cham.stu <donhang@chamstu.vn>` (domain đã xác minh trên Resend) |
| `SHOP_NOTIFY_EMAIL` | prod | Email nhận thông báo đơn mới |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | – | Báo đơn mới qua Telegram |
| `ADMIN_SEED_EMAIL`, `ADMIN_SEED_PASSWORD` | seed | Tài khoản admin đầu tiên |
| `SEPAY_WEBHOOK_API_KEY` | 14b | |
| `CRON_SECRET` | 14c | |

---

## 15. Test

- **Unit** (vitest):
  - `lib/domain/*`, `format`, `normalize`, `slug`, `vietqr`;
  - các schema validation (SĐT, checkout).
- **Integration** (vitest, `TEST_DATABASE_URL`):
  - Database test là Postgres riêng: Docker `postgres:16` hoặc một DB miễn phí khác. **Không dùng DB dev hay prod**, vì test sẽ xóa dữ liệu.
  - `beforeAll` chạy migrate; `beforeEach` truncate rồi seed dữ liệu cố định cho test.
  - Bắt buộc có các ca: đặt đơn trừ kho; 2 đơn cùng lúc tranh sản phẩm cuối; idempotency; `PRICE_CHANGED`; hủy đơn hoàn kho; hoàn trả hoàn kho; chuyển trạng thái sai; sửa tồn kho theo delta khi đồng thời có đơn mới.
- **E2E** (Playwright, chạy `npm run build && npm start` với DB test):
  1. Khách: trang chủ → danh mục → sản phẩm → chọn màu/size → thêm vào giỏ → checkout COD → trang thành công có mã đơn.
  2. Chuyển khoản: trang thành công có ảnh QR, đúng số tiền và đúng nội dung chuyển khoản.
  3. Admin: đăng nhập → mở đơn → Xác nhận → Đang giao (nhập mã vận đơn) → Hoàn thành; kiểm tra tồn kho đúng.
  4. Tra cứu đơn bằng mã đơn + SĐT.
- Mỗi lần sửa bug ở phần logic phải kèm một test tái hiện bug đó.

---

## 16. Quy ước code

- **Tên file:** component dùng `PascalCase.tsx`; còn lại dùng `kebab-case.ts`; service đặt tên `xxx.service.ts`.
- **Export:** dùng named export. Chỉ dùng default export cho các file đặc biệt của Next (page, layout, route, loading, error, not-found, sitemap, robots).
- **Import:** dùng alias `@/`.
- **Đặt tên trong DB:** DB dùng snake_case (Drizzle `casing: "snake_case"`), code TS dùng camelCase.
- **Thời gian:**
  - Lưu dạng `timestamptz` (UTC).
  - Hiển thị theo `Asia/Ho_Chi_Minh` qua `formatDateTime()`.
  - "Hôm nay" và "7 ngày" tính theo giờ Việt Nam.
- **Nhãn tiếng Việt** của enum (trạng thái đơn, thanh toán…) và các giới hạn cố định đặt trong `src/lib/constants.ts`. Không để số "magic" rải rác trong code.
- **Component:** dài quá khoảng 200 dòng thì tách nhỏ.
- **Comment:** chỉ viết khi cần giải thích *tại sao* làm vậy.
