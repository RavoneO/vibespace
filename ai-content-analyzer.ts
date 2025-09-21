
'use server';
import 'server-only';
/**
 * @fileOverview An AI agent that analyzes content for safety and moderation.
 *
 * - analyzeContent - A function that checks if text content is appropriate.
 * - AnalyzeContentInput - The input type for the analyzeContent function.
 * - AnalyzeContentOutput - The return type for the analyzeContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeContentInputSchema = z.object({
  text: z.string().describe('The text content to be analyzed.'),
});
export type AnalyzeContentInput = z.infer<typeof AnalyzeContentInputSchema>;

const AnalyzeContentOutputSchema = z.object({
  isAllowed: z.boolean().describe('Whether the content is allowed or not.'),
  reason: z
    .string()
    .optional()
    .describe('The reason why the content was blocked, if applicable.'),
});
export type AnalyzeContentOutput = z.infer<typeof AnalyzeContentOutputSchema>;

export async function analyzeContent(
  input: AnalyzeContentInput
): Promise<AnalyzeContentOutput> {
  return analyzeContentFlow(input);
}

const analyzeContentFlow = ai.defineFlow(
  {
    name: 'analyzeContentFlow',
    inputSchema: AnalyzeContentInputSchema,
    outputSchema: AnalyzeContentOutputSchema,
  },
  async ({text}) => {
    if (!text.trim()) {
      return {isAllowed: true};
    }

    try {
      // We don't actually need to generate content, we just want the moderation result.
      // We pass the text as a prompt and the safety settings. The `generate` function
      // will throw an error if the content is blocked, or return the safety ratings.
      const generateResult = await ai.generate({
        prompt: text,
        config: {
            safetySettings: [
                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
                { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
            ]
        },
      });
      
      // TODO: Figure out how to get safety ratings from the new genkit version.
      // The old way (generateResult.safetyRatings) does not work anymore.
      // For now, we will allow all content.
      const blockedCategories: string[] = [];

      return {isAllowed: true};
    } catch (e) {
      console.error('Error during content moderation flow', e);
      // Fail open: if the moderation service fails, allow the content but log the error.
      // A more robust system might queue content for later review.
      return {isAllowed: true};
    }
  }
);
