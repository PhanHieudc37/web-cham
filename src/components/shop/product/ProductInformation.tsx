import Link from "next/link";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Gift, MessageCircle, RefreshCw, ShieldCheck, Truck, Wallet } from "lucide-react";
import type { ProductDetailDTO, PublicSettingsDTO } from "@/types/dto";
import { SizeChartTable } from "./SizeChartTable";

export function ProductPolicies({ policies }: { policies: PublicSettingsDTO["policies"] }) {
  const icons = { truck: Truck, refresh: RefreshCw, wallet: Wallet, message: MessageCircle, shield: ShieldCheck, gift: Gift };
  if (!policies.length) return null;
  return <ul className="my-7 space-y-3 border-y py-5">{policies.map((policy, index) => { const Icon = icons[policy.icon]; return <li key={index} className="flex items-center gap-3 text-xs leading-6"><Icon size={18} strokeWidth={1.4} className="shrink-0" />{policy.text}</li>; })}</ul>;
}
export function ProductInformation({ product, returnPolicySummary }: { product: ProductDetailDTO; returnPolicySummary: string }) {
  return <Accordion type="multiple" defaultValue={["description"]} className="mt-6">
    <AccordionItem value="description"><AccordionTrigger className="py-5 text-xs font-semibold tracking-wider">MÔ TẢ SẢN PHẨM</AccordionTrigger><AccordionContent className="h-auto!">
      <p className="whitespace-pre-line text-sm leading-8 text-muted">{product.description || "Thông tin sản phẩm đang được cập nhật."}</p>
    </AccordionContent></AccordionItem>
    {(product.material || product.fit || product.care.length > 0) && <AccordionItem value="care"><AccordionTrigger className="py-5 text-xs font-semibold tracking-wider">CHẤT LIỆU & BẢO QUẢN</AccordionTrigger><AccordionContent className="h-auto! space-y-3 text-sm leading-7 text-muted">
      {product.material && <p>Chất liệu: {product.material}</p>}{product.fit && <p>Kiểu dáng: {product.fit}</p>}{product.care.length > 0 && <ul className="list-disc space-y-2 pl-4">{product.care.map((instruction, index) => <li key={index}>{instruction}</li>)}</ul>}
    </AccordionContent></AccordionItem>}
    <AccordionItem value="size"><AccordionTrigger className="py-5 text-xs font-semibold tracking-wider">BẢNG SIZE</AccordionTrigger><AccordionContent className="h-auto!"><SizeChartTable chart={product.sizeChart} /></AccordionContent></AccordionItem>
    <AccordionItem value="returns"><AccordionTrigger className="py-5 text-xs font-semibold tracking-wider">CHÍNH SÁCH ĐỔI TRẢ</AccordionTrigger><AccordionContent className="h-auto! text-sm leading-7 text-muted">
      {returnPolicySummary && <p className="whitespace-pre-line">{returnPolicySummary}</p>}<Link href="/chinh-sach-doi-tra" className="mt-3 inline-block underline underline-offset-4">Xem chính sách đổi trả</Link>
    </AccordionContent></AccordionItem>
  </Accordion>;
}
