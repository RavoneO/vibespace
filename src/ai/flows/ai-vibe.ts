'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateVibeInputSchema = z.object({
  captions: z.array(z.string()).describe('A list of post captions from a user.'),
});
export type GenerateVibeInput = z.infer<typeof GenerateVibeInputSchema>;

const GenerateVibeOutputSchema = z.object({
  vibe: z.string().describe("A short, fun, emoji-filled vibe that summarizes the user's personality based on their post captions."),
});
export type GenerateVibeOutput = z.infer<typeof GenerateVibeOutputSchema>;

const generateVibeFlow = ai.defineFlow(
  {
    name: 'generateVibe',
    inputSchema: GenerateVibeInputSchema,
    outputSchema: GenerateVibeOutputSchema,
  },
  async (input) => {
    const llmResponse = await ai.generate({
      prompt: `Analyze the following social media captions and generate a short, fun, "vibe" that describes the user's personality. The vibe should be 2-4 words and include an emoji.

      Examples:
      - "Mysterious Artist 🎨"
      - "Sunset Chaser 🌅"
      - "Cozy Homebody ☕️"
      - "Mountain Adventurer 🏔️"
      
      Captions:
      ${input.captions.map(c => `- "${c}"`).join('\n')}
      `,
      model: 'googleai/gemini-pro',
      output: {
        schema: GenerateVibeOutputSchema,
      },
    });

    const output = llmResponse.output;
    if (!output) {
      throw new Error('Failed to generate vibe: output was null.');
    }
    return output;
  }
);

export async function generateVibe(input: GenerateVibeInput): Promise<GenerateVibeOutput> {
    return generateVibeFlow(input);
}
