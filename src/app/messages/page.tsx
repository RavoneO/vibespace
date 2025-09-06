
import AppLayout from "@/components/app-layout";
import { ConversationList } from "./conversation-list";

export default function MessagesPage() {
  return (
    <AppLayout>
      <main className="flex-1">
        <ConversationList />
      </main>
    </AppLayout>
  );
}
