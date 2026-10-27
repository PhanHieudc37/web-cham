# STOREFRONT — Giao diện cửa hàng

- Mọi dữ liệu lấy từ services (`ARCHITECTURE.md` mục 5).
- Thông tin shop lấy từ `getPublicSettings()`. Trường nào rỗng thì **ẩn** phần hiển thị tương ứng: không hiện nút, link hay dòng chữ trống.
- Phong cách: **tối giản, kiểu streetwear**. Nền trắng, chữ đen, tiêu đề in hoa giãn chữ, góc vuông, nhiều khoảng trắng; ảnh sản phẩm là thứ nổi bật nhất.

---

## 1. Design system

### 1.1 Màu

Khai báo bằng `@theme` trong `globals.css`. Đồng thời map các biến của shadcn (`--background`, `--foreground`, `--primary`, `--border`, `--radius: 0`…) sang các token này.

| Token | Giá trị | Dùng cho |
|---|---|---|
| `--color-bg` | `#FFFFFF` | Nền trang |
| `--color-fg` | `#111111` | Chữ chính, nút chính, announcement bar, footer |
| `--color-muted` | `#6B6B6B` | Chữ phụ, giá gạch ngang |
| `--color-border` | `#E6E6E6` | Viền, đường kẻ |
| `--color-surface` | `#F5F3F0` | Nền section phụ |
| `--color-image-bg` | `#F2F2F2` | Nền khung ảnh |
| `--color-sale` | `#D0021B` | Giá sale, badge giảm giá, menu SALE, lỗi |
| `--color-success` | `#1E7F4F` | Thông báo thành công, "Còn hàng" |

### 1.2 Chữ

- Font: Be Vietnam Pro (400/500/600/700, subsets `latin` + `vietnamese`).
- Tiêu đề section: 20px (mobile) / 24px (desktop), weight 700, `uppercase`, `tracking-[0.08em]`, căn giữa.
- Menu: 13–14px, weight 600, uppercase, `tracking-[0.06em]`.
- Tên sản phẩm trên card: 13–14px, weight 500, uppercase, tối đa 2 dòng (`line-clamp-2`).
- Chữ thường: 14–15px, line-height 1.6.

### 1.3 Bố cục

- `Container`: `max-w-[1280px] mx-auto px-4 md:px-6`.
- Khoảng cách giữa các section: 48px (mobile) / 72px (desktop).
- Lưới sản phẩm:
  - **2 cột** khi màn hình < 768px;
  - **3 cột** khi 768–1023px;
  - **4 cột** khi ≥ 1024px;
  - khoảng cách giữa các ô (gap): 12px (mobile) / 20px (desktop).
- Nút: góc vuông, cao 48px, chữ in hoa weight 600.
  - **Primary:** nền đen, chữ trắng; hover thì đảo màu.
  - **Secondary:** viền đen, nền trắng; hover thì nền đen.
  - **Disabled:** opacity 40%.
- Hiệu ứng chuyển cảnh 200–300ms `ease-out`. Khi người dùng bật `prefers-reduced-motion`: tắt autoplay và tắt animation.
- Mọi phần tử bấm được đều có viền focus rõ ràng (`focus-visible`).

### 1.4 Thành phần dùng chung

**ProductCard**
- Cả card là một link tới `/products/{slug}`.
- **Khung ảnh:**
  - `aspect-square` (vuông như ảnh Shopee), nền `--color-image-bg`.
  - Nếu có `hoverImage`: ảnh thứ hai chồng lên ảnh chính, `opacity 0 → 1` khi hover. Chỉ áp dụng khi thiết bị có chuột (`@media (hover: hover)`), transition 300ms.
  - `sizes="(min-width:1024px) 25vw, (min-width:768px) 33vw, 50vw"`.
- **Badge** ở góc trên bên trái:
  - `-35%` (nền đỏ sale, chữ trắng) khi đang sale;
  - `NEW` (nền đen) khi `isNew`;
  - có cả hai thì xếp dọc.
