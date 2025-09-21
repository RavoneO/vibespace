'use server';

import { ai } from '@/ai/genkit';
import { SuggestHashtagsInputSchema, SuggestHashtagsOutputSchema, SuggestHashtagsInput, SuggestHashtagsOutput } from '@/lib/types';

const suggestHashtagsFlow = ai.defineFlow(
  {
    name: 'suggestHashtags',
    inputSchema: SuggestHashtagsInputSchema,
    outputSchema: SuggestHashtagsOutputSchema,
  },
  async (input: SuggestHashtagsInput): Promise<SuggestHashtagsOutput> => {
    const llmResponse = await ai.generate({
      prompt: `Suggest 5-10 relevant and trending hashtags for a social media post with the following image and description. Make sure each tag starts with a '#'.

      Image:
      {{media url=mediaDataUri}}

      {{#if description}}
      Description:
      {{{description}}}
      {{/if}}
      `,
      model: 'googleai/gemini-pro-vision',
      output: {
        schema: SuggestHashtagsOutputSchema,
      },
    });

    const output = llmResponse.output;
    if (!output) {
      throw new Error('Failed to suggest hashtags: output was null.');
    }
    return output;
  }
);

export async function suggestHashtags(input: SuggestHashtagsInput): Promise<SuggestHashtagsOutput> {
    return suggestHashtagsFlow(input);
}
