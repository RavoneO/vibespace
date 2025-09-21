'use server';

import { ai } from '@/ai/genkit';
import { GenerateCaptionInputSchema, GenerateCaptionOutputSchema, GenerateCaptionInput, GenerateCaptionOutput } from '@/lib/types';

const generateCaptionFlow = ai.defineFlow(
  {
    name: 'generateCaption',
    inputSchema: GenerateCaptionInputSchema,
    outputSchema: GenerateCaptionOutputSchema,
  },
  async (input: GenerateCaptionInput): Promise<GenerateCaptionOutput> => {
    const llmResponse = await ai.generate({
      prompt: `Generate 3-5 creative and engaging captions for the following image. The captions should be suitable for a social media post. Vary the tone and style.

      Image:
      {{media url=mediaDataUri}}`,
      model: 'googleai/gemini-pro-vision',
      output: {
        schema: GenerateCaptionOutputSchema,
      },
    });

    const output = llmResponse.output;
    if (!output) {
      throw new Error('Failed to generate caption: output was null.');
    }
    return output;
  }
);

export async function generateCaption(input: GenerateCaptionInput): Promise<GenerateCaptionOutput> {
    return generateCaptionFlow(input);
}
