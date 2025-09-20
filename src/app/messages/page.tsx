
import AppLayout from "@/components/app-layout";
import { ConversationList } from "./conversation-list";
import { getConversations } from "@/services/messageService.server";
import { headers } from "next/headers";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Icons } from "@/components/icons";

export default async function MessagesPage() {
  const headersList = await headers();
  const userId = headersList.get('x-user-id');
  const conversations = userId ? await getConversations(userId) : [];

  return (
    <AppLayout>
      <div className="flex flex-col h-full">
        <header className="flex items-center justify-between p-4 border-b">
          <h1 className="text-2xl font-bold">Messages</h1>
          <Button asChild variant="ghost" size="icon">
            <Link href="/messages/new-group">
              <Icons.users className="h-6 w-6" />
              <span className="sr-only">New Group</span>
            </Link>
          </Button>
        </header>
        <ConversationList initialConversations={conversations} />
      </div>
    </AppLayout>
  );
}
