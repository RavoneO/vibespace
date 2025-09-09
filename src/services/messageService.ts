

import { db } from '@/lib/firebase';
import { 
    collection, 
    query, 
    orderBy,
} from 'firebase/firestore';

// Get messages for a specific conversation - This must remain a client-side query
export function getMessagesQuery(conversationId: string) {
    const messagesCollection = collection(db, 'conversations', conversationId, 'messages');
    return query(messagesCollection, orderBy('timestamp', 'asc'));
}
