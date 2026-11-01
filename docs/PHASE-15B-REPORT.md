# Phase 15B — Cache cửa hàng và giảm request

Thực hiện tiếp theo yêu cầu tối ưu tốc độ bằng gói Free, sau 15.0/15A. Không tạo/pause project, đổi env Netlify hoặc thêm thư viện/schema. Chưa coi hoàn tất cho tới khi kiểm tra production và ghi số đo bên dưới.

## Thay đổi

- Danh mục ISR một ngày, layout/page/metadata chia sẻ dataset bằng React cache; HTML có 12 card đầu. Bộ lọc/sort/phân trang xử lý trong trình duyệt, giữ URL, canonical và 404. Cảnh báo dataset trên 500 sản phẩm lúc build/ISR; không cắt mất dữ liệu.
- `/search` tĩnh, dùng chung `/search-index.json` với overlay, một lần mỗi tab. Bỏ endpoint suggest và các lượt ghi rate limit theo phím gõ. Index chỉ có card công khai; không có tồn thô, khách hoặc session. Tắt viewport prefetch ở card/layout để đổi kết quả không phát sinh request ngầm.
- Availability no-store: một SELECT kiểm tra phạm vi hiển thị và trả giá/giới hạn từng size. Chặn mua tới khi có dữ liệu mới; lỗi có retry. Quote và chốt đơn vẫn tính/kiểm tra trực tiếp ở server.
- Đặt/hủy/hoàn đơn chỉ invalidate catalog khi sản phẩm chuyển giữa còn hàng và hết hàng hoàn toàn. Khóa sản phẩm theo thứ tự sau biến thể để nhận đúng chuyển trạng thái khi mua đồng thời; idempotent retry không invalidate lại. Bán chạy/soldCount có thể chậm tới TTL hoặc thao tác sửa tiếp theo.
- TTL cache mặc định một ngày, home một giờ để banner hẹn giờ đổi trong vòng một giờ. Quote và rate limit chạy song song, giữ ưu tiên lỗi rate limit kể cả khi quote lỗi sớm hơn.
- Warm admin trong `after`, tối đa 10 path public, timeout 10 giây/path và tổng 45 giây, không chuyển cookie. Workflow sau deploy đợi health đúng SHA, warm tối đa 200 URL sitemap. Keep-warm mỗi 5 phút, DB mỗi giờ; không có secret trong workflow.

## Kiểm tra

- Đối chiếu 728 tổ hợp danh mục/lọc/sort/phân trang với SQL và các truy vấn tìm kiếm mẫu: pass trên PostgreSQL test riêng.
- Test tồn kho/giá mới, ẩn/nháp, một SELECT, mua đồng thời, hết hàng/hoàn kho và idempotency: pass. Test ban đầu phát hiện tham chiếu cột SQL sai ở truy vấn nhận biết hết hàng; đã sửa và chạy lại thành công.
- Playwright performance: 4 ca pass trên build production local; tại 375/768/1280px bộ lọc <100 ms, không request khi đổi lọc/sort/trang và gõ tìm kiếm sau index, không tràn ngang. Availability chặn mua khi đang chờ/lỗi, cập nhật kho và retry đúng.
- Lint/typecheck/build cuối pass, toàn bộ 225 unit/integration test (39 file) pass. Build xác nhận home 1 giờ, search/index/thông tin 1 ngày, collection/product SSG/ISR. E2E production local 10/10, browsing 9/9, storefront 6/6 và performance cuối 4/4 pass (29 ca), gồm giữ HIT sau đơn thường và nhãn hết hàng sau đơn cuối; không lỗi hydration hoặc tràn ngang. Đã xem ảnh ba độ rộng. Đã sửa H1 trang chủ lặp có từ code cũ và cập nhật selector test accordion native của Phase 12. Đang đưa bản local đã đạt kiểm tra lên hosting để đo; chưa tuyên bố đạt TTFB production.

## Khác biệt tài liệu và giới hạn

- Performance Plan mới thay quy tắc lọc SQL của STOREFRONT cũ. Dùng native `history.replaceState` được Next 16.4.3 hỗ trợ thay `router.replace`: giữ `useSearchParams` nhưng không tạo RSC request, đáp ứng mục tiêu không gọi server. SQL được giữ làm đối chứng và phục vụ home/gợi ý ban đầu.
- Search index là tài nguyên JSON public theo Performance Plan, ngoại lệ hợp đồng ActionResult; route availability và quote vẫn dùng ActionResult. Index giữ tới reload nên thay đổi catalog giữa phiên tìm kiếm không tự cập nhật; mua hàng luôn kiểm tra lại.
- Production chưa có sản phẩm thật, không tạo mẫu hoặc đơn giả để đo. Ca sản phẩm có dữ liệu kiểm tra trên local/test; TTFB/cache sản phẩm production phải đo thêm khi chủ shop nhập hàng.
- GitHub lịch chạy có thể trễ/tự tắt sau 60 ngày không hoạt động. Keep-warm không cam kết loại bỏ mọi cold start và vẫn tiêu request/compute Free (~9.360 probe/30 ngày). Mốc trước 15A còn 221/300 credit; chưa có Usage cuối, không suy đoán số dư. Cần ghi tiêu thụ sau một tuần, không thể nghiệm thu trước thời gian đó.
- Phase 15 đã dùng deploy #1 cho 15A; #2 dành cho 15B khi kiểm tra local đạt, #3 cho 15C, #4 dự phòng. Chưa thay guard/cookie cache hoặc làm 15C.
