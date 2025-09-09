
'use server';
import 'server-only';
/**
 * @fileOverview An AI agent that selects the most relevant ad for a user.
 *
 * - selectAd - A function that selects an ad based on user context.
 * - SelectAdInput - The input type for the selectAd function.
 * - Ad - The type representing a single advertisement.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { Ad } from '@/services/adService';

const SelectAdInputSchema = z.object({
  recentCaptions: z
    .array(z.string())
    .describe('A list of captions from posts the user has recently seen.'),
  availableAds: z
    .array(z.object({
        id: z.string(),
        headline: z.string(),
        description: z.string(),
        imageUrl: z.string(),
        keywords: z.array(z.string()),
    }))
    .describe('A list of available ads to choose from.'),
});
export type SelectAdInput = z.infer<typeof SelectAdInputSchema>;

// The output is just a single Ad object
const SelectAdOutputSchema = z.object({
    id: z.string(),
    headline: z.string(),
    description: z.string(),
    imageUrl: z.string(),
    keywords: z.array(z.string()),
});
export type SelectAdOutput = z.infer<typeof SelectAdOutputSchema>;


export async function selectAd(input: SelectAdInput): Promise<SelectAdOutput> {
  return adSelectorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'adSelectorPrompt',
  input: {schema: SelectAdInputSchema},
  output: {schema: SelectAdOutputSchema},
  prompt: `You are an expert ad targeting algorithm. Your goal is to select the single most relevant advertisement for a user based on the captions of the posts they have recently engaged with.

Analyze the user's recent captions to understand their current interests. Then, examine the keywords for each available ad. Choose the ad whose keywords best match the user's interests.

User's recent post captions:
{{#each recentCaptions}}
- "{{this}}"
{{/each}}

Available Ads (with their targeting keywords):
{{#each availableAds}}
- Ad ID {{id}}: "{{headline}}" - Keywords: [{{#each keywords}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}]
{{/each}}

Based on this analysis, return the JSON object for the single best ad to display.
`,
});

const adSelectorFlow = ai.defineFlow(
  {
    name: 'adSelectorFlow',
    inputSchema: SelectAdInputSchema,
    outputSchema: SelectAdOutputSchema,
  },
  async input => {
    if (input.availableAds.length === 0) {
        throw new Error("No ads available to select from.");
    }
    const {output} = await prompt(input);
    // Fallback to a random ad if AI fails to select one
    return output || input.availableAds[Math.floor(Math.random() * input.availableAds.length)];
  }
);
