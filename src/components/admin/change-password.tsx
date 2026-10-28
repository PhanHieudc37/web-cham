"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { toast } from "sonner";
import { changePasswordSchema } from "@/lib/validation/auth";
import { changePasswordAction } from "@/server/actions/admin/auth";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { FormField } from "./common/form-field";

export function ChangePassword({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [error, setError] = useState("");
  const form = useForm<z.output<typeof changePasswordSchema>>({ resolver: zodResolver(changePasswordSchema), defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" } });
  useUnsavedChanges(open && form.formState.isDirty);
  return <Dialog open={open} onOpenChange={(value) => { if (form.formState.isSubmitting) return; if (!value && form.formState.isDirty && !window.confirm("Bạn có thay đổi chưa lưu. Bạn muốn đóng?")) return; form.reset(); setError(""); onOpenChange(value); }}>
    <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-md"><DialogHeader><DialogTitle>Đổi mật khẩu</DialogTitle><DialogDescription>Các phiên đăng nhập khác sẽ được đăng xuất.</DialogDescription></DialogHeader>
      <form className="space-y-4" onSubmit={form.handleSubmit(async (values) => {
        setError(""); const result = await changePasswordAction(values);
        if (!result.ok) { setError(result.error.message); for (const [key, message] of Object.entries(result.error.fields ?? {})) if (key === "currentPassword" || key === "newPassword" || key === "confirmPassword") form.setError(key, { message }); return; }
        toast.success("Đã đổi mật khẩu"); form.reset(); onOpenChange(false);
      })}>
        <FormField id="currentPassword" label="Mật khẩu hiện tại" type="password" autoComplete="current-password" {...form.register("currentPassword")} error={form.formState.errors.currentPassword?.message} />
        <FormField id="newPassword" label="Mật khẩu mới" type="password" autoComplete="new-password" {...form.register("newPassword")} error={form.formState.errors.newPassword?.message} />
        <FormField id="confirmPassword" label="Nhập lại mật khẩu mới" type="password" autoComplete="new-password" {...form.register("confirmPassword")} error={form.formState.errors.confirmPassword?.message} />
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="h-11 w-full" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Đang lưu…" : "Lưu mật khẩu"}</Button>
      </form>
    </DialogContent>
  </Dialog>;
}
