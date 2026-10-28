"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { toast } from "sonner";
import { createUserSchema, resetUserPasswordSchema } from "@/lib/validation/auth";
import { createUserAction, resetUserPasswordAction } from "@/server/actions/admin/users";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { FormField } from "../common/form-field";

export function CreateUserForm({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter(), [error, setError] = useState("");
  const form = useForm<z.output<typeof createUserSchema>>({ resolver: zodResolver(createUserSchema), defaultValues: { name: "", email: "", password: "", role: "staff" } });
  useUnsavedChanges(open && form.formState.isDirty);
  return <Dialog open={open} onOpenChange={(value) => { if (form.formState.isSubmitting) return; if (!value && form.formState.isDirty && !window.confirm("Bạn có thay đổi chưa lưu. Bạn muốn đóng?")) return; form.reset(); setError(""); onOpenChange(value); }}>
    <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-md"><DialogHeader><DialogTitle>Thêm tài khoản</DialogTitle><DialogDescription>Cấp quyền làm việc cho thành viên của shop.</DialogDescription></DialogHeader>
      <form className="space-y-4" onSubmit={form.handleSubmit(async (values) => {
        setError(""); const result = await createUserAction(values);
        if (!result.ok) { setError(result.error.message); if (result.error.fields?.email) form.setError("email", { message: result.error.fields.email }); return; }
        toast.success("Đã thêm tài khoản"); form.reset(); onOpenChange(false); router.refresh();
      })}>
        <FormField id="name" label="Họ và tên" autoComplete="off" {...form.register("name")} error={form.formState.errors.name?.message} />
        <FormField id="create-email" label="Email" type="email" autoComplete="off" {...form.register("email")} error={form.formState.errors.email?.message} />
        <FormField id="create-password" label="Mật khẩu tạm" type="password" autoComplete="new-password" {...form.register("password")} error={form.formState.errors.password?.message} />
        <div className="space-y-2"><Label htmlFor="role">Vai trò</Label><select id="role" className="h-11 w-full rounded-md border bg-white px-3 text-sm" {...form.register("role")}><option value="staff">Nhân viên</option><option value="admin">Quản trị viên</option></select><p className="text-xs leading-5 text-stone-500">Nhân viên không được quản lý tài khoản, cài đặt và doanh thu.</p></div>
        <p className="rounded-md bg-stone-50 p-3 text-xs leading-5 text-stone-500">Bạn cần gửi riêng mật khẩu tạm cho thành viên. Hệ thống không gửi email tự động.</p>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <div className="sticky bottom-0 bg-white pt-2"><Button type="submit" className="h-11 w-full" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Đang tạo…" : "Thêm tài khoản"}</Button></div>
      </form>
    </DialogContent>
  </Dialog>;
}

export function ResetUserPassword({ person, onClose }: { person: { id: string; name: string } | null; onClose: () => void }) {
  const [error, setError] = useState("");
  const form = useForm<z.output<typeof resetUserPasswordSchema>>({ resolver: zodResolver(resetUserPasswordSchema), values: { userId: person?.id ?? "", newPassword: "" } });
  useUnsavedChanges(Boolean(person) && form.formState.isDirty);
  return <Dialog open={Boolean(person)} onOpenChange={(open) => { if (form.formState.isSubmitting) return; if (!open && form.formState.isDirty && !window.confirm("Bạn có thay đổi chưa lưu. Bạn muốn đóng?")) return; form.reset(); setError(""); onClose(); }}>
    <DialogContent className="rounded-md"><DialogHeader><DialogTitle>Đặt lại mật khẩu</DialogTitle><DialogDescription>Đặt mật khẩu tạm mới cho {person?.name}. Tất cả phiên đăng nhập của tài khoản này sẽ bị thu hồi.</DialogDescription></DialogHeader>
      <form className="space-y-4" onSubmit={form.handleSubmit(async (values) => {
        setError(""); const result = await resetUserPasswordAction(values);
        if (!result.ok) { setError(result.error.message); return; }
        toast.success("Đã đặt lại mật khẩu"); form.reset(); onClose();
      })}>
        <FormField id="reset-password" label="Mật khẩu tạm mới" type="password" autoComplete="new-password" {...form.register("newPassword")} error={form.formState.errors.newPassword?.message} />
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button className="h-11 w-full" type="submit" disabled={form.formState.isSubmitting}>Đặt lại mật khẩu</Button>
      </form>
    </DialogContent>
  </Dialog>;
}
