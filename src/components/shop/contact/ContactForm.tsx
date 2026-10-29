"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { useHydrated } from "@/hooks/use-hydrated";
import { CONTACT_SUCCESS_MESSAGE, contactSchema, type ContactInput } from "@/lib/validation/contact";
import { submitContactAction } from "@/server/actions/shop/contact";
import { PublicFormField } from "@/components/shop/common/PublicFormField";

export function ContactForm() {
  const hydrated = useHydrated();
  const [success, setSuccess] = useState(false), [error, setError] = useState("");
  const pending = useRef(false);
  const form = useForm<z.input<typeof contactSchema>, unknown, ContactInput>({ resolver: zodResolver(contactSchema), defaultValues: { name: "", phone: "", email: "", message: "", website: "" } });
  async function submit(values: ContactInput) {
    if (pending.current) return;
    pending.current = true; setError(""); setSuccess(false);
    try {
      const result = await submitContactAction(values);
      if (!result.ok) {
        if (result.error.fields) for (const field of ["name", "phone", "email", "message", "website"] as const) if (result.error.fields[field]) form.setError(field, { message: result.error.fields[field] });
        setError(result.error.message);
      } else { form.reset(); setSuccess(true); }
    } catch { setError("Chưa gửi được lời nhắn. Vui lòng thử lại sau."); }
    finally { pending.current = false; }
  }
  return <form data-ready={hydrated} className="min-w-0 space-y-5 border border-line bg-white p-5 sm:p-8" onSubmit={(event) => { void form.handleSubmit(submit)(event); }}>
    <h2 className="text-base font-semibold">Gửi lời nhắn</h2><PublicFormField id="contact-name" label="Họ tên *" autoComplete="name" maxLength={60} error={form.formState.errors.name?.message} {...form.register("name")} /><PublicFormField id="contact-phone" label="Số điện thoại *" type="tel" autoComplete="tel" inputMode="tel" maxLength={20} error={form.formState.errors.phone?.message} {...form.register("phone")} /><PublicFormField id="contact-email" label="Email (không bắt buộc)" type="email" autoComplete="email" maxLength={254} error={form.formState.errors.email?.message} {...form.register("email")} />
    <div className="space-y-2"><label htmlFor="contact-message" className="block text-xs font-medium">Nội dung * (10–1000 ký tự)</label><textarea id="contact-message" rows={5} maxLength={1000} aria-invalid={Boolean(form.formState.errors.message)} aria-describedby={form.formState.errors.message ? "contact-message-error" : undefined} className="w-full resize-y border border-line p-3 text-sm leading-7 outline-offset-2" {...form.register("message")} />{form.formState.errors.message && <p id="contact-message-error" role="alert" className="text-xs text-sale">{form.formState.errors.message.message}</p>}</div>
    <div className="absolute -left-[10000px]" aria-hidden="true"><label htmlFor="contact-website">Website<input id="contact-website" tabIndex={-1} autoComplete="off" {...form.register("website")} /></label></div>
    <p className="text-xs leading-6 text-muted">Shop dùng thông tin bạn gửi để tiếp nhận và phản hồi yêu cầu. Xem <Link className="underline" href="/chinh-sach-bao-mat">chính sách bảo mật</Link>.</p><button disabled={!hydrated || form.formState.isSubmitting} className="shop-button shop-button-primary w-full">{form.formState.isSubmitting ? "ĐANG GỬI…" : "GỬI LỜI NHẮN"}</button>
    {success && <p role="status" className="border border-line bg-surface p-4 text-sm leading-7">{CONTACT_SUCCESS_MESSAGE}</p>}{error && <p role="alert" className="text-sm leading-6 text-sale">{error}</p>}
  </form>;
}
