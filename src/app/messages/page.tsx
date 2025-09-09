

import AppLayout from "@/components/app-layout";
import { ConversationList } from "./conversation-list";
import { getConversations } from "@/services/messageService.server";
import { headers } from "next/headers";

export default async function MessagesPage() {
  const headersList = headers();
  const userId = headersList.get('x-user-id');
  const conversations = userId ? await getConversations(userId) : [];

  return (
    <AppLayout>
        <ConversationList initialConversations={conversations} />
    </AppLayout>
  );
}
