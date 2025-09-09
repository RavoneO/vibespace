
'use server';
import 'server-only';
/**
 * @fileOverview An AI agent that generates post captions based on an image.
 *
 * - generateCaption - A function that suggests captions for a given image.
 * - GenerateCaptionInput - The input type for the generateCaption function.
 * - GenerateCaptionOutput - The return type for the generateCaption function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCaptionInputSchema = z.object({
  mediaDataUri: z
    .string()
    .describe(
      "A photo, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GenerateCaptionInput = z.infer<typeof GenerateCaptionInputSchema>;

const GenerateCaptionOutputSchema = z.object({
  captions: z
    .array(z.string())
    .describe('An array of 3-5 suggested captions for the image.'),
});
export type GenerateCaptionOutput = z.infer<typeof GenerateCaptionOutputSchema>;

export async function generateCaption(input: GenerateCaptionInput): Promise<GenerateCaptionOutput> {
  return generateCaptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCaptionPrompt',
  input: {schema: GenerateCaptionInputSchema},
  output: {schema: GenerateCaptionOutputSchema},
  prompt: `You are a creative social media content creator. Based on the image provided, generate 3 to 5 engaging and creative caption ideas for a social media post. Keep them relatively short and punchy.

Media: {{media url=mediaDataUri}}

Return the suggestions as a JSON array of strings. For example:
{
  "captions": ["Caption one.", "A second, wittier caption.", "The third and final option."]
}`,
});

const generateCaptionFlow = ai.defineFlow(
  {
    name: 'generateCaptionFlow',
    inputSchema: GenerateCaptionInputSchema,
    outputSchema: GenerateCaptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
