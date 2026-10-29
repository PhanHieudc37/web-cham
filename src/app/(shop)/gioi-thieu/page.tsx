// TODO: chủ shop duyệt lại nội dung
import type { Metadata } from "next";
import Link from "next/link";
import { getPublicSettings } from "@/server/services/settings.service";
import { InformationPage } from "@/components/shop/information/InformationPage";

export const metadata: Metadata = { title: "Giới thiệu | Cham.stu", description: "Tìm hiểu về Cham.stu và cách mua sắm tại cửa hàng online." };
export default async function AboutPage() {
  const { shop } = await getPublicSettings();
  return <InformationPage title="Giới thiệu" draft><section><h2>Chào bạn, chúng mình là {shop.name}</h2><p>{shop.description || `${shop.name} là cửa hàng quần áo với không gian mua sắm online để bạn xem sản phẩm, chọn màu và kích thước, đặt hàng và theo dõi đơn tại một nơi.`}</p></section><section><h2>Chọn món đồ phù hợp với bạn</h2><p>Ảnh, mô tả chất liệu, form dáng và bảng size trên từng sản phẩm giúp bạn cân nhắc trước khi đặt hàng. Bạn có thể đối chiếu với một chiếc áo hoặc quần đang mặc vừa để chọn kích thước.</p></section><section><h2>Mua sắm và kết nối</h2><p>Khám phá <Link href="/collections/all">toàn bộ sản phẩm</Link>, xem <Link href="/huong-dan-chon-size">hướng dẫn chọn size</Link> hoặc <Link href="/lien-he">gửi lời nhắn cho shop</Link> nếu cần hỗ trợ. Khi đã đặt hàng, bạn có thể <Link href="/kiem-tra-don-hang">tra cứu đơn</Link> bằng mã đơn và số điện thoại.</p></section></InformationPage>;
}
