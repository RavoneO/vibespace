
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, updateDoc, arrayUnion } from 'firebase/firestore';
import { createActivity as createActivityServer } from './activityService.server';

interface CreateActivityParams {
    type: 'like' | 'comment' | 'follow' | 'mention';
    actorId: string;
    notifiedUserId: string;
    postId?: string;
}

export async function createActivity(params: CreateActivityParams) {
    // This function will now be primarily a client-side wrapper,
    // or we can delegate all activity creation to server actions
    // for better security and to avoid duplicating logic.
    // For now, let's call the server version.
    return createActivityServer(params);
}
