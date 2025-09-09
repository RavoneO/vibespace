
'use server';
import 'server-only';
/**
 * @fileOverview An AI agent that performs semantic search on posts.
 *
 * - semanticSearch - A function that finds posts relevant to a natural language query.
 * - SemanticSearchInput - The input type for the semanticSearch function.
 * - SemanticSearchOutput - The return type for the semanticSearch function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { getPosts } from '@/services/postService';
import type { Post } from '@/lib/types';

const SemanticSearchInputSchema = z.object({
  query: z.string().describe('The natural language search query.'),
});
export type SemanticSearchInput = z.infer<typeof SemanticSearchInputSchema>;

const SemanticSearchOutputSchema = z.object({
  results: z.array(z.object({
      id: z.string(),
      contentUrl: z.string(),
      type: z.enum(['image', 'video']),
      caption: z.string(),
      relevanceScore: z.number().describe('A score from 0 to 1 indicating how relevant the post is to the query.'),
  })).describe('An array of posts that are relevant to the search query.'),
});
export type SemanticSearchOutput = z.infer<typeof SemanticSearchOutputSchema>;

export async function semanticSearch(input: SemanticSearchInput): Promise<SemanticSearchOutput> {
  return semanticSearchFlow(input);
}

const semanticSearchFlow = ai.defineFlow(
  {
    name: 'semanticSearchFlow',
    inputSchema: SemanticSearchInputSchema,
    outputSchema: SemanticSearchOutputSchema,
  },
  async ({ query }) => {
    const allPosts = await getPosts();

    // For demonstration, we will use a prompt to filter and score posts.
    // In a production scenario, you would ideally use embeddings and a vector database for this.
    
    const prompt = `You are a search engine. The user is searching for: "${query}".
    
    Here is a list of available posts in JSON format:
    ${JSON.stringify(allPosts.map(p => ({id: p.id, caption: p.caption, type: p.type, contentUrl: p.contentUrl, hashtags: p.hashtags})))}
    
    Your task is to analyze the user's query and the provided posts. Return a JSON object containing a "results" array.
    Each item in the array should represent a post that is highly relevant to the search query.
    For each result, include the post's id, contentUrl, type, caption, and a "relevanceScore" from 0.0 to 1.0.
    A score of 1.0 means a perfect match. Only include posts with a relevance score of 0.7 or higher.
    Base your relevance on the caption, hashtags, and your understanding of what the content might be.
    
    For example, if the query is "cute dogs", a post with the caption "My lovely puppy!" should have a high score.
    If the query is "sunsets", a post with the caption "Beautiful evening sky" should also get a high score.
    
    Return ONLY the JSON object.`;

    const { output } = await ai.generate({
      prompt: prompt,
      model: 'googleai/gemini-2.5-flash',
      output: {
        schema: SemanticSearchOutputSchema
      }
    });

    return output || { results: [] };
  }
);

// We need to register this new flow so Genkit knows about it.
import { config } from 'dotenv';
config();

import '@/ai/flows/ai-suggested-hashtags.ts';
import '@/ai/flows/ai-generated-caption.ts';
// This line is added to ensure the search flow is registered.
import '@/ai/flows/ai-semantic-search.ts';
