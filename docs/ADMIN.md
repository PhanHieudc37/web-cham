# ADMIN — Trang quản trị `/admin`

Người dùng chính là chủ shop và nhân viên. Họ sẽ thao tác **nhiều trên điện thoại**, nên mọi trang phải dùng tốt ở 375px.

---

## 1. Quy ước chung

- Khi `EMAIL_DELIVERY=disabled`, đầu khu vực quản trị hiện thông báo email tự động đang tắt. Chủ shop kiểm tra Đơn hàng/Tin nhắn trực tiếp và liên hệ khách qua điện thoại/Zalo; thao tác giao hàng không hứa đã gửi email.

- **Giao diện:** shadcn/ui theme neutral, góc bo nhỏ (radius 6px). Chữ hiển thị bằng tiếng Việt. Mọi trang có `noindex`.
- **Bố cục:**
  - **Desktop:**
    - sidebar trái rộng 240px;
    - topbar gồm tên trang, nút "Xem cửa hàng ↗", menu tài khoản (tên, vai trò, Đăng xuất).
  - **Mobile:** topbar có nút ☰ mở sidebar dạng `Sheet`.
  - **Sidebar:**
    - Tổng quan;
    - Đơn hàng (badge = số đơn "Chờ xác nhận");
    - Sản phẩm, Danh mục, Bộ sưu tập, Banner;
    - Tin nhắn (badge = số tin mới);
    - Cài đặt\*, Tài khoản\*.

    Mục có dấu \* chỉ hiện với `admin`.
- **Bảng:**
  - Trên desktop dùng `Table`.
  - Trên mobile mỗi dòng biến thành một **card**: thông tin chính ở trên, thông tin phụ ở dưới.
  - Phân trang trên URL (`?page=`), 20 dòng mỗi trang. Tìm kiếm và bộ lọc cũng nằm trên URL.
- **Form:**
  - react-hook-form + zod (schema dùng chung với action).
  - Lỗi hiện ngay dưới từng ô.
  - Nút "Lưu" dính ở đáy màn hình trên mobile.
  - Lưu thành công: toast "Đã lưu". Lỗi chung: toast lỗi.
  - Rời trang khi còn thay đổi chưa lưu: hiện cảnh báo (`use-unsaved-changes`).
- **Thao tác nguy hiểm** (hủy đơn, lưu trữ sản phẩm, xóa…): luôn qua `ConfirmDialog`.
- **Ngày giờ:** hiển thị dạng `dd/MM/yyyy HH:mm` theo giờ Việt Nam. **Tiền:** dùng `formatPrice`.
- **Badge trạng thái** (`StatusBadge`):

  | Trạng thái | Màu |
  |---|---|
  | Chờ xác nhận | vàng |
  | Đã xác nhận | xanh dương |
  | Đang giao | tím |
  | Hoàn thành | xanh lá |
  | Đã hủy | xám |
  | Hoàn trả | đỏ |
  | Chưa thanh toán | viền cam |
  | Đã thanh toán | xanh lá |
  | Đã hoàn tiền | xám |

---

## 2. Tổng quan `/admin`

- **Thẻ số liệu:**
  - Đơn mới hôm nay;
  - Chờ xác nhận;
  - Chuyển khoản chưa thanh toán;
  - Doanh thu hôm nay / 7 ngày / 30 ngày (chỉ `admin` thấy; cách tính ở DATABASE 4.13).
- **Biểu đồ doanh thu 14 ngày:** cột dọc vẽ bằng div và Tailwind (không cần thư viện biểu đồ), hover thì hiện số tiền.
- **10 đơn mới nhất:** mã, giờ, khách, tổng, trạng thái; bấm vào thì mở chi tiết đơn.
- **Sắp hết hàng:** các biến thể có `stock <= lowStockThreshold` mà vẫn đang bán, gồm ảnh, tên, màu/size, tồn kho, link sửa sản phẩm.

---

## 3. Đơn hàng

### 3.1 Danh sách `/admin/orders`

- **Tab theo trạng thái**, mỗi tab có số đếm: Tất cả · Chờ xác nhận · Đã xác nhận · Đang giao · Hoàn thành · Đã hủy · Hoàn trả.
- **Tìm kiếm:** theo mã đơn, SĐT, tên khách.
- **Bộ lọc:** khoảng ngày; phương thức thanh toán; trạng thái thanh toán.
- **Cột:** Mã đơn · Ngày đặt · Khách hàng · SĐT · Số SP · Tổng tiền · Thanh toán (phương thức + trạng thái) · Trạng thái.
- **Nút "Xuất CSV"** (chỉ `admin`): gọi `/api/admin/orders/export` với bộ lọc hiện tại.
  - File UTF-8 có BOM để Excel đọc đúng tiếng Việt.
  - Mỗi dòng sản phẩm của đơn là một dòng trong CSV.

