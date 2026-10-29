# Cham.stu

Website cửa hàng và trang quản trị, phát triển theo từng phase trong [docs/PLAN.md](docs/PLAN.md).

Hiện tại: **Phase 0–11 đã triển khai trên dev/test**, gồm Supabase dev, storefront/giỏ/checkout/tra cứu/liên hệ, quản trị sản phẩm/nội dung/đơn hàng/tin nhắn và tổng quan. Project ở Tokyo, khác Singapore dự kiến. Nội dung chính sách là bản mẫu chờ chủ shop duyệt. Resend cần domain gửi riêng để gửi cho khách ngoài email đăng ký. Chưa mở bán production; GitHub Pages vẫn là bản duyệt riêng. Xem [báo cáo Phase 11](docs/PHASE-11-REPORT.md).

Code công khai tại [PhanHieudc37/web-cham](https://github.com/PhanHieudc37/web-cham), nhánh `main`.

## Bản xem thử cho bạn bè góp ý

Có bản duyệt giao diện riêng tại `preview/`, không cần database hoặc `.env`. Trang chủ Next.js gốc vẫn theo tiến độ phase; bản duyệt không thay thế các chức năng bán hàng đang phát triển.

```bash
npm ci
npm run preview:dev
```

Mở [localhost:4173/web-cham](http://localhost:4173/web-cham/). Thử danh mục, tìm kiếm không dấu, xem sản phẩm, chọn màu/size và giỏ mẫu. Giỏ chỉ giữ trong bộ nhớ của tab, tải lại sẽ xóa. Không có đặt hàng, thanh toán hay thu thập thông tin cá nhân; mọi sản phẩm, giá và ảnh đều minh họa. Chưa có trang admin hoặc checkout thật trong bản duyệt.

`npm run preview:build` xuất bản tĩnh vào `.preview-dist`; `npm run preview:test` kiểm tra bằng Chromium. Font Be Vietnam Pro tự lưu trong `preview/fonts/` cùng giấy phép SIL Open Font License. Các SVG do dự án tự vẽ. Không sao chép tài sản của shop khác.

Workflow **Publish design preview** chỉ đưa `.preview-dist` lên GitHub Pages khi thay đổi source preview trên `main`, hoặc chạy thủ công tại tab Actions. **Đã xuất bản và kiểm tra:** [phanhieudc37.github.io/web-cham](https://phanhieudc37.github.io/web-cham/). Xem [báo cáo bản duyệt](docs/PREVIEW-REPORT.md) để biết kết quả kiểm tra và xuất bản thực tế.

GitHub Pages dành cho bản thiết kế góp ý này. Web bán hàng thật cần Next.js server và Supabase, triển khai theo các phase trong plan. Workflow không đọc `.env` hoặc sử dụng secret database.

## Chạy local

Cần Node.js từ 22.15 và npm. Cài thư viện bằng `npm ci`.

1. Sao chép `.env.example` thành `.env` nếu chưa có.
2. Sinh secret bằng lệnh dưới rồi điền vào `BETTER_AUTH_SECRET`. Không chia sẻ hoặc commit secret.

   ```bash
   node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
   ```

3. Giữ URL local `http://localhost:3000`, bucket `media`; chạy `npm run dev`.
4. Mở [localhost:3000](http://localhost:3000).

Máy phát triển đã có `.env` local, secret ngẫu nhiên riêng và kết nối Supabase dev thật. Các dịch vụ chưa cấu hình như Resend vẫn để trống; không điền thông tin kết nối giả.

Ứng dụng kiểm tra các biến local ngay khi khởi động và build. `getServerEnv()` yêu cầu thông tin PostgreSQL và Supabase khi dùng dịch vụ. `npm start` kiểm tra toàn bộ biến production, gồm email; thiếu biến thì dừng và nêu tên biến, không in giá trị nhạy cảm. Từ Phase 6, `npm run build` cần PostgreSQL để render trang chủ từ dữ liệu thật.

## Kiểm tra

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run e2e
npm run e2e:admin
npm run e2e:catalog
npm run e2e:content
npm run e2e:storefront
npm run e2e:browsing
```

E2E Phase 0 tự chạy dev server riêng ở cổng 3100, kiểm tra trang chủ, font và tràn ngang tại 375/768/1280px. Lần đầu có thể cần `npx playwright install chromium`. Bốn luồng bán hàng E2E sẽ làm ở Phase 12.

`npm run e2e:admin` kiểm tra đăng nhập, quyền truy cập, tài khoản, đổi mật khẩu và responsive trên PostgreSQL test riêng. Lệnh tự tạo lại tài khoản test, xóa bảng user/session/account liên quan và rate limit **trong database kiểm thử**. Không chạy đồng thời với `npm run test` vì dùng cùng fixture. Có kiểm tra chặn địa chỉ dev/prod trước khi seed. Không chạy server khác ở cổng 3100 khi kiểm tra.

`npm run e2e:catalog` kiểm tra danh mục, form sản phẩm, ảnh, tồn kho và responsive. Lệnh xóa/tạo lại catalog trong **database test riêng**, tải ảnh thử lên bucket `media` dev đang cấu hình và tự xóa đúng các đường dẫn ảnh nó vừa tạo. Không trỏ Storage vào production khi chạy E2E. Chạy các bộ E2E và `npm run test` lần lượt, không đồng thời.

`npm run e2e:content` kiểm tra bộ sưu tập, banner, mọi nhóm cài đặt và cache Next.js thật. Setup tạo một route đọc cache tạm, giới hạn bởi cờ test + database `_test` + đăng nhập; teardown xóa route đó. Route bị Git bỏ qua và không có trong build bình thường. Nếu dừng test đột ngột, chạy `node -e "import('./e2e/content-cache-probe.mjs').then(m => m.removeProbe())"` để dọn probe. Lệnh cũng dùng PostgreSQL test riêng và chỉ dọn các ảnh Storage do nó tạo.

`npm run e2e:storefront` kiểm tra trang chủ, menu, gợi ý tìm kiếm, rate limit, giảm chuyển động và cập nhật liên hệ từ admin ở 375/768/1280px. Dùng PostgreSQL test riêng, fixture ảnh local và cache probe được tạo/dọn như bộ content; không sửa dữ liệu thật. Chạy lần lượt với các bộ test khác. Cache public được tách theo database để không lẫn fixture với Supabase dev.

## Xem cửa hàng local

Mở [localhost:3000](http://localhost:3000) sau `npm run dev`. Trang chủ lấy banner, danh mục, sản phẩm, collection và cài đặt từ Supabase dev. Sửa trong admin rồi tải lại cửa hàng để xem kết quả; không cần deploy. Nội dung trống tự ẩn, ảnh mẫu còn dùng placeholder. Menu/tìm kiếm hỗ trợ Esc và bấm overlay để đóng. Các liên kết đến trang của phase sau đã có đường dẫn nhưng nội dung chưa được triển khai.

Danh mục `/collections/all` và các danh mục/bộ sưu tập hỗ trợ lọc, sắp xếp và phân trang trên URL; reload giữ lựa chọn. Trang `/search?q=ao+thun` tìm không dấu. Bấm sản phẩm để xem gallery, chọn màu/size và số lượng; size hết hàng/ngừng bán bị khóa, đổi màu đổi ảnh. Bảng size nằm trong dialog và accordion. Nút “THÊM VÀO GIỎ” mở drawer; biểu tượng giỏ trên header cũng mở drawer. Trang `/cart` cho sửa số lượng, xóa hàng và lưu ghi chú; reload vẫn giữ giỏ. Giá/phí ship lấy lại từ server, có cảnh báo khi hết hàng hoặc ngừng bán. “MUA NGAY” hoặc “THANH TOÁN” mở checkout; đơn đặt thử local được lưu ở Supabase dev.

`npm run e2e:browsing` dùng PostgreSQL test riêng và ảnh SVG local được tạo/dọn tự động. Kiểm tra lọc/URL, tìm kiếm, chọn biến thể, vuốt ảnh, giới hạn số lượng, 404 và retry lỗi ở ba độ rộng. Có page lỗi tạm chỉ chạy với cờ test + database `_test` + header kiểm thử; teardown xóa cùng cache probe. Nếu dừng đột ngột, chạy `node -e "import('./e2e/browsing-fixtures.mjs').then(m => m.removeFixtures()); import('./e2e/content-cache-probe.mjs').then(m => m.removeProbe())"` để dọn. Không chạy đồng thời với các bộ test dùng cùng database.

`npm run e2e:cart` dùng cùng setup/teardown riêng như browsing; kiểm tra giỏ ở 375/768/1280px, thay giá qua admin, giảm/hết kho, ngừng bán, freeship, reload, đồng bộ hai tab, lỗi mạng/thử lại, phản hồi cũ và giới hạn API. Không tạo đơn và không thay đổi dữ liệu bán hàng trên Supabase dev. Chạy lần lượt với các bộ test khác.

`npm run e2e:checkout` cũng dùng database `_test` và fixture local, tạo đơn COD/chuyển khoản thử, kiểm tra tồn kho, chống gửi trùng, đổi giá, hết hàng, lỗi form, URL/token và sao chép thông tin. Có dữ liệu ngân hàng giả và ảnh QR fixture để kiểm tra URL/số tiền/nội dung; không chuyển tiền thật. Ép email về chế độ dev, không gửi ra ngoài. Chạy lần lượt với các bộ test khác và dọn probe như browsing nếu dừng đột ngột.

## Checkout và email local

Chọn sản phẩm/màu/size rồi bấm “MUA NGAY”. Điền thông tin giao hàng, chọn một trong 34 tỉnh/thành, phường/xã và địa chỉ cụ thể; không có ô quận/huyện. COD dùng được ngay. Muốn hiện chuyển khoản, admin điền đủ ngân hàng, số tài khoản và chủ tài khoản trong Cài đặt → Thanh toán. Trang thành công tính tiền từ đơn đã lưu, QR mang đúng số tiền và mã đơn; giữ link riêng tư của đơn, không đăng công khai.

Giá đổi sau khi mở checkout thì khách phải đồng ý tổng mới; hết kho sẽ có cảnh báo. Gửi lại cùng phiên đặt hàng không tạo đơn thứ hai. Thành công mới xóa giỏ và mã chống trùng. Giao diện quản lý đơn, tra cứu, liên hệ và các trang chính sách đã có trên local.

Chưa có `RESEND_API_KEY` thì server log xác nhận email dev với mã đơn/loại thông báo và che thông tin khách/token. Để gửi thật, xác minh domain trên [Resend](https://resend.com/docs/send-with-nextjs), điền `RESEND_API_KEY`, `EMAIL_FROM` và `SHOP_NOTIFY_EMAIL` vào `.env` riêng rồi khởi động lại local. Không gửi key qua chat hoặc đưa lên Git. Khách chỉ nhận email khi đã điền email lúc đặt đơn; email lỗi không làm mất đơn. Telegram chỉ gửi khi có đủ `TELEGRAM_BOT_TOKEN` và `TELEGRAM_CHAT_ID`. Local đã có cấu hình Resend và API chấp nhận yêu cầu gửi thử; sender `@resend.dev` chỉ dùng thử với email của tài khoản đăng ký, cần domain riêng để gửi cho khách khác. Chưa xác minh giao email vận chuyển đến hộp thư khách thật.

## Đăng nhập và tài khoản quản trị

1. Chạy `npm run dev`, mở [localhost:3000/admin/login](http://localhost:3000/admin/login).
2. Dùng email trong `ADMIN_SEED_EMAIL` và mật khẩu trong `ADMIN_SEED_PASSWORD` của `.env` trên máy. Không gửi mật khẩu hoặc file `.env` cho người khác.
3. Vào **Tài khoản → Thêm tài khoản**, nhập tên/email/mật khẩu tạm và chọn **Nhân viên** hoặc **Quản trị viên**. Tự gửi riêng mật khẩu tạm cho thành viên; hệ thống chưa gửi email cấp tài khoản.
4. Thành viên đổi mật khẩu trong menu tài khoản góc trên. Cần nhập mật khẩu cũ; đổi xong thu hồi các phiên khác.
5. Trong danh sách tài khoản, quản trị viên có thể đổi vai trò, khóa/mở khóa hoặc đặt lại mật khẩu. Khóa/đổi vai trò/đặt lại mật khẩu sẽ thu hồi các phiên của tài khoản bị thay đổi. Không thể tự khóa/tự hạ quyền; luôn giữ ít nhất một admin hoạt động.

Nhân viên không thấy và không truy cập được Tài khoản/Cài đặt; các action cũng kiểm tra quyền ở server. Đăng ký công khai bị tắt. Tổng quan, Đơn hàng, Tin nhắn, Danh mục, Sản phẩm, Bộ sưu tập, Banner và Cài đặt đã dùng được. Doanh thu và xuất CSV chỉ dành cho admin.

## Tra cứu, liên hệ và nội dung chính sách

- [Kiểm tra đơn hàng](http://localhost:3000/kiem-tra-don-hang): nhập mã đơn và SĐT đặt hàng. Kết quả che một phần SĐT và không trả địa chỉ/email hay ghi chú nội bộ. Sai mã hoặc SĐT đều có cùng thông báo; quá 10 lượt/10 phút/IP sẽ tạm khóa tra cứu.
- [Liên hệ](http://localhost:3000/lien-he): gửi tên/SĐT/nội dung, email tùy chọn. Tối đa 3 lượt/10 phút/IP. Tin được lưu trước khi gửi email cho shop; gửi email lỗi không làm mất tin.
- [Tin nhắn admin](http://localhost:3000/admin/messages): nhân viên xem tab Mới/Đã xử lý, đánh dấu đã xử lý; hệ thống giữ tên và thời gian của người xử lý đầu tiên.
- Các trang giới thiệu, đổi trả, bảo mật và điều khoản có nội dung mẫu. Chủ shop cần duyệt trước khi áp dụng chính thức. [Hướng dẫn chọn size](http://localhost:3000/huong-dan-chon-size) đọc toàn bộ bảng size đã tạo trong quản trị sản phẩm.
- `npm run e2e:support` kiểm tra tra cứu, rate limit/honeypot, liên hệ → admin, chính sách, bảng size và 404 ở 375/768/1280px trên database `_test`. Email/Telegram thật bị tắt; chạy lần lượt với các bộ test khác.

## Quản lý đơn local

- Mở [tổng quan](http://localhost:3000/admin) hoặc [đơn hàng](http://localhost:3000/admin/orders). Tìm/lọc và phân trang giữ trên URL; nếu chưa có đơn thì danh sách trống.
- Mở chi tiết để xác nhận, giao, hoàn thành, hủy/hoàn trả. Hủy phải có lý do; hủy/hoàn trả sẽ hoàn kho. COD hoàn thành tự ghi nhận tiền; chuyển khoản nhận tiền và hoàn tiền cần đối chiếu thực tế rồi xác nhận riêng.
- Nhập hãng/mã vận đơn khi chuyển Đang giao để gửi email cho khách có địa chỉ email. Sửa vận chuyển, thêm ghi chú nội bộ và xem người thao tác trong lịch sử. Ghi chú nội bộ không được trả về cho khách.
- Admin xuất CSV theo bộ lọc hiện tại. File có BOM, một dòng/sản phẩm; các cột tổng đơn lặp ở từng dòng sản phẩm. In phiếu A5 từ chi tiết; kiểm tra mục thu hộ trước khi giao.
- `npm run e2e:orders` kiểm tra luồng này trên PostgreSQL `_test`, 375/768/1280px. Bộ test tắt email/Telegram thật, không ghi đơn vào Supabase dev. Chạy lần lượt với các bộ test khác.

**Quên mật khẩu nhân viên:** admin vào Tài khoản, bấm biểu tượng chìa khóa của nhân viên, nhập mật khẩu tạm mới và gửi riêng cho họ. Mật khẩu cũ và phiên cũ không còn dùng được.

**Mất toàn bộ tài khoản admin:** sửa `ADMIN_SEED_EMAIL` thành email mới chưa có trong hệ thống và đặt `ADMIN_SEED_PASSWORD` mạnh trong `.env`; chạy `npm run db:seed` **không thêm `--sample`**. Seed thêm admin còn thiếu và giữ dữ liệu shop hiện có. Không đổi mật khẩu của email đã tồn tại bằng cách chạy lại seed. Sau khi đăng nhập tài khoản mới, khóa tài khoản cũ nếu cần.

## Danh mục, sản phẩm, ảnh và tồn kho

- **Danh mục:** thêm nhóm cấp một hoặc chọn nhóm cấp một làm cha. Có ảnh, hiển thị/ẩn, sắp thứ tự bằng ↑ ↓. Chỉ xóa khi không còn sản phẩm và danh mục con. Đường dẫn không được trùng danh mục/bộ sưu tập hoặc `all`, `new-arrival`, `best-seller`, `sale`.
- **Sản phẩm → Thêm sản phẩm:** nhập tên/mã, giá VND, mô tả và chọn danh mục. Mã được viết hoa. Đường dẫn tự sinh; nhập thủ công nếu muốn. Đổi đường dẫn của sản phẩm đã bán sẽ làm link cũ không còn dùng được.
- **Ảnh:** chọn/kéo nhiều ảnh WebP/JPEG/PNG. Ảnh gốc tối đa 20 MB được xử lý trên trình duyệt về 1200×1200 nền trắng, giữ trọn ảnh và nén dưới 1 MB trước upload. Tối đa 12 ảnh. Dùng ↑ ↓ hoặc ngôi sao để đổi ảnh chính; gán màu và mô tả cho từng ảnh. Danh mục dùng chế độ giữ tỉ lệ, cạnh dài tối đa 1920px.
- **Màu và size:** thêm màu, chọn size để tạo ma trận biến thể; mỗi ô có tồn kho và bật/tắt đang bán. Có đặt tồn hàng loạt, sửa SKU và ghi chú điều chỉnh. Biến thể bị gỡ được ngừng bán và giữ lại để đối chiếu đơn cũ; có thể xuất hiện lại ở trạng thái ngừng bán khi mở lại form.
- **Bảng size:** chọn bảng có sẵn hoặc tạo bảng mới bằng nút trong form, nhập cột/dòng/số đo thật.
- Chỉ chuyển sang **Đang bán** khi có ảnh và ít nhất một biến thể đang bán. Nhấn **Lưu sản phẩm**; lỗi mã/đường dẫn hiển thị ngay dưới ô tương ứng. Tab **Lịch sử tồn kho** ghi thay đổi, tồn sau, lý do và người thao tác.
- Tồn kho lưu theo chênh lệch so với khi mở form, không ghi đè lượt bán phát sinh trong lúc chỉnh sửa. Sau khi lưu, form nhận lại tồn kho mới nhất từ server làm mốc cho lần lưu tiếp theo.
- **Nhân bản** tạo bản Nháp, thêm `(bản sao)`/`-COPY`, tồn kho bằng 0. **Lưu trữ** ẩn sản phẩm; **Khôi phục** đưa về Nháp để kiểm tra trước khi mở bán lại. Ảnh dùng chung với bản sao chỉ bị xóa khỏi Storage khi không còn tham chiếu.

Thông tin mẫu vẫn dùng ảnh placeholder. Chủ shop thay bằng ảnh, mô tả, giá và số đo thật trước khi bán. Bấm xem sản phẩm sẽ mở trang storefront Phase 7; sản phẩm Nháp/Lưu trữ hoặc nằm trong danh mục ẩn trả 404. Các trang đặt hàng và chính sách tiếp tục theo phase được giao.

## Bộ sưu tập, banner và cài đặt shop

- **Bộ sưu tập:** tạo tên/đường dẫn/mô tả, tải ảnh ngang giữ tỉ lệ; chọn Hiển thị/Trang chủ/Menu. Bấm **Thêm sản phẩm** để tìm theo tên/mã và tick nhiều sản phẩm; sắp ↑ ↓ hoặc gỡ trong form rồi Lưu. Các đường dẫn `all`, `new-arrival`, `best-seller`, `sale` là bộ sưu tập tự động, không dùng làm slug thủ công. Xóa bộ sưu tập không xóa sản phẩm. Danh sách phân trang 20 mục.
- **Banner:** tải riêng ảnh desktop/mobile, nhập alt/link/chữ nút, kiểm tra cả hai bản xem trước; ảnh lệch tỉ lệ gợi ý có cảnh báo. Thời gian bắt đầu/kết thúc nhập theo **giờ Việt Nam**; để trống là không giới hạn. Banner chỉ được hiện khi bật hiển thị và đang trong khoảng lịch chạy. Có đổi thứ tự, sửa, xóa qua xác nhận.
- **Cài đặt** chỉ admin: mỗi nhóm có nút Lưu riêng. Nhóm Thông báo & cam kết có ba khối lưu riêng cho thông báo, cam kết và tóm tắt đổi trả; thêm/xóa/sắp xếp bằng nút tương ứng.
- **Vận chuyển:** nhập phí nguyên VND; để trống một ngưỡng freeship để tắt ngưỡng đó. Đạt số lượng hoặc tổng tiền cấu hình thì được miễn phí vận chuyển. Để trống cả hai để tắt freeship.
- **Thanh toán:** chọn ngân hàng từ danh sách BIN VietQR lưu sẵn trong code, điền số tài khoản và chủ tài khoản. Tên chủ tài khoản tự chuyển in hoa/không dấu. QR xem trước dùng **10.000₫**, chỉ để kiểm tra thông tin, không cần chuyển tiền. Chuyển khoản chỉ bật khi đủ thông tin.
- **Pháp lý/SEO:** chỉ điền thông tin đã có; logo shop, logo BCT và ảnh chia sẻ có thể upload bằng chế độ giữ tỉ lệ. Không tự thêm thông tin pháp lý hoặc kênh liên hệ không có thật. Cấu hình số giờ tự hủy đơn hiện chỉ được lưu, chưa chạy tác vụ tự hủy của Phase 14.
- Sau khi lưu, cache liên quan được xóa ngay. Không cần deploy lại khi sửa phí ship/liên hệ/banner. Trang chủ Phase 6 đã đọc các service public này; API gợi ý có cache CDN tối đa 60 giây theo kiến trúc. Bản GitHub Pages minh họa vẫn độc lập với Supabase.

Danh sách ngân hàng được lấy từ API VietQR ngày 28/10/2026 và lưu tại `src/lib/banks.ts`. Khi ngân hàng đổi BIN/tên, cập nhật từ nguồn chính thức rồi kiểm tra lại QR trước khi mở bán.

## Database và triển khai

PostgreSQL dùng được; Supabase trong plan cung cấp PostgreSQL và Storage. Phase 1 đã có đủ 20 bảng, migration bật `pg_trgm`, RLS không có policy và seed chạy lại được. Schema auth sinh từ CLI Better Auth 1.7.14 qua `npm run db:auth`; script tự chuẩn hóa tên cột, thời gian và RLS theo thiết kế, không tự viết tay bảng auth.

Máy phát triển hiện đã có kết nối Supabase dev trong `.env`: `DATABASE_URL` (transaction pooler), `DIRECT_URL` (session pooler), `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (chấp nhận Secret key mới `sb_secret_...`) và tài khoản admin ban đầu `ADMIN_SEED_EMAIL`/`ADMIN_SEED_PASSWORD`. Không dùng thông tin production để thử nghiệm. Mật khẩu admin nằm trong `.env` riêng, không hiển thị trong README hoặc Git.

```bash
npm run db:migrate
npm run db:seed -- --sample
npm run db:studio
```

Seed chỉ thêm dữ liệu còn thiếu, giữ nguyên cài đặt, giá, mật khẩu và tồn kho đã có. Không dùng `--sample` trong production. Seed thông thường không có `--sample` chỉ thêm cài đặt và admin còn thiếu. CLI của Drizzle chạy với điều kiện `react-server` để tôn trọng `server-only`.

## Database kiểm thử riêng

Cần Docker Desktop đang chạy. Database này chỉ phục vụ kiểm thử; các bài integration sẽ xóa dữ liệu của nó. Tuyệt đối không trỏ `TEST_DATABASE_URL` vào database dev/prod.

```bash
npm run db:test:setup
docker compose --env-file .env.test.local -f compose.test.yml up -d
npm run test
```

Script tạo `.env.test.local` với mật khẩu ngẫu nhiên, không ghi đè file đã tồn tại. Vitest đọc kết nối kiểm thử từ file đó hoặc `TEST_DATABASE_URL`; thiếu kết nối thì bỏ qua integration test. Kiểm thử yêu cầu tên database kết thúc bằng `_test` và từ chối địa chỉ trùng database dev/prod. Database Docker chỉ mở tại `127.0.0.1:55432`.

Dừng database khi không dùng: `docker compose --env-file .env.test.local -f compose.test.yml stop`. Dữ liệu kiểm thử được giữ trong volume riêng.

Chỉ chạy local ở giai đoạn này. GitHub đã có repo công khai và remote `origin`; chưa tạo hosting. `vercel.json` chỉ lưu region dự kiến trong plan, không triển khai gì. Các file `.env*` trừ `.env.example` được Git bỏ qua.

Đọc [báo cáo Phase 0](docs/PHASE-0-REPORT.md), [Phase 1](docs/PHASE-1-REPORT.md), [Phase 2](docs/PHASE-2-REPORT.md), [Phase 3](docs/PHASE-3-REPORT.md), [Phase 4](docs/PHASE-4-REPORT.md) và [Phase 5](docs/PHASE-5-REPORT.md) để xem trạng thái nghiệm thu.