- **Hết hàng:** phủ lớp trắng 50% lên ảnh, chữ "HẾT HÀNG" ở giữa.
- **Dưới ảnh:** tên sản phẩm, `PriceTag`, các chấm màu (tối đa 5; nhiều hơn thì hiện "+n").

**PriceTag**
- Định dạng giá: `formatPrice(139000)` → `139.000₫`.
- Đang sale: giá bán màu `--color-sale` đậm, giá gốc màu muted gạch ngang.

**SectionTitle**
- Tiêu đề in hoa căn giữa.
- Có thể kèm link "XEM TẤT CẢ" nằm dưới lưới sản phẩm.

---

## 2. Layout chung (`(shop)/layout.tsx`)

### 2.1 Announcement bar

- Cao 36px, nền `--color-fg`, chữ trắng 12–13px, căn giữa.
- Nội dung lấy từ `settings.announcements`. Có từ 2 câu trở lên thì tự chuyển câu mỗi 4 giây (fade).
- Danh sách rỗng thì ẩn cả thanh.

### 2.2 Header (dính trên cùng khi cuộn)

- Cao 64px (mobile) / 72px (desktop), nền trắng. Cuộn xuống quá 10px thì thêm viền dưới.
- **Desktop (≥ 1024px):**
  - trái: logo (`shop.logoUrl`, chưa có thì hiện chữ "CHAM.STU");
  - giữa: menu;
  - phải: icon Tìm kiếm và icon Giỏ hàng (có badge số lượng).
- **Mobile:**
  - trái: icon menu (hamburger);
  - giữa: logo;
  - phải: icon Tìm kiếm và icon Giỏ hàng.
- Badge giỏ hàng: chấm tròn đen, chữ trắng 10px, hiện tổng số sản phẩm. Chỉ render sau khi giỏ đã hydrate.

### 2.3 Menu

Thứ tự:

```
HOME · NEW ARRIVAL · SHOP ▾ · [bộ sưu tập có show_in_menu] · BEST SELLER · SALE · ABOUT · CHECK ORDER
```

- `SALE` có màu `--color-sale`, tự ẩn khi không có sản phẩm nào đang sale.
- **Mega menu SHOP (desktop):**
  - Mở khi hover hoặc focus vào SHOP. Panel rộng hết màn hình, nằm ngay dưới header.
  - Mỗi danh mục cha là một cột: tiêu đề in đậm, bên dưới là danh sách danh mục con.
  - Cột cuối là ảnh của bộ sưu tập đầu tiên có `show_on_home`, link tới bộ sưu tập đó.
  - Có link "Xem tất cả sản phẩm" tới `/collections/all`.
  - Đóng khi rời chuột (trễ 150ms) hoặc bấm Esc. Dùng được bằng bàn phím.
- **Menu mobile:** `Sheet` của shadcn, trượt từ trái, rộng 85% (tối đa 360px).
  - SHOP mở dạng accordion: danh mục cha, bên dưới là danh mục con.
  - Cuối menu có khối "Bạn cần hỗ trợ?": SĐT (`tel:`), email, icon mạng xã hội.
  - Overlay tối 40%, khóa cuộn trang, đóng bằng nút X, phím Esc hoặc bấm overlay.

### 2.4 Tìm kiếm (SearchOverlay)

- Bấm icon kính lúp thì mở panel phủ ngay dưới header. Ô input tự focus, placeholder "Tìm kiếm sản phẩm...".
- Gõ từ 2 ký tự trở lên: gọi `GET /api/search/suggest` (debounce 200ms), hiện tối đa 6 kết quả (ảnh nhỏ, tên, giá).
- Enter: chuyển tới `/search?q=...`. Esc: đóng panel.

### 2.5 Footer

