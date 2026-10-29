import { contactFiltersSchema } from "@/lib/validation/contact";
import { requireRolePage } from "@/server/auth/guards";
import { getContactService } from "@/server/services/contact.service";
import { MessageList } from "@/components/admin/messages/MessageList";

export default async function MessagesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const parsed = contactFiltersSchema.safeParse(await searchParams);
  await requireRolePage("staff", "/admin/messages");
  const filters = parsed.success ? parsed.data : contactFiltersSchema.parse({});
  return <MessageList data={await getContactService().list(filters)} status={filters.status} />;
}