### 3.2 Chi tiết `/admin/orders/[id]`

- **Đầu trang:**
  - mã đơn, ngày đặt, badge trạng thái và badge thanh toán;
  - **các nút chuyển trạng thái hợp lệ** (theo bảng ở DATABASE 4.10), ví dụ "Xác nhận đơn", "Chuyển sang Đang giao", "Hoàn thành", "Hủy đơn", "Hoàn trả".
- Mỗi nút mở `ConfirmDialog`:
  - **Hủy đơn:** bắt buộc chọn hoặc nhập lý do. Lý do có sẵn: "Khách yêu cầu hủy", "Không liên lạc được khách", "Hết hàng", "Đơn trùng / spam", "Khác".
  - **Đang giao:** cho nhập luôn hãng vận chuyển và mã vận đơn.
  - **Đơn chuyển khoản chưa thanh toán mà bấm xác nhận:** hiện cảnh báo vàng "Đơn chưa được thanh toán".
- **Khách hàng:**
  - tên, SĐT kèm nút **Gọi** (`tel:`) và nút **Zalo** (`https://zalo.me/{sđt}`), email;
  - địa chỉ đầy đủ kèm nút **Sao chép địa chỉ** (để dán vào app vận chuyển);
  - ghi chú của khách.
- **Sản phẩm:** ảnh, tên (link tới sản phẩm nếu còn), màu/size, SKU, đơn giá, số lượng, thành tiền. Tiếp theo là tạm tính, giảm giá, phí ship, **tổng**.
- **Thanh toán:**
  - phương thức, trạng thái, thời điểm thanh toán;
  - nút "Đã nhận tiền" (đơn chuyển khoản chưa thanh toán), nút "Đã hoàn tiền" (đơn đã thanh toán nhưng bị hủy hoặc hoàn trả);
  - với đơn chuyển khoản, hiện nội dung chuyển khoản cần đối chiếu (= mã đơn).
- **Vận chuyển:** chọn hãng (GHN, GHTK, Viettel Post, J&T Express, SPX, Khác) và nhập mã vận đơn, nút "Lưu".
- **Ghi chú nội bộ:** ô nhập kèm nút "Thêm ghi chú". Ghi chú được lưu thành `order_events` loại `note`.
- **Lịch sử:** timeline `order_events`, mỗi mục gồm thời gian, người thực hiện, nội dung.
- **Nút "In phiếu giao hàng":** mở `/admin/orders/[id]/print`.

### 3.3 In phiếu `/admin/orders/[id]/print`

- Trang dùng CSS `@media print`: ẩn sidebar và topbar, khổ A5 dọc.
- **Nội dung:**
  - tên shop, SĐT shop;
  - mã đơn (chữ lớn), ngày đặt;
  - người nhận, SĐT, địa chỉ;
  - bảng sản phẩm (tên, màu/size, số lượng);
  - **"Thu hộ (COD): {tổng}"** nếu đơn COD chưa thanh toán; ngược lại hiện "Đã thanh toán – Không thu tiền";
  - ghi chú của khách.
- Mở trang thì tự gọi `window.print()`.

---

## 4. Danh mục `/admin/categories`

- **Danh sách dạng cây 2 cấp.** Mỗi dòng gồm: ảnh nhỏ, tên, slug, số sản phẩm, công tắc "Hiển thị", nút ↑ ↓ để sắp thứ tự, nút Sửa.
- **Dialog thêm/sửa:**
  - tên;
  - slug (tự sinh từ tên, sửa được);
  - danh mục cha (chỉ chọn được danh mục cấp 1, hoặc để trống);
  - ảnh (upload chế độ `fit`, dùng cho ô danh mục trên trang chủ);
  - hiển thị.
- **Xóa** chỉ được khi danh mục không có sản phẩm và không có danh mục con. Nếu không xóa được thì báo: "Hãy chuyển sản phẩm sang danh mục khác trước".

---

## 5. Sản phẩm

### 5.1 Danh sách `/admin/products`

- **Tìm kiếm:** theo tên hoặc mã. **Lọc:** theo danh mục, trạng thái (Nháp / Đang bán / Lưu trữ), "Sắp hết hàng".
- **Cột:** Ảnh · Tên + mã · Danh mục · Giá (kèm giá gốc nếu sale) · Tổng tồn kho · Trạng thái · Cập nhật lúc.
- **Thao tác trên mỗi dòng:** Sửa · Nhân bản · Xem trên cửa hàng (chỉ khi đang bán) · Lưu trữ / Khôi phục.
- Nút **"+ Thêm sản phẩm"** → `/admin/products/new`.

### 5.2 Form sản phẩm (`/admin/products/new`, `/admin/products/[id]`)

Chia thành các khối (card). Trên desktop có 2 cột: nội dung chính bên trái, khối "Trạng thái & phân loại" bên phải.

