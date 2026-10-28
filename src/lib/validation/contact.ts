import { z } from "zod";
import { emailSchema, optionalText, phoneSchema, requiredText } from "./common";

export const contactSchema = z.object({ name: requiredText(2, 60), phone: phoneSchema, email: emailSchema, message: requiredText(10, 1000), website: optionalText(200) });