- Nền `--color-fg`, chữ trắng, padding dọc 56px.
- 4 cột trên desktop, xếp chồng trên mobile:
  1. **Logo + giới thiệu ngắn** (`shop.description`) + icon Facebook / Instagram / TikTok / Shopee. Chỉ hiện icon có link.
  2. **Thông tin liên hệ:** địa chỉ, SĐT, email, giờ làm việc.
  3. **Chính sách:** Đổi trả, Bảo mật, Điều khoản dịch vụ, Hướng dẫn chọn size, Kiểm tra đơn hàng.
  4. **Về Cham.stu:** Giới thiệu, Liên hệ, Tìm kiếm.
- **Khối pháp lý** (chỉ hiện các dòng đã có dữ liệu):
  - tên chủ thể kinh doanh, MST, địa chỉ;
  - logo Bộ Công Thương (`bctBadgeUrl`) link tới `bctNotificationUrl`.
- **Dòng cuối:**
  - trái: `© {năm hiện tại} Cham.stu. All rights reserved.`;
  - phải: "Thanh toán: COD · Chuyển khoản". Bỏ chữ "Chuyển khoản" khi chưa bật chuyển khoản.

### 2.6 Nút liên hệ nổi và nút về đầu trang

- Ở góc dưới bên phải, xếp dọc, mỗi nút tròn 48px:
  - **Zalo:** `https://zalo.me/{zaloPhone}`;
  - **Messenger:** link `social.messenger`;
  - **Gọi:** `tel:{phone}`.

  Thiếu thông tin nào thì ẩn nút đó.
- Nút **về đầu trang** hiện khi cuộn quá 600px.
- Trên trang sản phẩm ở mobile, nhóm nút này đẩy lên trên để không đè lên `StickyBuyBar`.

---

## 3. Trang chủ `/`

Thứ tự các section:

1. **HeroSlider** (banner `is_active`, đang trong khoảng `starts_at`–`ends_at`, xếp theo `sort_order`):
   - Ảnh desktop tỉ lệ 1920×800, ảnh mobile tỉ lệ 4:5. Dùng `getImageProps` để đổi ảnh theo màn hình (`<picture>`).
   - Nút CTA (`cta_label`) kiểu primary, ở góc dưới bên trái.
   - Tự chuyển mỗi 5 giây; có dots; desktop có thêm mũi tên; mobile vuốt được.
   - Chỉ có 1 banner thì ẩn dots và mũi tên.
   - Ảnh đầu tiên đặt `priority`.
2. **CategoryTiles:**
   - Các danh mục cha đang hiện (tối đa 3) + 1 ô SALE (nếu có sản phẩm sale).
   - Lưới 2 cột (mobile) / 4 cột (desktop), ảnh tỉ lệ 3:4.
   - Tên in hoa đè lên ảnh ở góc dưới, có gradient tối phía sau. Hover thì ảnh phóng nhẹ `scale 1.04`.
3. **BEST SELLER:** 8 sản phẩm + nút secondary "XEM TẤT CẢ" → `/collections/best-seller`.
4. **NEW ARRIVAL:** 8 sản phẩm + nút → `/collections/new-arrival`.
5. **Bộ sưu tập có `show_on_home`:** mỗi bộ là một section (tiêu đề = tên bộ sưu tập), 8 sản phẩm + nút xem tất cả.
6. **SALE:** chỉ hiện khi có sản phẩm sale; 4 sản phẩm + nút → `/collections/sale`.
7. **BrandStory:**
   - Nền `--color-surface`, 2 cột (ảnh tỉ lệ 4:5 | khối chữ); mobile xếp chồng.
   - Khối chữ gồm tiêu đề "CHAM.STU", đoạn `shop.description`, nút "VỀ CHÚNG TÔI" và nút "INSTAGRAM" (chỉ hiện nếu có link).
8. **PolicyStrip:** các mục trong `settings.policies`, mỗi mục gồm icon lucide và chữ. Lưới 2 cột (mobile) / 4 cột (desktop).

Section nào không có dữ liệu thì không render.

---

## 4. Trang danh mục / bộ sưu tập `/collections/[slug]`

