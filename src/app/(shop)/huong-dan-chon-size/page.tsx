import type { Metadata } from "next";
import Link from "next/link";
import { getSizeCharts } from "@/server/services/information.service";
import { InformationPage } from "@/components/shop/information/InformationPage";
import { SizeChartTable } from "@/components/shop/product/SizeChartTable";

export const metadata: Metadata = { title: "Hướng dẫn chọn size | Cham.stu", description: "Cách đo và các bảng kích thước sản phẩm hiện có tại Cham.stu." };
export default async function SizeGuidePage() {
  const charts = await getSizeCharts();
  return <InformationPage title="Hướng dẫn chọn size"><section><h2>Đo một món đồ bạn mặc vừa</h2><p>Đặt áo hoặc quần trên mặt phẳng, vuốt nhẹ để vải không nhăn và không kéo giãn. Dùng thước dây đo các vị trí theo bảng size của sản phẩm: ngang ngực, dài áo, vai, eo hoặc dài quần. Giữ cùng đơn vị với bảng; phân biệt số đo ngang và số đo vòng trước khi so sánh.</p></section><section><h2>Đối chiếu đúng bảng của sản phẩm</h2><p>Các mẫu có thể dùng form và bảng size khác nhau. Hãy mở chi tiết sản phẩm để xem bảng đang áp dụng, chất liệu và form dáng. Nếu nằm giữa hai size hoặc muốn mặc rộng hơn, <Link href="/lien-he">gửi tên sản phẩm và số đo cho shop</Link> để được tư vấn.</p></section><section className="min-w-0 space-y-7"><h2>Bảng kích thước hiện có</h2>{charts.length ? charts.map((chart) => <section key={chart.id} className="min-w-0 border border-line p-4"><SizeChartTable chart={chart} /></section>) : <p className="bg-surface p-4 text-sm text-muted">Shop đang cập nhật bảng kích thước. Vui lòng liên hệ để được tư vấn trước khi đặt hàng.</p>}</section></InformationPage>;
}
