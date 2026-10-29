"use server";

import { z } from "zod";
import { idSchema } from "@/lib/validation/common";
import { requireRole } from "@/server/auth/guards";
import { runAction } from "@/server/run-action";
import { getContactService } from "@/server/services/contact.service";

export async function markContactHandledAction(input: unknown) {
  return runAction(async () => {
    const { id } = z.object({ id: idSchema }).parse(input);
    const actor = await requireRole("staff");
    return getContactService().markHandled(id, actor.id);
  });
}
