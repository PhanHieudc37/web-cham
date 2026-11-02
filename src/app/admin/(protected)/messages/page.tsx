import { contactFiltersSchema } from "@/lib/validation/contact";
import { readAuthorizedPage } from "@/server/auth/guards";
import { getContactService } from "@/server/services/contact.service";
import { MessageList } from "@/components/admin/messages/MessageList";

export default async function MessagesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const parsed = contactFiltersSchema.safeParse(await searchParams);
  const filters = parsed.success ? parsed.data : contactFiltersSchema.parse({});
  const { data } = await readAuthorizedPage("staff", "/admin/messages", () => getContactService().list(filters));
  return <MessageList data={data} status={filters.status} />;
}
