'use server';
/**
 * @fileOverview An AI flow for detecting objects in an image.
 */

import { ai } from '@/ai/genkit';
import { DetectObjectsInputSchema, DetectObjectsOutputSchema, DetectObjectsInput, DetectObjectsOutput } from '@/lib/types';

export async function detectObjects(input: DetectObjectsInput): Promise<DetectObjectsOutput> {
  return detectObjectsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'detectObjectsPrompt',
  input: { schema: DetectObjectsInputSchema },
  output: { schema: DetectObjectsOutputSchema },
  prompt: `You are an expert at identifying and locating common objects in images.

Analyze the following image and identify the main, taggable objects. For each object, provide a simple, one-word or two-word descriptive label and its bounding box coordinates.

Image:
{{media url=mediaDataUri}}`,
});

const detectObjectsFlow = ai.defineFlow(
  {
    name: 'detectObjectsFlow',
    inputSchema: DetectObjectsInputSchema,
    outputSchema: DetectObjectsOutputSchema,
  },
  async (input: DetectObjectsInput): Promise<DetectObjectsOutput> => {
    const result = await prompt(input);
    const output = result.output;
    if (!output) {
      throw new Error('Failed to detect objects: output was null.');
    }
    return output;
  }
);
