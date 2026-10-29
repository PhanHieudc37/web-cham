"use server";

import { after } from "next/server";
import { contactSchema } from "@/lib/validation/contact";
import { runAction } from "@/server/run-action";
import { getClientIp } from "@/server/request";
import { getContactService } from "@/server/services/contact.service";
import { notifyNewContact } from "@/server/services/notification.service";
import { getPublicSettings } from "@/server/services/settings.service";

export async function submitContactAction(input: unknown) {
  return runAction(async () => {
    const values = contactSchema.parse(input);
    // Public endpoint; rate limit and honeypot run before the insert.
    const message = await getContactService().submit(values, await getClientIp());
    if (message) after(async () => {
      try { await notifyNewContact(message, (await getPublicSettings()).shop.name); }
      catch { console.error("[notification] Contact notification failed", { messageId: message.id }); }
    });
    return null;
  });
}
