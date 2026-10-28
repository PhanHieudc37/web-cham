import { z } from "zod";
import { requiredText } from "./common";

export const authUserIdSchema = z.string().min(1, "Mã tài khoản không hợp lệ").max(128);
const email = z.email({ error: "Email không hợp lệ" }).max(254).transform((value) => value.toLowerCase());
export const passwordSchema = z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự").max(128, "Mật khẩu tối đa 128 ký tự");
export const loginSchema = z.object({ email: z.string().trim().pipe(email), password: z.string().min(1, "Vui lòng nhập mật khẩu").max(128), next: z.string().max(2048).optional() });
export const createUserSchema = z.object({ name: requiredText(2, 80), email: z.string().trim().pipe(email), password: passwordSchema, role: z.enum(["staff", "admin"]) });
export const setRoleSchema = z.object({ userId: authUserIdSchema, role: z.enum(["staff", "admin"]) });
export const setBanSchema = z.object({ userId: authUserIdSchema, banned: z.boolean() });
export const resetUserPasswordSchema = z.object({ userId: authUserIdSchema, newPassword: passwordSchema });
export const changePasswordSchema = z.object({ currentPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại").max(128), newPassword: passwordSchema, confirmPassword: passwordSchema })
  .refine((value) => value.newPassword === value.confirmPassword, { path: ["confirmPassword"], error: "Mật khẩu xác nhận chưa khớp" })
  .refine((value) => value.newPassword !== value.currentPassword, { path: ["newPassword"], error: "Mật khẩu mới phải khác mật khẩu hiện tại" });
export const emptyInputSchema = z.object({});
