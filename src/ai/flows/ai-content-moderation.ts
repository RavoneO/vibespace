
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

export const ContentModerationSchema = z.object({
  text: z.string().describe('The text to be analyzed for harmful content.'),
});

export const ContentModerationOutputSchema = z.object({
  isHarmful: z.boolean().describe('Whether the content is determined to be harmful (e.g., hate speech, bullying, spam).'),
  reason: z.string().optional().describe('The reason for the classification, if harmful.'),
});

const contentModerationFlow = ai.defineFlow(
  {
    name: 'contentModeration',
    inputSchema: ContentModerationSchema,
    outputSchema: ContentModerationOutputSchema,
  },
  async (input) => {
    const llmResponse = await ai.generate({
      prompt: `
        You are a content moderation expert.
        Analyze the following text for harmful content, including but not limited to hate speech, bullying, harassment, and spam.

        Text to analyze: "${input.text}"

        Your response should be a JSON object with two keys:
        - "isHarmful": a boolean indicating if the content is harmful.
        - "reason": a brief explanation if the content is deemed harmful, otherwise, this can be omitted.
      `,
      model: 'googleai/gemini-pro',
      output: {
        schema: ContentModerationOutputSchema,
      },
    });

    const output = llmResponse.output;
    if (!output) {
      throw new Error('Failed to moderate content: AI output was null.');
    }
    return output;
  }
);

export async function moderateContent(input: z.infer<typeof ContentModerationSchema>): Promise<z.infer<typeof ContentModerationOutputSchema>> {
  return contentModerationFlow(input);
}
