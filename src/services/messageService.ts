
'use client';

import { db } from '@/lib/firebase';
import { 
    collection, 
    query, 
    orderBy,
} from 'firebase/firestore';
import { markAsRead as markAsReadOnServer } from './messageService.server';

// Get messages for a specific conversation - This must remain a client-side query
export function getMessagesQuery(conversationId: string) {
    const messagesCollection = collection(db, 'conversations', conversationId, 'messages');
    return query(messagesCollection, orderBy('timestamp', 'asc'));
}

// Mark a message as read
export async function markAsRead(conversationId: string, messageId: string, userId: string) {
    // We can do some optimistic updates here on the client-side if needed.
    return await markAsReadOnServer(conversationId, messageId, userId);
}
