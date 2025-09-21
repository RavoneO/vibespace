'use server';

import { adminDb } from '@/lib/firebase-admin';
import type { Activity } from '@/lib/types';
import { getUserById } from './userService.server';
import { getPostById } from './postService.server';
import { FieldValue } from 'firebase-admin/firestore';

async function processActivityDoc(doc: FirebaseFirestore.DocumentSnapshot): Promise<Activity | null> {
    const data = doc.data();
    if (!data) return null;

    const actor = await getUserById(data.actorId);
    if (!actor) return null;

    let targetPost;
    if (data.postId) {
        const post = await getPostById(data.postId);
        if (post) {
            targetPost = {
                id: post.id,
                contentUrl: post.contentUrl,
                type: post.type,
            };
        }
    }

    return {
        id: doc.id,
        type: data.type,
        actor,
        targetPost,
        timestamp: data.timestamp.toMillis(),
    };
}

export async function getActivity(userId: string): Promise<Activity[]> {
    const activityCollection = adminDb.collection('activity');
    const q = activityCollection
        .where('notifiedUserId', '==', userId)
        .orderBy('timestamp', 'desc')
        .limit(50);

    const querySnapshot = await q.get();

    const activities = await Promise.all(
        querySnapshot.docs.map(processActivityDoc)
    );

    return activities.filter((a): a is Activity => a !== null);
}

export async function markAllActivitiesAsRead(userId: string): Promise<void> {
    const activityCollection = adminDb.collection('activity');
    const q = activityCollection
        .where('notifiedUserId', '==', userId)
        .where('seen', '==', false);

    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
        return;
    }

    const batch = adminDb.batch();
    querySnapshot.docs.forEach(doc => {
        batch.update(doc.ref, { seen: true });
    });

    await batch.commit();
}

export async function createActivity(activity: {
    type: 'like' | 'comment' | 'follow' | 'mention';
    actorId: string;
    notifiedUserId: string;
    postId?: string;
}) {
    if (activity.actorId === activity.notifiedUserId) {
        return; // Don't create activity for actions on own content
    }

    const activityRef = adminDb.collection('activity').doc();
    await activityRef.set({
        ...activity,
        timestamp: FieldValue.serverTimestamp(),
        seen: false,
    });
}