1. **Thông tin cơ bản:**
   - Tên*, Mã sản phẩm* (viết hoa, không dấu, ví dụ `TEE01`), Slug (tự sinh, sửa được).
   - Đổi slug của sản phẩm đang bán thì hiện cảnh báo "Link cũ sẽ không còn truy cập được".
2. **Giá:**
   - Giá bán* (VND), Giá gốc (để trống nếu không sale).
   - Ô nhập tự định dạng `139.000` khi gõ.
   - Hiện "% giảm" tự tính.
3. **Mô tả:**
   - Mô tả (textarea, cho phép xuống dòng);
   - Chất liệu, Form dáng;
   - Hướng dẫn bảo quản (danh sách dòng, thêm/xóa được);
   - Bảng size (chọn từ `size_charts`, có nút "Tạo bảng size mới" mở dialog).
4. **Ảnh:**
   - Vùng kéo-thả / chọn nhiều ảnh. Mỗi ảnh được resize kiểu `square` rồi upload ngay, có thanh tiến trình.
   - Ảnh hiện dạng lưới vuông. Mỗi ảnh có các nút:
     - ↑ / ↓ (đổi thứ tự);
     - "Đặt làm ảnh chính";
     - chọn màu gắn với ảnh;
     - ô alt (mặc định = tên sản phẩm + màu);
     - Xóa.
   - Ảnh thứ 1 có nhãn "Ảnh chính", ảnh thứ 2 có nhãn "Ảnh hover".
5. **Màu sắc:**
   - Thêm màu gồm: tên (ví dụ "Đen") và mã màu (ô chọn màu + ô nhập hex).
   - `code` tự sinh từ tên.
   - Sắp thứ tự bằng ↑ ↓, có nút xóa.
6. **Kích thước:**
   - Chip chọn nhanh: XS, S, M, L, XL, XXL, 3XL, Freesize.
   - Ô nhập thêm size tùy chỉnh.
7. **Biến thể và tồn kho (`VariantMatrix`):**
   - Bảng **hàng = màu, cột = size**, tự sinh theo màu và size đã chọn.
   - Mỗi ô gồm: ô nhập tồn kho, công tắc "Đang bán".
   - Thao tác hàng loạt: "Đặt tồn kho cho tất cả: [ ] Áp dụng".
   - Nút "Hiện SKU": mở chế độ sửa SKU của từng ô. SKU mặc định là `{CODE}-{COLORCODE}-{SIZE}`.
   - Bỏ một màu hoặc size đã có trong đơn hàng cũ: biến thể đó **không bị xóa**, chỉ chuyển sang `is_active = false`.
   - Gửi tồn kho dạng `{ expectedStock, newStock }` (cách tính ở DATABASE 4.12).
8. **Trạng thái và phân loại** (khối bên phải):
   - Trạng thái (Nháp / Đang bán / Lưu trữ);
   - Danh mục*;
   - Nhãn NEW, Ghim BEST SELLER;
   - Thứ tự nổi bật;
   - Bộ sưu tập (chọn nhiều).
9. **SEO** (khối thu gọn): SEO title, SEO description, kèm xem trước kiểu kết quả Google.

**Ràng buộc khi lưu:**
- Đang bán thì phải có ≥ 1 ảnh, ≥ 1 màu, ≥ 1 size, ≥ 1 biến thể đang bán.
- Trùng mã hoặc slug thì báo lỗi `CONFLICT` ngay dưới ô tương ứng.
- Toàn bộ thao tác lưu nằm trong **một transaction**.
- Lưu xong thì cập nhật `search_text`, `published_at` (nếu là lần đầu active) và gọi invalidate tag `products`.

**Nhân bản:** sao chép toàn bộ sản phẩm (trừ tồn kho). Bản mới có trạng thái Nháp, tên thêm "(bản sao)", mã thêm `-COPY`.

---

## 6. Lịch sử tồn kho

- Trong form sản phẩm có tab "Lịch sử tồn kho": danh sách `stock_movements` của sản phẩm.
- Mỗi dòng gồm: thời gian, màu/size, thay đổi (+/−), tồn sau thay đổi, lý do (Đơn hàng / Hủy đơn / Hoàn trả / Điều chỉnh / Nhập hàng), mã đơn (có link), người thực hiện, ghi chú.
- Khi sửa tồn kho trong `VariantMatrix`, có ô "Ghi chú điều chỉnh" (không bắt buộc) đi kèm.

---

## 7. Bộ sưu tập `/admin/collections`

- **Danh sách:** tên, slug, số sản phẩm, Hiển thị, Trang chủ, Menu.
- **Trang sửa:**
  - tên, slug, mô tả;
  - banner (upload `fit`);
  - các công tắc Hiển thị / Hiện ở trang chủ / Hiện trên menu;
  - thứ tự.
