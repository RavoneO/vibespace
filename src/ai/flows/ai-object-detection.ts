
'use server';
/**
 * @fileOverview An AI agent that detects objects in an image.
 *
 * - detectObjectsInImage - A function that finds objects in an image and returns their bounding boxes.
 * - DetectObjectsInput - The input type for the detectObjectsInImage function.
 * - DetectObjectsOutput - The return type for the detectObjectsInImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectObjectsInputSchema = z.object({
  mediaDataUri: z
    .string()
    .describe(
      "A photo, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type DetectObjectsInput = z.infer<typeof DetectObjectsInputSchema>;

const DetectedObjectSchema = z.object({
    label: z.string().describe('The name of the detected object (e.g., "dog", "sunglasses").'),
    box: z.array(z.number()).length(4).describe('The bounding box of the object in [x_min, y_min, x_max, y_max] format, where coordinates are normalized from 0.0 to 1.0.'),
});

const DetectObjectsOutputSchema = z.object({
  objects: z
    .array(DetectedObjectSchema)
    .describe('An array of detected objects with their labels and bounding boxes.'),
});
export type DetectObjectsOutput = z.infer<typeof DetectObjectsOutputSchema>;

export async function detectObjectsInImage(input: DetectObjectsInput): Promise<DetectObjectsOutput> {
  return detectObjectsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'detectObjectsPrompt',
  input: {schema: DetectObjectsInputSchema},
  output: {schema: DetectObjectsOutputSchema},
  prompt: `You are an expert at object detection. Analyze the provided image and identify prominent objects. For each object, provide a descriptive label and its normalized bounding box.

The bounding box coordinates must be in the format [x_min, y_min, x_max, y_max], where each value is a float between 0.0 and 1.0, representing the position relative to the image dimensions.

Media: {{media url=mediaDataUri}}

Return a JSON object containing an array of the detected objects.`,
});

const detectObjectsFlow = ai.defineFlow(
  {
    name: 'detectObjectsFlow',
    inputSchema: DetectObjectsInputSchema,
    outputSchema: DetectObjectsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
