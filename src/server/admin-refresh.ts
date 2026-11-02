import "server-only";

import { revalidatePath } from "next/cache";

export function refreshAdminPaths(paths: string[], shell = false) {
  for (const path of new Set(paths)) revalidatePath(path, path.includes("[") ? "page" : undefined);
  // Only order/message/account changes need to refresh badges or account chrome.
  if (shell) revalidatePath("/admin", "layout");
}
