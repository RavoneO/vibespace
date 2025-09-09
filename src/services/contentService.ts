
'use server';

import { getUserByUsername } from './userService.server';
import { createActivity } from './activityService.server';

export async function processMentions(text: string, actorId: string, postId: string) {
    const mentionRegex = /@(\\w+)/g;
    const mentions = text.match(mentionRegex);
    if (!mentions) return;

    const mentionedUsernames = new Set(mentions.map(m => m.substring(1)));

    for (const username of mentionedUsernames) {
        const user = await getUserByUsername(username);
        if (user && user.id !== actorId) {
            await createActivity({
                type: 'mention',
                actorId: actorId,
                notifiedUserId: user.id,
                postId: postId
            });
        }
    }
};