- **Chọn sản phẩm:**
  - nút "Thêm sản phẩm" mở dialog tìm kiếm, tick chọn nhiều;
  - danh sách sản phẩm đã chọn có nút ↑ ↓ và nút gỡ.

---

## 8. Banner `/admin/banners`

- **Danh sách:** ảnh desktop thu nhỏ, tiêu đề, link, thời gian chạy, Hiển thị, nút ↑ ↓.
- **Form:**
  - tiêu đề nội bộ;
  - ảnh desktop* và ảnh mobile* (upload `fit`, cảnh báo khi lệch tỉ lệ);
  - alt*, link*, chữ trên nút (mặc định "MUA NGAY");
  - thời gian bắt đầu / kết thúc (không bắt buộc);
  - hiển thị.
- **Xem trước:** hiện cả bản desktop và bản mobile ngay trong form.

---

## 9. Tin nhắn liên hệ `/admin/messages`

- **Tab:** Mới · Đã xử lý.
- **Mỗi tin:** thời gian, tên, SĐT (nút Gọi / Zalo), email, nội dung, nút "Đánh dấu đã xử lý". Hệ thống ghi lại người xử lý và thời gian.

---

## 10. Cài đặt `/admin/settings` (chỉ `admin`)

- Mỗi tab tương ứng một key trong DATABASE mục 5.
- Mỗi tab có nút "Lưu" riêng, gọi `updateSettingsAction` và invalidate tag `settings`.

| Tab | Nội dung |
|---|---|
| Thông tin shop | Tên, mô tả ngắn, logo (upload `fit`), SĐT, SĐT Zalo, email, địa chỉ, giờ làm việc |
| Mạng xã hội | Facebook, Messenger (`https://m.me/...`), Instagram, TikTok, Shopee |
| Thông báo & cam kết | Danh sách câu thông báo (thêm/xóa/sắp xếp); danh sách cam kết (chọn icon: truck, refresh, wallet, message, shield, gift + chữ); tóm tắt chính sách đổi trả |
| Vận chuyển | Phí ship (VND); freeship từ N sản phẩm (để trống = tắt); freeship từ X đồng (để trống = tắt) |
| Thanh toán | Ngân hàng (chọn từ danh sách BIN của VietQR, lưu sẵn trong code); số tài khoản; tên chủ tài khoản (tự viết hoa, bỏ dấu); **xem trước mã QR** với số tiền 10.000₫ |
| Pháp lý | Tên chủ thể kinh doanh, MST / số ĐKKD, địa chỉ đăng ký, link thông báo Bộ Công Thương, ảnh logo BCT |
| Đơn hàng | Tiền tố mã đơn; số giờ tự hủy đơn chuyển khoản chưa thanh toán (dùng ở 14c); ngưỡng sắp hết hàng; số lượng tối đa mỗi dòng |
| SEO | Tiêu đề mặc định, mô tả mặc định, ảnh chia sẻ (OG) |

---

## 11. Đăng nhập và tài khoản quản trị

**`/admin/login`**
- Form email + mật khẩu, nút "Đăng nhập".
- Trong lúc xác thực hiển thị "Đang đăng nhập…"; xác thực xong giữ nút disabled với "Đang mở trang quản trị…" và tải lại tài liệu theo đường dẫn admin an toàn bằng cookie mới. Mất kết nối hiện thông báo để thử lại, không để lỗi Promise thoát khỏi form. Các trang quản trị có trạng thái đang tải rõ ràng.
- Sai thông tin thì báo chung "Email hoặc mật khẩu không đúng".
- Đăng nhập thành công thì chuyển tới `/admin`, hoặc về trang trước đó (lấy từ `?next=`, chỉ chấp nhận đường dẫn bắt đầu bằng `/admin`).
- Đã đăng nhập mà vào lại `/admin/login` thì chuyển thẳng tới `/admin`.

**`/admin/users`** (chỉ `admin`)
- **Danh sách:** tên, email, vai trò, trạng thái (Hoạt động / Đã khóa), ngày tạo.
- **"Thêm tài khoản":** nhập tên, email, mật khẩu tạm (≥ 8 ký tự), vai trò (`staff` / `admin`). Admin tự gửi mật khẩu tạm cho nhân viên.
- **Đổi vai trò, Khóa / Mở khóa:** admin **không** tự khóa hoặc tự hạ quyền chính mình. Hệ thống phải luôn còn ít nhất 1 tài khoản `admin` đang hoạt động.
- **Đổi mật khẩu của chính mình:** nằm trong menu tài khoản ở topbar (nhập mật khẩu cũ + mật khẩu mới).
- **Quên mật khẩu:** README hướng dẫn admin đặt lại mật khẩu cho nhân viên. Trường hợp mất cả tài khoản admin thì chạy lệnh seed với email mới.
