"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { useHydrated } from "@/hooks/use-hydrated";
import { orderLookupSchema } from "@/lib/validation/checkout";
import type { OrderPublicDTO } from "@/types/dto";
import { lookupOrderAction } from "@/server/actions/shop/order-lookup";
import { PublicFormField } from "@/components/shop/common/PublicFormField";
import { OrderLookupResult } from "./OrderLookupResult";

export function OrderLookupForm() {
  const hydrated = useHydrated();
  const [order, setOrder] = useState<OrderPublicDTO | null>(null), [message, setMessage] = useState("");
  const pending = useRef(false);
  const form = useForm<z.input<typeof orderLookupSchema>, unknown, z.output<typeof orderLookupSchema>>({ resolver: zodResolver(orderLookupSchema), defaultValues: { code: "", phone: "", website: "" } });
  async function submit(values: z.output<typeof orderLookupSchema>) {
    if (pending.current) return;
    pending.current = true; setOrder(null); setMessage("");
    try {
      const result = await lookupOrderAction(values);
      if (!result.ok) {
        if (result.error.fields) for (const field of ["code", "phone", "website"] as const) if (result.error.fields[field]) form.setError(field, { message: result.error.fields[field] });
        setMessage(result.error.message);
      } else if (result.data) setOrder(result.data);
      else setMessage("Không tìm thấy đơn hàng. Vui lòng kiểm tra lại mã đơn và số điện thoại.");
    } catch { setMessage("Chưa thể tra cứu. Vui lòng thử lại sau."); }
    finally { pending.current = false; }
  }
  return <div className="space-y-10"><form data-ready={hydrated} className="mx-auto max-w-xl border border-line bg-white p-5 sm:p-8" onSubmit={(event) => { void form.handleSubmit(submit)(event); }}>
    <div className="space-y-5"><PublicFormField id="lookup-code" label="Mã đơn hàng" autoComplete="off" autoCapitalize="characters" maxLength={24} error={form.formState.errors.code?.message} {...form.register("code")} /><PublicFormField id="lookup-phone" label="Số điện thoại đặt hàng" type="tel" inputMode="tel" autoComplete="tel" maxLength={20} error={form.formState.errors.phone?.message} {...form.register("phone")} />
      <div className="absolute -left-[10000px]" aria-hidden="true"><label htmlFor="lookup-website">Website<input id="lookup-website" tabIndex={-1} autoComplete="off" {...form.register("website")} /></label></div>
      <button className="shop-button shop-button-primary w-full" disabled={!hydrated || form.formState.isSubmitting}>{form.formState.isSubmitting ? "ĐANG TRA CỨU…" : "TRA CỨU ĐƠN HÀNG"}</button>
      {message && <p role="alert" className="text-sm leading-6 text-sale">{message}</p>}
    </div></form>{order && <OrderLookupResult order={order} />}</div>;
}