- **Thứ tự tìm slug:**
  1. collection tự động (`all`, `new-arrival`, `best-seller`, `sale`);
  2. danh mục;
  3. bộ sưu tập thủ công.

  Không khớp cái nào thì trả 404. Danh mục cha hiển thị sản phẩm của tất cả danh mục con.
- **Breadcrumb:** Trang chủ / {Danh mục cha} / {Tên}.
- **Tiêu đề:** h1 in hoa căn giữa, kèm dòng "24 sản phẩm". Có `bannerUrl` thì hiện ảnh banner phía trên tiêu đề.
- Danh mục cha có hàng **chip danh mục con** (trên mobile cuộn ngang được).
- **Thanh công cụ:**
  - trái: nút "BỘ LỌC". Trên mobile mở `Sheet` từ trái; trên desktop là sidebar cố định rộng 240px bên trái lưới.
  - phải: "Sắp xếp theo:" kèm `Select`.
- **Bộ lọc.** Lấy giá trị từ `facets`: chỉ hiện những giá trị có trong sản phẩm của trang đang xem.

  | Nhóm lọc | Kiểu chọn | Giá trị |
  |---|---|---|
  | Kích thước | chip, chọn nhiều | |
  | Màu sắc | chấm màu + tên, chọn nhiều | |
  | Khoảng giá | chọn 1 | Dưới 200.000₫ · 200.000₫ – 400.000₫ · Trên 400.000₫ |
  | Tình trạng | checkbox | Chỉ hiện sản phẩm còn hàng |

  Có nút "Xóa bộ lọc".
- **Sắp xếp** (giá trị `sort` trên URL):

  | Nhãn | `sort` |
  |---|---|
  | Nổi bật | `featured` |
  | Mới nhất | `newest` |
  | Bán chạy nhất | `best` |
  | Giá: Tăng dần | `price-asc` |
  | Giá: Giảm dần | `price-desc` |
  | Tên: A-Z | `name-asc` |
  | Tên: Z-A | `name-desc` |

  Sắp theo tên thì dùng `slug`, vì slug không dấu.
- **State nằm trên URL**, ví dụ: `?size=M,L&color=den,trang&price=200-400&instock=1&sort=price-asc&page=2`.
  - Đổi bộ lọc hoặc cách sắp xếp thì quay về `page=1`.
  - Giá trị không hợp lệ trên URL thì bỏ qua, không báo lỗi.
- **Phân trang:** 12 sản phẩm mỗi trang, có số trang và nút ‹ ›. Đổi trang thì cuộn lên đầu lưới.
- **Không có kết quả:** hiện "Không tìm thấy sản phẩm phù hợp" kèm nút "Xóa bộ lọc".
- Lọc, sắp xếp và phân trang chạy **trong SQL** (`catalog.service.getListing`), không lọc trên client.

---

## 5. Tìm kiếm `/search?q=`

- Đầu trang là ô tìm kiếm lớn, điền sẵn `q`.
- Dòng tiêu đề kết quả: `Có 5 kết quả cho “áo”`. Dùng lưới sản phẩm chuẩn, có phân trang.
- Không có kết quả thì hiện "Không tìm thấy sản phẩm nào", kèm 4 sản phẩm BEST SELLER gợi ý.

---

## 6. Trang sản phẩm `/products/[slug]`

- **Breadcrumb:** Trang chủ / {Danh mục} / {Tên sản phẩm}.
- **Bố cục desktop:** 2 cột. Gallery chiếm khoảng 58%, cột thông tin khoảng 42% và dính khi cuộn (`sticky top-[96px]`).
- **ProductGallery:**
  - Desktop: ảnh chính 1:1 bên phải, cột thumbnail dọc 72px bên trái; bấm thumbnail thì đổi ảnh chính.
  - Mobile: slider vuốt (embla) có dots, bên dưới là hàng thumbnail.
  - Chọn một màu có ảnh gán cho màu đó thì gallery nhảy tới ảnh đầu tiên của màu ấy.
