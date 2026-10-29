import { z } from "zod";
import { emailSchema, optionalText, phoneSchema, requiredText } from "./common";

export const contactSchema = z.object({ name: requiredText(2, 60), phone: phoneSchema, email: emailSchema, message: requiredText(10, 1000), website: optionalText(200) });
export type ContactInput = z.output<typeof contactSchema>;
export const contactFiltersSchema = z.object({ status: z.enum(["new", "handled"]).default("new"), page: z.coerce.number().int().min(1).max(100000).default(1) });
export const CONTACT_SUCCESS_MESSAGE = "Cảm ơn bạn đã để lại lời nhắn. Shop sẽ phản hồi sớm nhất!";
