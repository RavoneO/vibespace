'use server';

import { ai } from '@/ai/genkit';
import { GenerateVibeInputSchema, GenerateVibeOutputSchema, GenerateVibeInput, GenerateVibeOutput } from '@/lib/types';

const generateVibeFlow = ai.defineFlow(
  {
    name: 'generateVibe',
    inputSchema: GenerateVibeInputSchema,
    outputSchema: GenerateVibeOutputSchema,
  },
  async (input: GenerateVibeInput): Promise<GenerateVibeOutput> => {
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
