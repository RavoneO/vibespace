
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const AdSchema = z.object({
  id: z.string(),
  headline: z.string(),
  description: z.string(),
  keywords: z.array(z.string()),
});

export const SelectAdInputSchema = z.object({
  ads: z.array(AdSchema).describe('The list of available ads to choose from.'),
  recentCaptions: z.array(z.string()).describe("A list of the user's recent post captions to determine their interests."),
});
export type SelectAdInput = z.infer<typeof SelectAdInputSchema>;

export const SelectAdOutputSchema = z.object({
  bestAdId: z.string().describe('The ID of the single best ad for the user.'),
});
export type SelectAdOutput = z.infer<typeof SelectAdOutputSchema>;

const selectAdFlow = ai.defineFlow(
  {
    name: 'selectAd',
    inputSchema: SelectAdInputSchema,
    outputSchema: SelectAdOutputSchema,
  },
  async (input) => {
    const llmResponse = await ai.generate({
      prompt: `
        Analyze the user's recent post captions to understand their interests. Then, select the best single ad from the provided list that matches these interests.

        User's Recent Captions:
        ---
        ${input.recentCaptions.map(c => `- ${c}`).join('\n')}
        ---

        Available Ads:
        ---
        ${input.ads.map(ad => `Ad ID: ${ad.id}, Keywords: ${ad.keywords.join(', ')}`).join('\n')}
        ---

        Based on the user's captions, determine their primary interests. Then, from the "Available Ads", identify the one ad whose keywords most closely align with those interests.

        Your response should only contain the ID of the most relevant ad.
      `,
      model: 'googleai/gemini-pro',
      output: {
        schema: SelectAdOutputSchema,
      },
    });

    const output = llmResponse.output;
    if (!output) {
      throw new Error('Failed to select an ad: AI output was null.');
    }
    return output;
  }
);

export async function selectAdWithAi(input: SelectAdInput): Promise<SelectAdOutput> {
  return selectAdFlow(input);
}
