import { readAuthorizedPage } from "@/server/auth/guards";
import { readSettings } from "@/server/services/settings.service";
import { SettingsView } from "@/components/admin/settings/settings-view";

export default async function SettingsPage() {
  const { data } = await readAuthorizedPage("admin", "/admin/settings", () => readSettings());
  return <SettingsView settings={data} />;
}
