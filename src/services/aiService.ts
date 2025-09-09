
'use server';

import { suggestHashtags as suggestHashtagsServer } from '@/ai/flows/ai-suggested-hashtags';
import { generateCaption as generateCaptionServer } from '@/ai/flows/ai-generated-caption';
import { detectObjectsInImage as detectObjectsInImageServer } from '@/ai/flows/ai-object-detection';
import type { SuggestHashtagsInput, SuggestHashtagsOutput } from '@/ai/flows/ai-suggested-hashtags';
import type { GenerateCaptionInput, GenerateCaptionOutput } from '@/ai/flows/ai-generated-caption';
import type { DetectObjectsInput, DetectObjectsOutput } from '@/ai/flows/ai-object-detection';
import { analyzeContent as analyzeContentServer } from '@/ai/flows/ai-content-analyzer';
import type { AnalyzeContentInput, AnalyzeContentOutput } from '@/ai/flows/ai-content-analyzer';
import { selectAd as selectAdServer } from '@/ai/flows/ai-ad-selector';
import type { SelectAdInput, SelectAdOutput } from '@/ai/flows/ai-ad-selector';
import { semanticSearch as semanticSearchServer } from '@/ai/flows/ai-semantic-search';
import type { SemanticSearchInput, SemanticSearchOutput } from '@/ai/flows/ai-semantic-search';
import { generateVibe as generateVibeServer } from '@/ai/flows/ai-profile-vibe';
import type { GenerateVibeInput, GenerateVibeOutput } from '@/ai/flows/ai-profile-vibe';

export async function suggestHashtags(input: SuggestHashtagsInput): Promise<SuggestHashtagsOutput> {
  return suggestHashtagsServer(input);
}

export async function generateCaption(input: GenerateCaptionInput): Promise<GenerateCaptionOutput> {
  return generateCaptionServer(input);
}

export async function detectObjectsInImage(input: DetectObjectsInput): Promise<DetectObjectsOutput> {
  return detectObjectsInImageServer(input);
}

export async function analyzeContent(input: AnalyzeContentInput): Promise<AnalyzeContentOutput> {
    return analyzeContentServer(input);
}

export async function selectAd(input: SelectAdInput): Promise<SelectAdOutput> {
    return selectAdServer(input);
}

export async function semanticSearch(input: SemanticSearchInput): Promise<SemanticSearchOutput> {
    return semanticSearchServer(input);
}

export async function generateVibe(input: GenerateVibeInput): Promise<GenerateVibeOutput> {
    return generateVibeServer(input);
}
