'use server';
/**
 * @fileOverview An AI flow for detecting objects in an image.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const DetectObjectsInputSchema = z.object({
  mediaDataUri: z.string().describe("A photo of the scene to analyze, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});
export type DetectObjectsInput = z.infer<typeof DetectObjectsInputSchema>;

const DetectObjectsOutputSchema = z.object({
  objects: z.array(z.object({
    label: z.string().describe('A descriptive label for the detected object (e.g., "dog", "latte", "sunglasses").'),
    box: z.array(z.number()).length(4).describe('The bounding box of the object, in the format [x_min, y_min, x_max, y_max] with normalized coordinates (0-1).'),
  })).describe('A list of objects detected in the image.')
});
export type DetectObjectsOutput = z.infer<typeof DetectObjectsOutputSchema>;

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
  async input => {
    const result = await prompt(input);
    const output = result.output;
    if (!output) {
      throw new Error('Failed to detect objects: output was null.');
    }
    return output;
  }
);
