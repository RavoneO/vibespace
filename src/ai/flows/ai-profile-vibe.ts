
'use server';
/**
 * @fileOverview An AI agent that generates a user's "vibe" based on their posts.
 *
 * - generateVibe - A function that generates a user's vibe from their post captions.
 * - GenerateVibeInput - The input type for the generateVibe function.
 * - GenerateVibeOutput - The return type for the generateVibe function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateVibeInputSchema = z.object({
  captions: z
    .array(z.string())
    .describe('A list of post captions written by the user.'),
});
export type GenerateVibeInput = z.infer<typeof GenerateVibeInputSchema>;

const GenerateVibeOutputSchema = z.object({
  vibe: z.string().describe("A short, fun, creative summary of the user's personality or vibe, based on their posts. Should include 1-3 relevant emojis at the end. Max 150 characters."),
});
export type GenerateVibeOutput = z.infer<typeof GenerateVibeOutputSchema>;

export async function generateVibe(input: GenerateVibeInput): Promise<GenerateVibeOutput> {
  return generateVibeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateVibePrompt',
  input: {schema: GenerateVibeInputSchema},
  output: {schema: GenerateVibeOutputSchema},
  prompt: `You are a social media expert who is great at reading people's personalities. Based on the following list of post captions from a user, generate a short, fun, and creative summary of their "vibe".

The vibe should be a single sentence, like a mini-bio, and should capture the essence of their posts. End the sentence with 1-3 relevant emojis. Keep it under 150 characters.

For example, if the captions are about dogs, parks, and sunshine, a good vibe would be: "Lover of sunny days and furry friends. ☀️🐶"
If the captions are about hiking, mountains, and sunrises, a good vibe would be: "Chasing sunrises and mountain peaks. ⛰️🌅"

Here are the user's captions:
{{#each captions}}
- "{{this}}"
{{/each}}
`,
});

const generateVibeFlow = ai.defineFlow(
  {
    name: 'generateVibeFlow',
    inputSchema: GenerateVibeInputSchema,
    outputSchema: GenerateVibeOutputSchema,
  },
  async input => {
    // If there are no captions, return a default vibe.
    if (input.captions.length === 0) {
      return { vibe: "Just joined the vibe! Ready to share. ✨" };
    }
    const {output} = await prompt(input);
    return output!;
  }
);
