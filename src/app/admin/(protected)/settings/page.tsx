import { requireRolePage } from "@/server/auth/guards";
import { readSettings } from "@/server/services/settings.service";
import { SettingsView } from "@/components/admin/settings/settings-view";

export default async function SettingsPage() {
  await requireRolePage("admin", "/admin/settings");
  return <SettingsView settings={await readSettings()} />;
}