- **ProductPurchasePanel** (client component), theo thứ tự:
  1. Tên sản phẩm (h1, in hoa, 20–24px).
  2. SKU của biến thể đang chọn (chữ nhỏ, màu muted).
  3. `PriceTag` + badge giảm giá.
  4. **Màu sắc: {tên màu}**: swatch tròn 32px; swatch đang chọn có viền đen 2px.
  5. **Kích thước: {size}**:
     - nút vuông 44px;
     - size không còn hàng với màu đang chọn thì làm mờ, gạch chéo, không bấm được;
     - cạnh nhãn có link "Hướng dẫn chọn size", bấm vào mở `Dialog` chứa bảng size.
  6. **Tình trạng:**
     - "Còn hàng" (màu success);
     - "Chỉ còn {n} sản phẩm" khi có `lowStockCount`;
     - "Hết hàng".
  7. **Số lượng:** nút − [n] +, giới hạn từ 1 đến `maxQuantity`.
  8. Hai nút rộng hết khung:
     - **"THÊM VÀO GIỎ"** (secondary): thêm vào giỏ rồi mở CartDrawer.
     - **"MUA NGAY"** (primary): thêm vào giỏ rồi chuyển tới `/checkout`.
     - Chưa chọn đủ màu và size: hiện dòng đỏ "Vui lòng chọn màu sắc và kích thước".
     - Mọi biến thể hết hàng: thay cả hai nút bằng một nút disabled "HẾT HÀNG".
  9. Danh sách cam kết ngắn, mỗi dòng có icon (lấy từ `settings.policies`).
  10. **Accordion:**
      - "MÔ TẢ SẢN PHẨM" (mở sẵn);
      - "CHẤT LIỆU & BẢO QUẢN";
      - "BẢNG SIZE";
      - "CHÍNH SÁCH ĐỔI TRẢ" (lấy từ `returnPolicySummary`, kèm link trang chính sách).
- Mặc định chọn sẵn màu đầu tiên còn hàng. **Không** chọn sẵn size.
- **StickyBuyBar** (chỉ trên mobile): khi 2 nút mua đã cuộn khỏi màn hình (theo dõi bằng IntersectionObserver), hiện một thanh dính ở đáy gồm ảnh nhỏ, giá và nút "THÊM VÀO GIỎ". Bấm khi chưa chọn size thì cuộn lên khu chọn size.
- **SẢN PHẨM LIÊN QUAN:** 4 sản phẩm cùng danh mục, thiếu thì lấy thêm từ danh mục cha; không gồm sản phẩm đang xem.
- Sản phẩm không tồn tại, hoặc đang `draft` / `archived`: trả 404.

---

## 7. Giỏ hàng

Giỏ dùng dữ liệu từ `useCartQuote()` (`ARCHITECTURE.md` mục 10).

### 7.1 CartDrawer

- `Sheet` trượt từ phải, rộng 100% trên mobile, 420px trên desktop.
- **Đầu drawer:** "GIỎ HÀNG ({số lượng})" và nút X.
- **FreeShipProgress:**
  - Chưa đủ: "Mua thêm **1** sản phẩm để được miễn phí vận chuyển" hoặc "Mua thêm **120.000₫** để được miễn phí vận chuyển", kèm thanh tiến độ.
  - Đã đủ: "Bạn đã được miễn phí vận chuyển".
- **Mỗi dòng sản phẩm:**
  - ảnh 80px, tên (là link), "Màu / Size";
  - nút tăng/giảm số lượng, giá của dòng, nút "Xóa";
  - nếu dòng có `issue` thì hiện cảnh báo màu đỏ ngay dưới.
- **Cuối drawer:** "TỔNG TIỀN" + số tiền, nút secondary "XEM GIỎ HÀNG" và nút primary "THANH TOÁN". Nút "THANH TOÁN" bị disabled khi còn dòng lỗi.
- **Giỏ trống:** "Giỏ hàng của bạn đang trống" và nút "TIẾP TỤC MUA SẮM".
- **Đang tải quote:** hiện skeleton, giữ nguyên số liệu cũ để không bị nháy.

