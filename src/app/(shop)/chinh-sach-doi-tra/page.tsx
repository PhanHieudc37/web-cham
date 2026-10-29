// TODO: chủ shop duyệt lại nội dung
import type { Metadata } from "next";
import Link from "next/link";
import { getPublicSettings } from "@/server/services/settings.service";
import { InformationPage } from "@/components/shop/information/InformationPage";

export const metadata: Metadata = { title: "Chính sách đổi trả | Cham.stu", description: "Hướng dẫn liên hệ và chuẩn bị thông tin khi cần đổi hoặc trả sản phẩm." };
export default async function ReturnsPage() {
  const { returnPolicySummary } = await getPublicSettings();
  return <InformationPage title="Chính sách đổi trả" draft>{returnPolicySummary && <p className="border border-line p-4 whitespace-pre-line">{returnPolicySummary}</p>}<section><h2>Khi bạn cần đổi hoặc trả hàng</h2><p>Vui lòng liên hệ shop sớm sau khi nhận hàng nếu sản phẩm giao sai, có vấn đề hoặc bạn cần tư vấn đổi size. Trước khi gửi hàng về, hãy chờ shop kiểm tra và xác nhận phương án tiếp nhận.</p></section><section><h2>Thông tin cần chuẩn bị</h2><ul><li>Mã đơn hàng và số điện thoại dùng khi đặt hàng.</li><li>Tên sản phẩm, màu, size và lý do đề nghị đổi/trả.</li><li>Giữ sản phẩm, tem nhãn và bao bì để shop có thể kiểm tra tình trạng. Khi được yêu cầu, cung cấp ảnh sản phẩm qua kênh liên hệ của shop.</li></ul></section><section><h2>Quy trình xử lý</h2><p>Gửi yêu cầu qua <Link href="/lien-he">trang liên hệ</Link>. Shop sẽ đối chiếu đơn, kiểm tra tình trạng và thông báo điều kiện, thời hạn, phí vận chuyển cùng phương án đổi hoặc hoàn tiền phù hợp trước khi bạn gửi hàng. Không tự gửi về địa chỉ chưa được xác nhận.</p></section><section><h2>Theo dõi yêu cầu</h2><p>Bạn có thể <Link href="/kiem-tra-don-hang">kiểm tra trạng thái đơn</Link>. Trạng thái hoàn trả và trạng thái hoàn tiền được theo dõi riêng; hãy liên hệ nếu cần đối chiếu khoản tiền đã nhận lại.</p></section></InformationPage>;
}
