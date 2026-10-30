import Link from "next/link";
import { ChevronDown, Gift, MessageCircle, RefreshCw, ShieldCheck, Truck, Wallet } from "lucide-react";
import type { ProductDetailDTO, PublicSettingsDTO } from "@/types/dto";
import { SizeChartTable } from "./SizeChartTable";

export function ProductPolicies({ policies }: { policies: PublicSettingsDTO["policies"] }) {
  const icons = { truck: Truck, refresh: RefreshCw, wallet: Wallet, message: MessageCircle, shield: ShieldCheck, gift: Gift };
  if (!policies.length) return null;
  return <ul className="my-7 space-y-3 border-y py-5">{policies.map((policy, index) => { const Icon = icons[policy.icon]; return <li key={index} className="flex items-center gap-3 text-xs leading-6"><Icon size={18} strokeWidth={1.4} className="shrink-0" />{policy.text}</li>; })}</ul>;
}
function InformationSection({ title, children, open = false }: { title: string; children: React.ReactNode; open?: boolean }) {
  return <details open={open} className="group border-b"><summary className="cursor-pointer list-none py-5 [&::-webkit-details-marker]:hidden"><h2 className="flex items-center justify-between gap-3 text-xs font-semibold tracking-wider">{title}<ChevronDown size={16} aria-hidden="true" className="shrink-0 transition-transform group-open:rotate-180" /></h2></summary><div className="space-y-3 pb-5 text-sm leading-7 text-muted">{children}</div></details>;
}
export function ProductInformation({ product, returnPolicySummary }: { product: ProductDetailDTO; returnPolicySummary: string }) {
  return <div className="mt-6"><InformationSection title="MÔ TẢ SẢN PHẨM" open><p className="whitespace-pre-line leading-8">{product.description || "Thông tin sản phẩm đang được cập nhật."}</p></InformationSection>
    {(product.material || product.fit || product.care.length > 0) && <InformationSection title="CHẤT LIỆU & BẢO QUẢN">{product.material && <p>Chất liệu: {product.material}</p>}{product.fit && <p>Kiểu dáng: {product.fit}</p>}{product.care.length > 0 && <ul className="list-disc space-y-2 pl-4">{product.care.map((instruction, index) => <li key={index}>{instruction}</li>)}</ul>}</InformationSection>}
    <InformationSection title="BẢNG SIZE"><SizeChartTable chart={product.sizeChart} /></InformationSection><InformationSection title="CHÍNH SÁCH ĐỔI TRẢ">{returnPolicySummary && <p className="whitespace-pre-line">{returnPolicySummary}</p>}<Link href="/chinh-sach-doi-tra" className="mt-3 inline-block underline underline-offset-4">Xem chính sách đổi trả</Link></InformationSection></div>;
}
