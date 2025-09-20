
import { NextResponse } from 'next/server';
import { generateVibe } from '@/ai/flows/ai-vibe';
import { generateCaption } from '@/ai/flows/ai-caption';
import { suggestHashtags } from '@/ai/flows/ai-hashtags';
import { detectObjects } from '@/ai/flows/ai-object-detection';
import { semanticSearch } from '@/ai/flows/ai-semantic-search';

export async function POST(request: Request) {
  try {
    const { action, payload } = await request.json();

    switch (action) {
      case 'generate-vibe':
        const vibeResult = await generateVibe(payload);
        return NextResponse.json(vibeResult);
      
      case 'generate-caption':
        const captionResult = await generateCaption(payload);
        return NextResponse.json(captionResult);

      case 'suggest-hashtags':
        const hashtagsResult = await suggestHashtags(payload);
        return NextResponse.json(hashtagsResult);
      
      case 'detect-objects':
        const detectionResult = await detectObjects(payload);
        return NextResponse.json(detectionResult);

      case 'semantic-search':
        const searchResult = await semanticSearch(payload);
        return NextResponse.json(searchResult);

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('AI API Error:', error);
    return NextResponse.json({ error: error.message || 'An unexpected error occurred' }, { status: 500 });
  }
}
