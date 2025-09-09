
import 'server-only';
import {NextResponse} from 'next/server';
import {generateCaption} from '@/ai/flows/ai-generated-caption';
import {suggestHashtags} from '@/ai/flows/ai-suggested-hashtags';
import {detectObjectsInImage} from '@/ai/flows/ai-object-detection';
import {semanticSearch} from '@/ai/flows/ai-semantic-search';
import {generateVibe} from '@/ai/flows/ai-profile-vibe';

// This handler will delegate to the appropriate AI flow based on the 'action' parameter.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {action, payload} = body;

    switch (action) {
      case 'generate-caption':
        const captionOutput = await generateCaption(payload);
        return NextResponse.json(captionOutput);
      case 'suggest-hashtags':
        const hashtagsOutput = await suggestHashtags(payload);
        return NextResponse.json(hashtagsOutput);
      case 'detect-objects':
        const objectsOutput = await detectObjectsInImage(payload);
        return NextResponse.json(objectsOutput);
      case 'semantic-search':
        const searchOutput = await semanticSearch(payload);
        return NextResponse.json(searchOutput);
      case 'generate-vibe':
        const vibeOutput = await generateVibe(payload);
        return NextResponse.json(vibeOutput);
      default:
        return NextResponse.json(
          {error: 'Invalid action'},
          {status: 400}
        );
    }
  } catch (error: any) {
    console.error('AI API Error:', error);
    return NextResponse.json(
      {error: error.message || 'An unexpected error occurred'},
      {status: 500}
    );
  }
}
