
import { db } from '@/lib/firebase';
import { firestore as adminDb } from '@/lib/firebase-admin';
import { collection, addDoc, serverTimestamp, query, where, orderBy, getDocs, limit, writeBatch, doc, getDoc as getDocClient } from 'firebase/firestore';
import type { Activity, Post } from '@/lib/types';
import { getUserById } from './userService';
import { getPostById } from './postService';

const isServer = typeof window === 'undefined';

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
        const dbInstance = isServer ? adminDb : db;
        await dbInstance.collection('activity').add({
            type: params.type,
            actorId: params.actorId,
            notifiedUserId: params.notifiedUserId,
            postId: params.postId || null,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            read: false,
        });
    } catch (error) {
        console.error("Error creating activity:", error);
    }
}

export async function getActivity(userId: string): Promise<Activity[]> {
    try {
        const dbInstance = isServer ? adminDb : db;
        const activityCollection = dbInstance.collection('activity');
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
    const dbInstance = isServer ? adminDb : db;
    const activityCollection = dbInstance.collection('activity');
    const q = activityCollection
        .where('notifiedUserId', '==', userId)
        .where('read', '==', false);

    try {
        const querySnapshot = await q.get();
        if (querySnapshot.empty) {
            return;
        }
        
        const batch = dbInstance.batch();
        querySnapshot.forEach(docSnapshot => {
            batch.update(docSnapshot.ref, { read: true });
        });
        
        await batch.commit();

    } catch (error) {
        console.error("Error marking activities as read:", error);
    }
}