### 7.2 Trang `/cart`

- Danh sách sản phẩm bên trái. Bên phải là tóm tắt: Tạm tính, Phí vận chuyển ("Miễn phí" hoặc số tiền), Tổng cộng.
- Có ô "Ghi chú đơn hàng" (lưu vào store) và nút "THANH TOÁN".

---

## 8. Thanh toán `/checkout`

- Giỏ trống thì chuyển về `/cart`.
- **Layout `(checkout)`:** header rút gọn, chỉ gồm logo và link "‹ Quay lại giỏ hàng". Không hiện menu, không hiện nút liên hệ nổi.
- **Desktop:** 2 cột. Form bên trái, `OrderSummary` bên phải (dính khi cuộn).
- **Mobile:** `OrderSummary` thu gọn ở đầu trang, dạng "Xem tóm tắt đơn hàng ▾ — 459.000₫".
- **Form** (react-hook-form + `checkoutSchema` dùng chung với server):

  | Field | Bắt buộc | Ràng buộc / ghi chú |
  |---|---|---|
  | Họ và tên | ✓ | 2–60 ký tự |
  | Số điện thoại | ✓ | Chuẩn hóa: bỏ khoảng trắng, dấu chấm, dấu gạch; `+84`/`84` → `0`. Sau đó khớp `/^0(3|5|7|8|9)\d{8}$/` |
  | Email | | Dùng để nhận email xác nhận đơn |
  | Tỉnh / Thành phố | ✓ | `Select`, danh sách ở mục 8.1 |
  | Phường / Xã | ✓ | Ô nhập chữ, 2–80 ký tự |
  | Địa chỉ cụ thể | ✓ | Số nhà, tên đường; 5–200 ký tự |
  | Ghi chú | | Tối đa 500 ký tự, lấy sẵn ghi chú từ giỏ |
  | Phương thức thanh toán | ✓ | Radio dạng thẻ: "Thanh toán khi nhận hàng (COD)" (mặc định), "Chuyển khoản ngân hàng". Ẩn lựa chọn chuyển khoản khi `bankTransferEnabled = false` |
  | Đồng ý chính sách | ✓ | Checkbox: "Tôi đồng ý với Chính sách bảo mật và Điều khoản dịch vụ" (có link tới 2 trang) |
  | `website` (honeypot) | | Ô ẩn |
  | Mã giảm giá | | Chỉ từ Phase 14a |

- **Nút "ĐẶT HÀNG"** rộng hết khung. Khi đang gửi thì disabled và hiện spinner.
- **Xử lý kết quả:**
  - Lỗi theo từng ô: hiện ngay dưới ô.
  - `OUT_OF_STOCK`: hiện danh sách dòng bị lỗi, gọi lại quote, nút "Cập nhật giỏ hàng".
  - `PRICE_CHANGED`: mở Dialog so sánh tổng tiền cũ và mới, nút "Đồng ý và đặt hàng" (gửi lại với `expectedTotal` mới).
  - `RATE_LIMITED` hoặc `INTERNAL`: toast, kèm SĐT shop nếu có.
- **Thành công:** xóa giỏ, xóa `idempotencyKey`, chuyển tới `/checkout/success?code={code}&t={token}`.

### 8.1 Tỉnh/thành (`src/lib/provinces.ts`)

Dùng **34 tỉnh/thành sau sáp nhập năm 2025**. Từ 01/07/2025 địa chỉ chỉ còn 2 cấp (tỉnh → phường/xã), nên form **không có** ô Quận/Huyện.

Thứ tự hiển thị: Hà Nội và TP. Hồ Chí Minh lên đầu, còn lại sắp A-Z bằng `localeCompare(b, "vi")`.

