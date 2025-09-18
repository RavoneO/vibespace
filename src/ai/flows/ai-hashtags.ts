'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const SuggestHashtagsInputSchema = z.object({
  mediaDataUri: z.string().describe('The media to suggest hashtags for, as a data uri.'),
  description: z.string().optional().describe('An optional user-provided description of the media.'),
});
export type SuggestHashtagsInput = z.infer<typeof SuggestHashtagsInputSchema>;

const SuggestHashtagsOutputSchema = z.object({
    hashtags: z.array(z.string()).describe('A list of 5-10 relevant hashtags, each starting with #.')
});
export type SuggestHashtagsOutput = z.infer<typeof SuggestHashtagsOutputSchema>;

const suggestHashtagsFlow = ai.defineFlow(
  {
    name: 'suggestHashtags',
    inputSchema: SuggestHashtagsInputSchema,
    outputSchema: SuggestHashtagsOutputSchema,
  },
  async (input) => {
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
