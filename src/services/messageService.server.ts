
'use server';

import { adminDb, adminStorage } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { Conversation, Message, User } from '@/lib/types';
import { getUserById } from './userService.server';
import { randomUUID } from 'crypto';

// Get all users
export async function getAllUsers(): Promise<User[]> {
    const usersSnapshot = await adminDb.collection('users').get();
    const users: User[] = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    } as User));
    return users;
}

// Get all conversations for a user
export async function getConversations(userId: string): Promise<Conversation[]> {
    const convosCollection = adminDb.collection('conversations');
    const q = convosCollection.where('userIds', 'array-contains', userId).orderBy('timestamp', 'desc');
    
    const querySnapshot = await q.get();
    const conversations: Conversation[] = await Promise.all(
        querySnapshot.docs.map(async (doc) => {
            const data = doc.data();
            const userIds = data.userIds as string[];
            let users: User[] = [];

            if (!data.isGroup) {
                 const otherUserId = userIds.find(id => id !== userId);
                 if(otherUserId) {
                    const user = await getUserById(otherUserId);
                    if(user) users.push(user);
                 }
            }
            
            return {
                id: doc.id,
                ...data,
                users, // For 1-on-1 chats, this will be an array with one user.
            } as Conversation;
        })
    );
    return conversations;
}

// Send a new message
export async function sendMessage(conversationId: string, senderId: string, text?: string, media?: { url: string; type: 'image' | 'video' | 'file'; name: string, size: number }) {
    const messagesCollection = adminDb.collection('conversations').doc(conversationId).collection('messages');
    const conversationRef = adminDb.collection('conversations').doc(conversationId);

    const timestamp = FieldValue.serverTimestamp();

    let messageType: Message['type'] = 'text';
    if (media) {
        messageType = media.type;
    }

    const newMessage: Omit<Message, 'id'> = {
        senderId,
        timestamp: timestamp as any,
        type: messageType,
        readBy: {
            [senderId]: timestamp as any,
        },
        ...(text && { text }),
        ...(media && { contentUrl: media.url, fileName: media.name, fileSize: media.size })
    };
    
    await messagesCollection.add(newMessage);

    let lastMessageText = text || 'Media shared';
    if (media) {
        switch(media.type) {
            case 'image': lastMessageText = '📷 Image'; break;
            case 'video': lastMessageText = '🎥 Video'; break;
            case 'file': lastMessageText = `📄 ${media.name}`; break;
        }
    }
    
    await conversationRef.update({
        lastMessage: {
            text: lastMessageText,
            senderId,
            timestamp
        },
        timestamp,
    });
}

// Mark a message as read
export async function markAsRead(conversationId: string, messageId: string, userId: string) {
    const messageRef = adminDb.collection('conversations').doc(conversationId).collection('messages').doc(messageId);
    const timestamp = FieldValue.serverTimestamp();

    await messageRef.update({
        [`readBy.${userId}`]: timestamp,
    });
}

// Start a new one-on-one conversation or get an existing one
export async function findOrCreateConversation(currentUserId: string, targetUserId: string): Promise<string> {
    if (!currentUserId || !targetUserId) {
      throw new Error("Both currentUserId and targetUserId are required.");
    }
    if (currentUserId === targetUserId) {
      throw new Error("Cannot create a conversation with yourself.");
    }

    const convosCollection = adminDb.collection('conversations');
  
    const userIds = [currentUserId, targetUserId].sort();
    
    const q = convosCollection.where('isGroup', '==', false).where('userIds', '==', userIds);

    const querySnapshot = await q.get();
    
    if (!querySnapshot.empty) {
        return querySnapshot.docs[0].id;
    } else {
        const newConvoRef = await convosCollection.add({
            userIds: userIds,
            isGroup: false,
            timestamp: FieldValue.serverTimestamp(),
            lastMessage: null,
        });
        return newConvoRef.id;
    }
}

// Create a new group conversation
export async function createGroupConversation(participantIds: string[], groupName: string): Promise<string> {
    if (participantIds.length < 2) {
        throw new Error("A group must have at least two participants.");
    }
    if (!groupName.trim()) {
        throw new Error("Group name cannot be empty.");
    }

    const convosCollection = adminDb.collection('conversations');
    
    const newGroupRef = await convosCollection.add({
        userIds: participantIds,
        groupName: groupName,
        isGroup: true,
        createdAt: FieldValue.serverTimestamp(),
        timestamp: FieldValue.serverTimestamp(),
        lastMessage: null, 
        groupAvatar: null,
    });

    return newGroupRef.id;
}


// Upload media to Firebase Storage
export async function uploadMedia(formData: FormData): Promise<{ url: string; type: 'image' | 'video' | 'file'; name: string, size: number }> {
    const file = formData.get('media') as File;
    if (!file) {
        throw new Error('No file found in form data');
    }

    const bucket = adminStorage.bucket();
    const fileName = `${randomUUID()}-${file.name}`;
    const fileRef = bucket.file(`message_media/${fileName}`);

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    await fileRef.save(fileBuffer, {
        metadata: {
            contentType: file.type,
        },
    });

    const [url] = await fileRef.getSignedUrl({ action: 'read', expires: '03-09-2491' });

    let type: 'image' | 'video' | 'file' = 'file';
    if (file.type.startsWith('image/')) {
        type = 'image';
    } else if (file.type.startsWith('video/')) {
        type = 'video';
    }

    return { url, type, name: file.name, size: file.size };
}
