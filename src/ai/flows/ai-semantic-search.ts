
'use server';

import { ai } from '@/ai/genkit';
import { SemanticSearchInputSchema, SemanticSearchOutputSchema, SemanticSearchInput, SemanticSearchOutput } from '@/lib/types';

const semanticSearchFlow = ai.defineFlow(
  {
    name: 'semanticSearch',
    inputSchema: SemanticSearchInputSchema,
    outputSchema: SemanticSearchOutputSchema,
  },
  async (input: SemanticSearchInput): Promise<SemanticSearchOutput> => {
    const llmResponse = await ai.generate({
      prompt: `
        You are a semantic search engine. Your task is to reorder a list of social media posts based on their relevance to a user's search query.

        User Query: "${input.query}"

        Posts to sort:
        ---
        ${input.posts.map(p => `Post ID: ${p.id}, Caption: "${p.caption}"`).join('\n')}
        ---

        Analyze the semantic meaning of the user's query and each post's caption. 
        
        Your response should only contain a JSON object with a single key, "sortedPostIds", which is an array of the post IDs sorted from most to least relevant to the user's query.
      `,
      model: 'googleai/gemini-pro',
      output: {
        schema: SemanticSearchOutputSchema,
      },
    });

    const output = llmResponse.output;
    if (!output) {
      throw new Error('Failed to sort posts: AI output was null.');
    }
    return output;
  }
);

export async function semanticSearch(input: SemanticSearchInput): Promise<SemanticSearchOutput> {
  return semanticSearchFlow(input);
}
