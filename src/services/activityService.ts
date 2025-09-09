
'use server';

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
    if (params.actorId === params.notifiedUserId) {
        return;
    }
    
    await createActivityServer(params);
}
