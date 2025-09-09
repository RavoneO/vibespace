
'use server';

import { semanticSearch as semanticSearchServer } from '@/services/postService.server';
import type { SemanticSearchInput } from '@/ai/flows/ai-semantic-search';

export async function searchPostsAndUsers(query: string) {
    if (!query) {
        return { users: [], posts: [] };
    }
    // For simplicity, we are only using the semantic search for posts.
    // User search can be added here in the future.
    const postResults = await semanticSearchServer({ query });
    return {
        posts: postResults.results || [],
    };
}
