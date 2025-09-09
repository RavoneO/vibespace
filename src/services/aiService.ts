
'use server';
/**
 * @fileoverview This file acts as a server-side bridge for calling Genkit AI flows.
 * It re-exports functions from the actual flow definitions, ensuring that
 * server-only code from the flows is not directly imported into client components.
 * Client components should import these functions from this file.
 */

import { suggestHashtags as suggestHashtagsFlow } from '@/ai/flows/ai-suggested-hashtags';
import type { SuggestHashtagsInput, SuggestHashtagsOutput } from '@/ai/flows/ai-suggested-hashtags';

import { generateCaption as generateCaptionFlow } from '@/ai/flows/ai-generated-caption';
import type { GenerateCaptionInput, GenerateCaptionOutput } from '@/ai/flows/ai-generated-caption';

import { detectObjectsInImage as detectObjectsFlow } from '@/ai/flows/ai-object-detection';
import type { DetectObjectsInput, DetectObjectsOutput } from '@/ai/flows/ai-object-detection';


export async function suggestHashtags(input: SuggestHashtagsInput): Promise<SuggestHashtagsOutput> {
    return suggestHashtagsFlow(input);
}

export async function generateCaption(input: GenerateCaptionInput): Promise<GenerateCaptionOutput> {
    return generateCaptionFlow(input);
}

export async function detectObjectsInImage(input: DetectObjectsInput): Promise<DetectObjectsOutput> {
    return detectObjectsFlow(input);
}
