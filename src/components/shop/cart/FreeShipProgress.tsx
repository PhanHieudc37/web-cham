import { Truck } from "lucide-react";
import { formatPrice } from "@/lib/format";
import type { CartQuoteDTO } from "@/types/dto";

export function FreeShipProgress({ quote }: { quote: CartQuoteDTO }) {
  const { freeShip, itemCount, subtotal } = quote;
  if (!freeShip.eligible && freeShip.remainingItems === null && freeShip.remainingAmount === null) return null;
  const byItems = freeShip.remainingItems !== null;
  const remaining = byItems ? freeShip.remainingItems! : freeShip.remainingAmount!;
  // Presentation of the server's progress only; no prices or shipping fees are calculated here.
  const current = byItems ? itemCount : subtotal;
  const percent = freeShip.eligible ? 100 : current + remaining > 0 ? Math.floor(current / (current + remaining) * 100) : 0;
  return <div className="border-b bg-image-bg p-4 text-xs leading-6" data-testid="free-ship-progress">
    <p className="flex items-start gap-2"><Truck size={18} className="mt-1 shrink-0" /><span>{freeShip.eligible ? "Bạn đã được miễn phí vận chuyển" : <>Mua thêm <strong>{byItems ? `${remaining} sản phẩm` : formatPrice(remaining)}</strong> để được miễn phí vận chuyển</>}</span></p>
    <div role="progressbar" aria-label="Tiến độ miễn phí vận chuyển" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} className="mt-3 h-1 bg-black/10"><div className="h-full bg-fg transition-[width] motion-reduce:transition-none" style={{ width: `${percent}%` }} /></div>
  </div>;
}