An Giang, Bắc Ninh, Cà Mau, Cao Bằng, Cần Thơ, Đà Nẵng, Đắk Lắk, Điện Biên, Đồng Nai, Đồng Tháp, Gia Lai, Hà Nội, Hà Tĩnh, Hải Phòng, Huế, Hưng Yên, Khánh Hòa, Lai Châu, Lâm Đồng, Lạng Sơn, Lào Cai, Nghệ An, Ninh Bình, Phú Thọ, Quảng Ngãi, Quảng Ninh, Quảng Trị, Sơn La, Tây Ninh, Thái Nguyên, Thanh Hóa, TP. Hồ Chí Minh, Tuyên Quang, Vĩnh Long.

---

## 9. Đặt hàng thành công `/checkout/success?code=&t=`

- Server component gọi `getOrderForSuccessPage(code, token)`. Sai mã hoặc sai token thì trả 404. Trang có `noindex`.
- **Nội dung:**
  - icon check, tiêu đề "CẢM ƠN BẠN ĐÃ ĐẶT HÀNG!";
  - "Mã đơn hàng: **CS2610274821**" kèm nút sao chép;
  - tóm tắt đơn (sản phẩm, tiền), địa chỉ giao hàng.
- **Đơn chuyển khoản chưa thanh toán:** hiện `BankTransferInfo`.
  - Ảnh QR tạo bởi `lib/vietqr.ts`: `https://img.vietqr.io/image/{bankBin}-{accountNo}-compact2.png?amount={total}&addInfo={code}&accountName={accountName}` (các tham số đều được encode).
  - Bên dưới QR: tên ngân hàng, số tài khoản (có nút sao chép), chủ tài khoản, số tiền, nội dung chuyển khoản = mã đơn (có nút sao chép).
  - Dòng nhắc: "Vui lòng ghi đúng nội dung chuyển khoản để shop xác nhận nhanh."
  - Phase 14b: cứ 5 giây kiểm tra trạng thái thanh toán một lần (tối đa 15 phút). Khi đã nhận tiền thì hiện "Đã nhận thanh toán ✓".
- Dòng thông báo: "Shop sẽ liên hệ xác nhận đơn qua điện thoại/Zalo trong vòng 24 giờ."
- Nút "TIẾP TỤC MUA SẮM" và nút "NHẮN ZALO CHO SHOP" (chỉ hiện nếu có Zalo).

---

## 10. Tra cứu đơn hàng `/kiem-tra-don-hang`

- Form gồm "Mã đơn hàng" và "Số điện thoại đặt hàng", gửi qua `lookupOrderAction`.
- **Tìm thấy đơn:**
  - mã đơn, ngày đặt;
  - **timeline trạng thái:** Chờ xác nhận → Đã xác nhận → Đang giao → Hoàn thành. Đơn bị hủy hoặc hoàn trả thì hiện riêng kèm lý do;
  - trạng thái thanh toán;
  - danh sách sản phẩm, tổng tiền;
  - hãng vận chuyển + mã vận đơn (có nút sao chép);
  - tên người nhận và SĐT đã che (`0912***678`).
- **Không tìm thấy:** chỉ hiện "Không tìm thấy đơn hàng. Vui lòng kiểm tra lại mã đơn và số điện thoại." Không phân biệt sai mã hay sai SĐT.
- Trang có `noindex`.

---

## 11. Trang tĩnh, liên hệ, 404

- **Trang tĩnh:** `/gioi-thieu`, `/chinh-sach-doi-tra`, `/chinh-sach-bao-mat`, `/dieu-khoan-dich-vu`.
  - Bố cục: h1 căn giữa, nội dung rộng tối đa 760px, chữ 15px, line-height 1.7.
  - Codex viết nội dung mẫu hợp lý, đầu file ghi comment `// TODO: chủ shop duyệt lại nội dung`.
  - Trang bảo mật phải nêu rõ: shop thu thập dữ liệu gì (họ tên, SĐT, email, địa chỉ, IP), để làm gì (giao hàng, liên hệ, chống gian lận), lưu ở đâu, khách liên hệ thế nào để yêu cầu xóa dữ liệu.
