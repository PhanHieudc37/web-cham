"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { LoaderCircle } from "lucide-react";
import { checkoutSchema, type CheckoutInput } from "@/lib/validation/checkout";
import { moneySchema } from "@/lib/validation/common";
import { SORTED_PROVINCES } from "@/lib/provinces";
import { getCheckoutKey, clearCheckoutKey } from "@/lib/checkout-session";
import { formatPrice } from "@/lib/format";
import { useCartStore } from "@/store/cart";
import { useCartQuote } from "@/hooks/use-cart-quote";
import { placeOrderAction } from "@/server/actions/shop/checkout";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { OrderSummary } from "./OrderSummary";

type FormValues = z.input<typeof checkoutSchema>;
const priceErrorSchema = z.object({ total: moneySchema });
const stockErrorSchema = z.array(z.object({ variantId: z.string(), available: z.number().int().min(0) }));
const fields = ["customerName", "customerPhone", "customerEmail", "province", "ward", "addressLine", "note", "paymentMethod", "acceptedPolicies", "lines", "idempotencyKey", "expectedTotal", "website"] as const;

export function CheckoutForm({ bankTransferEnabled, shopPhone }: { bankTransferEnabled: boolean; shopPhone: string }) {
  const hydrated = useCartStore((state) => state.hasHydrated), lines = useCartStore((state) => state.lines), note = useCartStore((state) => state.note);
  const { quote, ready, refresh, error: quoteError } = useCartQuote();
  const router = useRouter(), submitted = useRef(false), successful = useRef(false), noteInitialized = useRef(false);
  const [busy, setBusy] = useState(false), [stockErrors, setStockErrors] = useState<{ variantId: string; available: number }[]>([]), [message, setMessage] = useState("");
  const [priceChange, setPriceChange] = useState<{ previous: number; next: number } | null>(null);
  const form = useForm<FormValues, unknown, CheckoutInput>({ resolver: zodResolver(checkoutSchema), defaultValues: { lines: [], expectedTotal: 0, idempotencyKey: "", customerName: "", customerPhone: "", customerEmail: "", ward: "", addressLine: "", note: "", paymentMethod: "cod", acceptedPolicies: false, website: "" } });
  const key = useWatch({ control: form.control, name: "idempotencyKey" });
  const expectedTotal = useWatch({ control: form.control, name: "expectedTotal" });
  useEffect(() => { form.setValue("idempotencyKey", getCheckoutKey()); }, [form]);
  useEffect(() => {
    if (!hydrated) return;
    if (!lines.length && !successful.current) { router.replace("/cart"); return; }
    form.setValue("lines", lines);
    if (!noteInitialized.current) { form.setValue("note", note); noteInitialized.current = true; }
  }, [hydrated, lines, note, router, form]);
  useEffect(() => { if (quote) form.setValue("expectedTotal", quote.total); }, [quote, form]);
  const blocked = !ready || !quote?.itemCount || expectedTotal !== quote.total || quote.lines.some((line) => line.issue === "OUT_OF_STOCK" || line.issue === "UNAVAILABLE");
  async function submit(values: CheckoutInput, expectedTotal = values.expectedTotal) {
    if (submitted.current || blocked) return;
    submitted.current = true; setBusy(true); setMessage(""); setStockErrors([]);
    try {
      const result = await placeOrderAction({ ...values, expectedTotal });
      if (!result.ok) {
        if (result.error.fields) for (const field of fields) if (result.error.fields[field]) form.setError(field, { message: result.error.fields[field] });
        setMessage(result.error.message);
        if (result.error.code === "PRICE_CHANGED") { const changed = priceErrorSchema.safeParse(result.error.details); if (changed.success) setPriceChange({ previous: expectedTotal, next: changed.data.total }); refresh(); }
        else if (result.error.code === "OUT_OF_STOCK") { const changed = stockErrorSchema.safeParse(result.error.details); if (changed.success) setStockErrors(changed.data); refresh(); }
        else if (result.error.code === "INTERNAL" || result.error.code === "RATE_LIMITED") toast.error(`${result.error.message}${shopPhone ? ` Liên hệ shop: ${shopPhone}.` : ""}`);
        return;
      }
      successful.current = true;
      useCartStore.getState().clear(); clearCheckoutKey();
      router.replace(`/checkout/success?${new URLSearchParams({ code: result.data.orderCode, t: result.data.accessToken })}`);
    } catch { setMessage("Chưa gửi được đơn hàng. Vui lòng kiểm tra kết nối và thử lại; giỏ hàng vẫn được giữ nguyên."); }
    finally { submitted.current = false; setBusy(false); }
  }
  const errorFor = (field: keyof FormValues) => form.formState.errors[field]?.message;
  const inputClass = "mt-2 h-12 w-full border bg-white px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2";
  if (!hydrated || !lines.length) return <p role="status" className="py-12 text-center text-sm text-muted">Đang tải giỏ hàng…</p>;
  return <div data-checkout-ready={Boolean(key) && !blocked} className="grid min-w-0 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-16">
    <div className="min-w-0 lg:order-2"><OrderSummary /></div>
    <form onSubmit={(event) => { void form.handleSubmit((values) => submit(values), () => setMessage("Vui lòng kiểm tra các ô thông tin bên dưới."))(event); }} noValidate className="min-w-0 lg:order-1">
      <h1 className="mb-8 text-xl font-semibold tracking-wider">THÔNG TIN GIAO HÀNG</h1>
      <fieldset disabled={busy} className="space-y-5">
        {([ ["customerName", "Họ và tên *", "name", "text"], ["customerPhone", "Số điện thoại *", "tel", "tel"], ["customerEmail", "Email nhận xác nhận đơn", "email", "email"] ] as const).map(([name, label, autoComplete, type]) => <div key={name}><label htmlFor={`checkout-${name}`} className="text-sm">{label}</label><input id={`checkout-${name}`} type={type} autoComplete={autoComplete} maxLength={name === "customerName" ? 60 : name === "customerEmail" ? 254 : 30} {...form.register(name)} aria-invalid={Boolean(errorFor(name))} aria-describedby={errorFor(name) ? `${name}-error` : undefined} className={inputClass} />{errorFor(name) && <p id={`${name}-error`} className="mt-2 text-xs text-sale">{errorFor(name)}</p>}</div>)}
        <div className="grid gap-5 sm:grid-cols-2"><div><label htmlFor="checkout-province" className="text-sm">Tỉnh / Thành phố *</label><select id="checkout-province" defaultValue="" autoComplete="address-level1" {...form.register("province")} aria-invalid={Boolean(errorFor("province"))} aria-describedby={errorFor("province") ? "province-error" : undefined} className={inputClass}><option value="" disabled>Chọn tỉnh / thành phố</option>{SORTED_PROVINCES.map((province) => <option key={province}>{province}</option>)}</select>{errorFor("province") && <p id="province-error" className="mt-2 text-xs text-sale">{errorFor("province")}</p>}</div><div><label htmlFor="checkout-ward" className="text-sm">Phường / Xã *</label><input id="checkout-ward" autoComplete="address-level2" maxLength={80} {...form.register("ward")} aria-invalid={Boolean(errorFor("ward"))} aria-describedby={errorFor("ward") ? "ward-error" : undefined} className={inputClass} />{errorFor("ward") && <p id="ward-error" className="mt-2 text-xs text-sale">{errorFor("ward")}</p>}</div></div>
        <div><label htmlFor="checkout-address" className="text-sm">Địa chỉ cụ thể *</label><input id="checkout-address" autoComplete="street-address" maxLength={200} {...form.register("addressLine")} aria-invalid={Boolean(errorFor("addressLine"))} aria-describedby={errorFor("addressLine") ? "addressLine-error" : undefined} className={inputClass} />{errorFor("addressLine") && <p id="addressLine-error" className="mt-2 text-xs text-sale">{errorFor("addressLine")}</p>}</div>
        <div><label htmlFor="checkout-note" className="text-sm">Ghi chú đơn hàng</label><textarea id="checkout-note" rows={3} maxLength={500} {...form.register("note")} className="mt-2 w-full resize-y border p-3 text-sm" />{errorFor("note") && <p className="mt-2 text-xs text-sale">{errorFor("note")}</p>}</div>
        <fieldset className="space-y-3 pt-4"><legend className="mb-4 text-sm font-semibold tracking-wider">PHƯƠNG THỨC THANH TOÁN</legend><label className="flex min-h-16 items-center gap-3 border p-4 text-sm"><input type="radio" value="cod" {...form.register("paymentMethod")} className="size-4 accent-black" />Thanh toán khi nhận hàng (COD)</label>{bankTransferEnabled && <label className="flex min-h-16 items-center gap-3 border p-4 text-sm"><input type="radio" value="bank_transfer" {...form.register("paymentMethod")} className="size-4 accent-black" />Chuyển khoản ngân hàng</label>}{errorFor("paymentMethod") && <p className="text-xs text-sale">{errorFor("paymentMethod")}</p>}</fieldset>
        <div className="pt-2"><label className="flex items-start gap-3 text-xs leading-6"><input type="checkbox" {...form.register("acceptedPolicies")} aria-describedby={errorFor("acceptedPolicies") ? "acceptedPolicies-error" : undefined} className="mt-1 size-4 shrink-0 accent-black" /><span>Tôi đồng ý với <Link href="/chinh-sach-bao-mat" target="_blank" rel="noopener noreferrer" className="underline">Chính sách bảo mật</Link> và <Link href="/dieu-khoan-dich-vu" target="_blank" rel="noopener noreferrer" className="underline">Điều khoản dịch vụ</Link></span></label>{errorFor("acceptedPolicies") && <p id="acceptedPolicies-error" className="mt-2 text-xs text-sale">{errorFor("acceptedPolicies")}</p>}</div>
        <div aria-hidden="true" className="absolute -left-[10000px] size-px overflow-hidden"><label htmlFor="checkout-website">Website</label><input id="checkout-website" tabIndex={-1} autoComplete="off" {...form.register("website")} /></div>
        {message && <div role="alert" className="border border-sale p-4 text-xs leading-6 text-sale">{message}{stockErrors.length > 0 && <ul className="mt-2 list-disc pl-4">{stockErrors.map((line) => <li key={line.variantId}>{quote?.lines.find((item) => item.variantId === line.variantId)?.name ?? "Sản phẩm"}: chỉ còn {line.available} sản phẩm</li>)}</ul>}</div>}
        {(blocked || stockErrors.length > 0) && <div className="border p-4 text-xs leading-6"><p>{quoteError ?? "Vui lòng kiểm tra sản phẩm và cập nhật giỏ hàng trước khi đặt đơn."}</p><button type="button" onClick={refresh} className="mr-4 min-h-10 underline">Cập nhật giỏ hàng</button><Link href="/cart" className="underline">Quay lại giỏ hàng</Link></div>}
        <button type="submit" disabled={busy || blocked || !key} className="shop-button shop-button-primary w-full gap-2 disabled:cursor-not-allowed disabled:opacity-40">{busy ? <><LoaderCircle size={16} className="animate-spin motion-reduce:animate-none" />ĐANG GỬI ĐƠN…</> : "ĐẶT HÀNG"}</button>
      </fieldset>
      <Dialog open={Boolean(priceChange)} onOpenChange={(open) => { if (!open && !busy) setPriceChange(null); }}><DialogContent className="shop-dialog max-h-[85dvh] overflow-y-auto rounded-none p-6"><DialogTitle className="pr-6 text-lg font-semibold uppercase">Giá sản phẩm vừa thay đổi</DialogTitle><DialogDescription>Vui lòng kiểm tra tổng tiền mới trước khi xác nhận đặt hàng.</DialogDescription>{priceChange && <><dl className="space-y-3 text-sm"><div className="flex justify-between gap-4"><dt>Tổng tiền trước</dt><dd>{formatPrice(priceChange.previous)}</dd></div><div className="flex justify-between gap-4 font-semibold"><dt>Tổng tiền mới</dt><dd>{formatPrice(priceChange.next)}</dd></div></dl><button type="button" disabled={busy || blocked} onClick={() => { void form.handleSubmit((values) => submit(values, priceChange.next))(); }} className="shop-button shop-button-primary w-full disabled:opacity-40">Đồng ý và đặt hàng</button></>}</DialogContent></Dialog>
    </form>
  </div>;
}
