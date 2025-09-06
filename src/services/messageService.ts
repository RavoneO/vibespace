
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
import type { Conversation, Message, User } from '@/lib/types';
import { getUserById } from './userService';

// Helper to get full user details for conversations
async function getFullUsers(userIds: string[]): Promise<User[]> {
    const userPromises = userIds.map(id => getUserById(id));
    const users = await Promise.all(userPromises);
    return users.filter((u): u is User => u !== null);
}

// Get all conversations for a user
export async function getConversations(userId: string): Promise<Conversation[]> {
    const convosCollection = collection(db, 'conversations');
    const q = query(convosCollection, where('userIds', 'array-contains', userId), orderBy('timestamp', 'desc'));
    
    const querySnapshot = await getDocs(q);
    const conversations: Conversation[] = await Promise.all(
        querySnapshot.docs.map(async (doc) => {
            const data = doc.data();
            const users = await getFullUsers(data.userIds);
            return {
                id: doc.id,
                ...data,
                users,
            } as Conversation;
        })
    );
    return conversations;
}

// Get messages for a specific conversation
export function getMessagesQuery(conversationId: string) {
    const messagesCollection = collection(db, 'conversations', conversationId, 'messages');
    return query(messagesCollection, orderBy('timestamp', 'asc'));
}

// Send a new message
export async function sendMessage(conversationId: string, senderId: string, text: string) {
    const messagesCollection = collection(db, 'conversations', conversationId, 'messages');
    const conversationRef = doc(db, 'conversations', conversationId);

    const newMessage: Omit<Message, 'id'> = {
        senderId,
        text,
        timestamp: serverTimestamp() as any,
    };
    
    await addDoc(messagesCollection, newMessage);

    // Update the lastMessage and timestamp on the conversation
    await updateDoc(conversationRef, {
        lastMessage: {
            text,
            senderId,
            timestamp: serverTimestamp()
        },
        timestamp: serverTimestamp(),
    });
}

// Start a new conversation or get an existing one
export async function findOrCreateConversation(currentUserId: string, targetUserId: string): Promise<string> {
    const convosCollection = collection(db, 'conversations');
    
    // Check if a conversation between these two users already exists
    const q = query(convosCollection, 
        or(
            where('userIds', '==', [currentUserId, targetUserId]),
            where('userIds', '==', [targetUserId, currentUserId])
        )
    );

    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
        // Conversation already exists
        return querySnapshot.docs[0].id;
    } else {
        // Create a new conversation
        const newConvoRef = await addDoc(convosCollection, {
            userIds: [currentUserId, targetUserId],
            timestamp: serverTimestamp(),
            lastMessage: null,
        });
        return newConvoRef.id;
    }
}
