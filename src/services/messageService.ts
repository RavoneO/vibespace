
import { db } from '@/lib/firebase';
import { 
    collection, 
    query, 
    where, 
    getDocs, 
    addDoc, 
    serverTimestamp,
    doc,
    orderBy,
    limit,
    updateDoc,
    runTransaction,
    getDoc,
    or
} from 'firebase/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { Conversation, Message, User } from '@/lib/types';
import { getUserById } from './userService.server';

// Get all conversations for a user
export async function getConversations(userId: string): Promise<Conversation[]> {
    const convosCollection = adminDb.collection('conversations');
    const q = convosCollection.where('userIds', 'array-contains', userId).orderBy('timestamp', 'desc');
    
    const querySnapshot = await q.get();
    const conversations: Conversation[] = await Promise.all(
        querySnapshot.docs.map(async (doc) => {
            const data = doc.data();
            const userIds = data.userIds as string[];
            const userPromises = userIds.map(id => getUserById(id));
            const users = (await Promise.all(userPromises)).filter((u): u is User => u !== null);
            
            return {
                id: doc.id,
                ...data,
                users,
            } as Conversation;
        })
    );
    return conversations;
}

// Get messages for a specific conversation - This must remain a client-side query
export function getMessagesQuery(conversationId: string) {
    const messagesCollection = collection(db, 'conversations', conversationId, 'messages');
    return query(messagesCollection, orderBy('timestamp', 'asc'));
}

// Send a new message
export async function sendMessage(conversationId: string, senderId: string, text: string) {
    const messagesCollection = adminDb.collection('conversations').doc(conversationId).collection('messages');
    const conversationRef = adminDb.collection('conversations').doc(conversationId);

    const timestamp = FieldValue.serverTimestamp();

    const newMessage = {
        senderId,
        text,
        timestamp,
    };
    
    await messagesCollection.add(newMessage);

    // Update the lastMessage and timestamp on the conversation
    await conversationRef.update({
        lastMessage: {
            text,
            senderId,
            timestamp
        },
        timestamp,
    });
}

// Start a new conversation or get an existing one
export async function findOrCreateConversation(currentUserId: string, targetUserId: string): Promise<string> {
    if (!currentUserId || !targetUserId) {
      throw new Error("Both currentUserId and targetUserId are required.");
    }
    if (currentUserId === targetUserId) {
      throw new Error("Cannot create a conversation with yourself.");
    }

    const convosCollection = adminDb.collection('conversations');
  
    const userIds = [currentUserId, targetUserId].sort();
    
    const q = convosCollection.where('userIds', '==', userIds);

    const querySnapshot = await q.get();
    
    if (!querySnapshot.empty) {
        // Conversation already exists
        return querySnapshot.docs[0].id;
    } else {
        // Create a new conversation
        const newConvoRef = await convosCollection.add({
            userIds: userIds,
            timestamp: FieldValue.serverTimestamp(),
            lastMessage: null,
        });
        return newConvoRef.id;
    }
}
