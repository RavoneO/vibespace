
'use server';
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
      const moderationResult = await ai.moderate({
        prompt: text,
        // Using a high threshold to be more strict.
        // In a real-world scenario, this could be configured based on context.
        config: {
            safetySettings: [
                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
                { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
            ]
        }
      });
      
      const blockedCategories = moderationResult.results
        .filter(r => r.blocked)
        .map(r => r.category.replace('HARM_CATEGORY_', '').replace(/_/g, ' ').toLowerCase());

      if (blockedCategories.length > 0) {
        return {
          isAllowed: false,
          reason: `This content was blocked for violating our policy on: ${blockedCategories.join(', ')}.`,
        };
      }

      return {isAllowed: true};
    } catch (e) {
      console.error('Error during content moderation flow', e);
      // Fail open: if the moderation service fails, allow the content but log the error.
      // A more robust system might queue content for later review.
      return {isAllowed: true};
    }
  }
);
