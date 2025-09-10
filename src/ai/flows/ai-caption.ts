'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateCaptionInputSchema = z.object({
  mediaDataUri: z.string().describe('The media to generate a caption for, as a data uri.'),
});

const GenerateCaptionOutputSchema = z.object({
  captions: z.array(z.string()).describe('A list of 3-5 suggested captions for the media.'),
});

export const generateCaption = ai.defineFlow(
  {
    name: 'generateCaption',
    inputSchema: GenerateCaptionInputSchema,
    outputSchema: GenerateCaptionOutputSchema,
  },
  async (input) => {
    const llmResponse = await ai.generate({
      prompt: `Generate 3-5 creative and engaging captions for the following image. The captions should be suitable for a social media post. Vary the tone and style.

      Image:
      {{media url=mediaDataUri}}`,
      model: 'googleai/gemini-pro-vision',
      output: {
        schema: GenerateCaptionOutputSchema,
      },
    });

    return llmResponse.output()!;
  }
);
