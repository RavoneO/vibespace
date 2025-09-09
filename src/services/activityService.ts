
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, updateDoc, arrayUnion } from 'firebase/firestore';

interface CreateActivityParams {
    type: 'like' | 'comment' | 'follow' | 'mention';
    actorId: string;
    notifiedUserId: string;
    postId?: string;
}

export async function createActivity(params: CreateActivityParams) {
    if (params.actorId === params.notifiedUserId) {
        return;
    }

    try {
        await addDoc(collection(db, 'activity'), {
            type: params.type,
            actorId: params.actorId,
            notifiedUserId: params.notifiedUserId,
            postId: params.postId || null,
            timestamp: serverTimestamp(),
            read: false,
        });
    } catch (error) {
        console.error("Error creating activity:", error);
    }
}
