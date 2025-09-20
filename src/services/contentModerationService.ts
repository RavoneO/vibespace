
import { moderateContent } from '@/ai/flows/ai-content-moderation';

export async function checkAndModerateContent(text: string): Promise<boolean> {
  try {
    const moderationResult = await moderateContent({ text });
    if (moderationResult.isHarmful) {
      handleHarmfulContent(text, moderationResult.reason);
      return true; // Indicates that the content is harmful
    }
    return false; // Indicates that the content is not harmful
  } catch (error) {
    console.error('Error moderating content:', error);
    return false; // In case of error, assume content is not harmful to avoid blocking legitimate content
  }
}

function handleHarmfulContent(text: string, reason?: string) {
  // In a real application, you would implement a more robust system for handling harmful content.
  // This could include:
  // - Hiding the content from public view
  // - Sending it to a moderation queue for human review
  // - Notifying the user who posted the content
  // - Suspending the user's account
  console.log('Harmful content detected:', { text, reason });
}
