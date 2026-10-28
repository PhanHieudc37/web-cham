# Báo cáo Phase 2 — Logic nghiệp vụ và services

Ngày: **28/10/2026**. Phase không có giao diện mới.

## Đã làm

- Hàm thuần tính tiền VND, phí vận chuyển/freeship, phần trăm giảm, thứ tự size, SKU/khả năng mua và máy trạng thái đơn. Chuẩn hóa tiếng Việt/SĐT, định dạng tiền/ngày giờ Việt Nam, che SĐT, slug và VietQR.
- Schema zod dùng chung cho giỏ/checkout, tra cứu, sản phẩm/biến thể/ảnh, danh mục, bộ sưu tập, banner, cài đặt, liên hệ và thao tác đơn/kho. Lỗi mặc định dùng locale tiếng Việt; không cho dùng mã giảm giá Phase 14.
- Catalog đọc SQL: điều kiện sản phẩm/danh mục cha đang bán, bốn collection tự động và collection thủ công, bộ lọc cùng biến thể màu-size, thứ tự/phân trang, facets toàn danh sách, tìm kiếm không dấu theo AND + similarity. Sản phẩm hết hàng luôn cuối; DTO public không lộ stock chính xác ngoài ngưỡng sắp hết hàng.
- Cài đặt có schema, mặc định và DTO public; helpers `AppError`, `runAction`, rate limit atomic trong PostgreSQL, cache có tag/invalidate theo API Next.js 16.4.3 cài tại máy.
- Quote đọc DB trực tiếp. Đặt đơn khóa biến thể theo thứ tự, kiểm tra tồn/giá/phí ship/ngân hàng ở server, ghi snapshot + tồn kho + sold count + lịch sử trong một transaction. Khóa idempotency riêng chống hai request đồng thời tạo hai đơn.
- Chuyển trạng thái có khóa đơn, hoàn kho khi hủy/hoàn trả đúng một lần, COD hoàn thành tự ghi nhận tiền. Thanh toán/hoàn tiền không tự đổi trạng thái giao hàng. Sửa tồn theo delta giữ được số trừ của đơn đến đồng thời.
- Tra cứu mã + SĐT được rate limit, che số và ẩn địa chỉ/ghi chú nội bộ. Trang thành công có dữ liệu riêng qua token được kiểm tra SHA-256; service admin tách DTO.

## Nghiệm thu

| Kiểm tra | Kết quả |
|---|---|
| `npm run lint` / `npm run typecheck` | Pass, không warning |
| `npm run test` | **66/66 pass**, 7 file; có 23 integration trên PostgreSQL 16 local |
| `npm run build` | Pass |
| Đặt đơn trừ kho và snapshot/ledger | Pass |
| Hai khách tranh sản phẩm cuối | Đúng 1 thành công, bên còn lại `OUT_OF_STOCK` |
| Gửi đồng thời cùng idempotency key | Một đơn, một lần trừ kho, cùng mã và token |
| Đổi giá hoặc phí ship trước khi đặt | `PRICE_CHANGED`, quote mới, không ghi đơn/trừ kho |
| Hủy đồng thời / hoàn trả | Hoàn kho và trừ sold count một lần, ghi lịch sử |
| Chuyển sai trạng thái / thiếu lý do hủy | Chặn, không thay tồn kho |
| Sửa kho đồng thời với checkout | Giữ cả delta nhập kho và số lượng đơn đã trừ |
| Xác nhận COD / ghi nhận tiền / hoàn tiền | Pass, không tự thay trạng thái giao hàng |
| Catalog, tìm kiếm, facets, phân trang, filter không hợp lệ, banner theo lịch | Pass trên DB thật |
| Token sai / SĐT sai / nội dung riêng / snapshot sau xóa sản phẩm | Pass |
| Rate limit đồng thời và hết hạn | Pass |

Test dùng `.env.test.local` và database riêng `cham_stu_test`, có chặn địa chỉ dev/prod và yêu cầu hậu tố `_test`. Không truncate hoặc tạo đơn kiểm thử trên Supabase của shop. Các file integration chạy tuần tự để tránh hai suite xóa fixture của nhau; các request cạnh tranh trong từng test vẫn chạy đồng thời.

Phase không thay đổi UI nên không áp dụng kiểm tra responsive 375/768/1280px. Không đổi schema hoặc migration đã áp dụng; cài đặt mặc định được đưa về schema dùng chung, seed giữ nguyên giá trị.

## Điểm cần giải thích trong tài liệu

- DATABASE 4.8 yêu cầu retry idempotency trả lại kết quả, trong khi 4.9 yêu cầu token ngẫu nhiên chỉ trả một lần và chỉ lưu hash. Hash không thể đảo để khôi phục token nếu response lần đầu bị mất. Triển khai dùng HMAC-SHA256 với secret server và hai UUID, cho token bí mật 32 byte và trả lại được cùng token khi retry. Chỉ hash được lưu trong DB. Mục 4.9 đã ghi rõ lựa chọn; kiểm thử xác nhận hai request cùng key nhận cùng token. Xoay secret không vô hiệu token đã cấp nhưng retry đơn cũ yêu cầu tra cứu mã + SĐT.
- Công thức phí ship trong DATABASE 4.7 không ghi riêng giỏ trống: quote giỏ trống hoặc toàn dòng không hợp lệ có tổng/phí ship bằng 0, tránh hiển thị khoản phải trả khi chưa có hàng. Checkout vẫn yêu cầu ít nhất một dòng hợp lệ.
- Luồng minh họa trong DATABASE 4.8 đặt rate limit/honeypot trước parse, còn AGENTS yêu cầu endpoint validate trước kiểm tra quyền/service. Phase này chỉ có services, chưa mở endpoint; các action/route ở phase sau phải validate ở biên theo AGENTS. Service đặt đơn vẫn tự parse để bảo vệ lời gọi nội bộ.
- `unstable_cache` vẫn được Next.js 16.4.3 hỗ trợ khi chưa bật Cache Components; `invalidate` dùng `revalidateTag(tag, { expire: 0 })`, không dùng chữ ký một đối số đã deprecated. Quote/checkout/đơn/admin không cache.

## Chưa làm và chủ shop cần cung cấp

- Chưa làm đăng nhập/khung admin (Phase 3), CRUD/giao diện cửa hàng, endpoint checkout, email/thông báo hoặc các bước giao diện Phase 4–13. Services được kiểm thử trực tiếp; chưa nhận đơn thật từ khách. Không thực hiện Phase 14 hoặc deploy production.
- Supabase dev và bucket ảnh đã sẵn sàng từ Phase 1; Phase 2 không cần thêm key hay thông tin. Ảnh, sản phẩm, thông tin shop/ngân hàng và chính sách thật cần chủ shop duyệt ở các phase liên quan.
- Bản GitHub Pages vẫn là bản duyệt thiết kế độc lập để góp ý, không phải web vận hành bán hàng. Các bước tiếp theo theo quy trình giao và nghiệm thu từng phase trong PLAN.
