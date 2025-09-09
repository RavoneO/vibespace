
'use server';

import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { Activity } from '@/lib/types';
import { getUserById } from './userService.server';
import { getPostById } from './postService.server';


interface CreateActivityParams {
    type: 'like' | 'comment' | 'follow' | 'mention';
    actorId: string;
    notifiedUserId: string;
    postId?: string;
}

export async function createActivity(params: CreateActivityParams) {
    if (params.actorId === params.notifiedUserId) {
        // Don't create notifications for a user's own actions
        return;
    }

    try {
        await adminDb.collection('activity').add({
            type: params.type,
            actorId: params.actorId,
            notifiedUserId: params.notifiedUserId,
            postId: params.postId || null,
            timestamp: FieldValue.serverTimestamp(),
            read: false,
        });
    } catch (error) {
        console.error("Error creating activity:", error);
    }
}

export async function getActivity(userId: string): Promise<Activity[]> {
    try {
        const activityCollection = adminDb.collection('activity');
        const q = activityCollection
            .where('notifiedUserId', '==', userId)
            .orderBy('timestamp', 'desc')
            .limit(50);

        const querySnapshot = await q.get();
        
        const activities: Activity[] = (await Promise.all(
            querySnapshot.docs.map(async (doc) => {
                const data = doc.data();
                const actor = await getUserById(data.actorId);
                
                if (!actor) {
                    return null;
                }

                let targetPost;
                if (data.postId) {
                    const post = await getPostById(data.postId);
                    if(post) {
                        targetPost = {
                            id: post.id,
                            contentUrl: post.contentUrl,
                            type: post.type
                        };
                    }
                }

                return {
                    id: doc.id,
                    type: data.type,
                    actor,
                    targetPost,
                    timestamp: data.timestamp,
                } as Activity;
            })
        )).filter((activity): activity is Activity => activity !== null);
        
        return activities;

    } catch (error) {
        console.error("Error fetching activity:", error);
        return [];
    }
}


export async function markAllActivitiesAsRead(userId: string) {
    const activityCollection = adminDb.collection('activity');
    const q = activityCollection
        .where('notifiedUserId', '==', userId)
        .where('read', '==', false);

    try {
        const querySnapshot = await q.get();
        if (querySnapshot.empty) {
            return;
        }
        
        const batch = adminDb.batch();
        querySnapshot.forEach(docSnapshot => {
            batch.update(docSnapshot.ref, { read: true });
        });
        
        await batch.commit();

    } catch (error) {
        console.error("Error marking activities as read:", error);
    }
}
