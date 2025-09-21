
import { generateObjectDetection } from '@/ai/flows/ai-object-detection';

export async function generateImageCaption(imageUrl: string): Promise<string> {
  try {
    const detectedObjects = await generateObjectDetection(imageUrl);
    if (detectedObjects.length === 0) {
      return 'An image'; // Default alt text if no objects are detected
    }
    return `An image of ${detectedObjects.join(', ')}`;
  } catch (error) {
    console.error('Error generating image caption:', error);
    return 'An image'; // Fallback in case of an error
  }
}
