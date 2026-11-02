"use server";

import { z } from "zod";
import { refreshAdminPaths } from "@/server/admin-refresh";
import { idSchema } from "@/lib/validation/common";
import { requireRole } from "@/server/auth/guards";
import { runAction } from "@/server/run-action";
import { getContactService } from "@/server/services/contact.service";

export async function markContactHandledAction(input: unknown) {
  return runAction(async () => {
    const { id } = z.object({ id: idSchema }).parse(input);
    const actor = await requireRole("staff");
    const result = await getContactService().markHandled(id, actor.id);
    refreshAdminPaths(["/admin/messages"], true);
    return result;
  });
}
