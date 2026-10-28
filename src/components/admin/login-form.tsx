"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { loginSchema } from "@/lib/validation/auth";
import { signInAction } from "@/server/actions/admin/auth";
import { Button } from "@/components/ui/button";
import { FormField } from "./common/form-field";

const subscribe = () => () => undefined;

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState("");
  const form = useForm<z.input<typeof loginSchema>, unknown, z.output<typeof loginSchema>>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "", next } });
  return <form className="space-y-5" onSubmit={form.handleSubmit(async (values) => {
    setError(""); const result = await signInAction(values);
    if (!result.ok) { setError(result.error.message); return; }
    router.replace(result.data.next); router.refresh();
  })}>
    <FormField id="email" label="Email" autoComplete="username" type="email" disabled={!hydrated} placeholder="Email quản trị của bạn" {...form.register("email")} error={form.formState.errors.email?.message} />
    <div className="relative"><FormField id="password" label="Mật khẩu" autoComplete="current-password" disabled={!hydrated} type={visible ? "text" : "password"} {...form.register("password")} error={form.formState.errors.password?.message} />
      <Button type="button" size="icon" variant="ghost" className="absolute top-7 right-1" aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={17} /> : <Eye size={17} />}</Button></div>
    {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-destructive">{error}</p>}
    <Button className="h-12 w-full justify-between" type="submit" disabled={!hydrated || form.formState.isSubmitting}>{form.formState.isSubmitting ? "Đang đăng nhập…" : "Đăng nhập"}<ArrowRight size={17} /></Button>
    <p className="text-xs leading-5 text-muted-foreground">Quên mật khẩu? Liên hệ quản trị viên của shop để được cấp lại.</p>
  </form>;
}