- **`/huong-dan-chon-size`:** hiện toàn bộ bảng size đang có, kèm hướng dẫn cách đo.
- **`/lien-he`:** 2 cột.
  - Trái: thông tin liên hệ và mạng xã hội.
  - Phải: form gồm Họ tên*, SĐT*, Email, Nội dung* (10–1000 ký tự), gửi qua `submitContactAction`.
  - Gửi thành công: "Cảm ơn bạn đã để lại lời nhắn. Shop sẽ phản hồi sớm nhất!"
- **404:** "KHÔNG TÌM THẤY TRANG", nút "VỀ TRANG CHỦ", kèm 4 sản phẩm BEST SELLER.

---

## 12. SEO, hiệu năng, accessibility

- **Thẻ trang:**
  - `<html lang="vi">`; mọi trang có `metadata` hoặc `generateMetadata`.
  - Title dạng `"{Tên trang} | Cham.stu"`.
  - Description của sản phẩm: lấy `seo_description`, không có thì lấy 160 ký tự đầu của mô tả.
  - Open Graph: ảnh chính của sản phẩm; các trang khác dùng `seo.ogImageUrl`.
  - Canonical URL bỏ các tham số lọc, sắp xếp, phân trang.
- **JSON-LD:**
  - `Product` trên trang sản phẩm: name, image, sku, offers (price, `VND`, availability).
  - `Organization` trên trang chủ.
  - `BreadcrumbList` trên trang danh mục và trang sản phẩm.
- **Sitemap và robots:**
  - `sitemap.ts` gồm trang chủ, mọi danh mục, bộ sưu tập, sản phẩm đang bán và các trang tĩnh.
  - `robots.ts` chặn `/admin`, `/checkout`, `/cart`, `/api`, `/kiem-tra-don-hang`.
- **Mục tiêu Lighthouse mobile:** Performance ≥ 85, Accessibility ≥ 95, SEO ≥ 95.
- **Accessibility:**
  - Ảnh có `alt`.
  - Nút chỉ có icon thì có `aria-label` ("Mở giỏ hàng", "Tìm kiếm", "Mở menu").
  - Swatch màu có `aria-label` là tên màu.
  - Dialog và Sheet dùng Radix (đã có sẵn focus trap và đóng bằng Esc).
  - Độ tương phản đạt chuẩn WCAG AA.

---

## 13. Quy cách ảnh

Ảnh do admin upload và được tự resize trên trình duyệt (`ARCHITECTURE.md` mục 11).

| Loại | Tỉ lệ | Kích thước sau xử lý |
|---|---|---|
| Ảnh sản phẩm | **1:1** (giống ảnh Shopee) | 1200×1200, nền trắng, không cắt |
| Banner desktop | 2.4:1 | rộng tối đa 1920 (khuyến nghị 1920×800) |
| Banner mobile | 4:5 | khuyến nghị 1080×1350 |
| Ảnh danh mục | 3:4 | khuyến nghị 900×1200 |
| Ảnh OG | 1.91:1 | 1200×630 |

Banner hoặc ảnh danh mục lệch tỉ lệ khuyến nghị quá 5% thì admin hiện cảnh báo, nhưng vẫn cho lưu.

**Quy ước thứ tự ảnh sản phẩm:**
- ảnh thứ 1: ảnh chính, hiện trên card (giống ảnh bìa trên Shopee);
- ảnh thứ 2: ảnh hiện khi hover (mặt sau, hoặc người mẫu mặc);
- các ảnh còn lại: chi tiết.

---

## 14. Trạng thái tải, lỗi, rỗng

- `loading.tsx` cho trang danh mục và trang sản phẩm: dùng skeleton đúng hình dạng nội dung (lưới card, gallery + khung thông tin).
- `error.tsx` trong `(shop)`: "Đã có lỗi xảy ra", nút "Thử lại" (`reset()`) và nút "Về trang chủ".
- Mọi danh sách có trạng thái rỗng riêng, viết bằng câu dễ hiểu.
- **Toast** (sonner): chỉ dùng cho lỗi chung và thông báo ngắn. Thêm vào giỏ thì mở drawer, không hiện toast.
