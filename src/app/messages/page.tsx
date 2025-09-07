
import AppLayout from "@/components/app-layout";
import { ConversationList } from "./conversation-list";

export default function MessagesPage() {
  return (
    <AppLayout>
        <ConversationList />
    </AppLayout>
  );
}
