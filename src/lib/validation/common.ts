import { z } from "zod";
import { MAX_VND } from "@/lib/constants";
import { normalizePhone } from "@/lib/normalize";

z.config(z.locales.vi());

export const idSchema = z.uuid({ error: "Mã dữ liệu không hợp lệ" });
export const phoneSchema = z.string({ error: "Vui lòng nhập số điện thoại" }).transform(normalizePhone).pipe(z.string().regex(/^0(3|5|7|8|9)\d{8}$/, "Số điện thoại không hợp lệ"));
export const slugSchema = z.string().trim().min(1, "Vui lòng nhập đường dẫn").max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Đường dẫn chỉ gồm chữ thường không dấu, số và dấu gạch ngang");
export const moneySchema = z.number({ error: "Vui lòng nhập số tiền" }).int("Số tiền phải là số nguyên").min(0).max(MAX_VND);
export const emailSchema = z.string().trim().max(254).pipe(z.email({ error: "Email không hợp lệ" }).or(z.literal(""))).default("");
export const optionalText = (limit: number) => z.string().trim().max(limit, `Tối đa ${limit} ký tự`).default("");
export const requiredText = (min: number, max: number) => z.string({ error: "Vui lòng nhập thông tin" }).trim().min(min, `Vui lòng nhập ít nhất ${min} ký tự`).max(max, `Tối đa ${max} ký tự`);
