'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getPosts } from '@/services/postService.server';
import { embed } from 'genkit/ai';

const SemanticSearchInputSchema = z.string();
const SemanticSearchOutputSchema = z.object({
    results: z.array(z.object({
        id: z.string(),
        caption: z.string(),
        contentUrl: z.string(),
        score: z.number(),
    })).describe('A list of search results, ranked by relevance.'),
});

export type SemanticSearchOutput = z.infer<typeof SemanticSearchOutputSchema>;

async function dotProduct(a: number[], b: number[]): Promise<number> {
    return a.map((x, i) => a[i] * b[i]).reduce((m, n) => m + n);
}

export const semanticSearch = ai.defineFlow(
  {
    name: 'semanticSearch',
    inputSchema: SemanticSearchInputSchema,
    outputSchema: SemanticSearchOutputSchema,
  },
  async (query) => {
    const posts = await getPosts();
    const postCaptions = posts.map(p => p.caption);

    const [queryEmbedding, documentEmbeddings] = await Promise.all([
        embed({
            embedder: 'googleai/text-embedding-004',
            content: query,
        }),
        embed({
            embedder: 'googleai/text-embedding-004',
            content: postCaptions,
        }),
    ]);
    
    const similarities = await Promise.all(
        documentEmbeddings.map(docEmbedding => dotProduct(queryEmbedding, docEmbedding))
    );

    const results = posts.map((post, i) => ({
        id: post.id,
        caption: post.caption,
        contentUrl: post.contentUrl,
        score: similarities[i],
    }));

    results.sort((a, b) => b.score - a.score);

    return { results: results.slice(0, 15) };
  }
);
