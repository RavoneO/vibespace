import { Timestamp } from "firebase/firestore";
import { z } from 'zod';

export type User = {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
  bio: string;
  followers?: string[];
  following?: string[];
  savedPosts?: string[];
  isPrivate?: boolean;
  showActivityStatus?: boolean;
  interests?: string[];
  dataSaver?: boolean;
  increaseContrast?: boolean;
  reduceMotion?: boolean;
  notifications?: {
    push?: boolean;
    email?: boolean;
    inApp?: boolean;
  };
  filterSensitiveContent?: boolean;
  twoFactorAuth?: boolean;
};

export type Comment = {
  id: string;
  text: string;
  user: User;
  timestamp: number;
  userId: string;
};

export type PostTag = {
  label: string;
  text: string;
  box: number[];
}

export type Post = {
  id: string;
  user: User;
  collaborators?: User[];
  type: 'image' | 'video';
  contentUrl: string;
  caption: string;
  hashtags: string[];
  likes: number;
  likedBy: string[];
  comments: Comment[];
  tags?: PostTag[];
  timestamp: number | null;
  status?: 'processing' | 'published' | 'failed';
  dataAiHint?: string;
  isSponsored?: boolean;
};

export type Story = {
    id:string;
    user: User;
    type: 'image' | 'video';
    contentUrl: string;
    duration: number; // in seconds
    timestamp: number | null;
    status?: 'processing' | 'published' | 'failed';
    dataAiHint?: string;
    viewed?: boolean;
}

export type Message = {
    id: string;
    senderId: string;
    timestamp: number;
    type: 'text' | 'image' | 'video' | 'file';
    text?: string; 
    contentUrl?: string; 
    fileName?: string; 
    fileSize?: number; 
    readBy?: { [userId: string]: number };
}

export type Conversation = {
    id: string;
    userIds: string[];
    users: User[];
    lastMessage: Message | null;
    timestamp: number;
    isGroup?: boolean;
    groupName?: string;
    groupAvatar?: string;
}

export type Activity = {
    id:string;
    type: 'like' | 'comment' | 'follow' | 'mention';
    actor: User; // The user who performed the action
    targetPost?: { id: string; contentUrl: string; type: 'image' | 'video' };
    timestamp: number;
};

export interface Ad {
    id: string;
    headline: string;
    description: string;
    imageUrl: string;
    keywords: string[];
}

export type Tip = {
  id: string;
  fromUserId: string;
  toUserId: string;
  postId: string;
  amount: number; // in cents
  timestamp: number;
};

export type FeedItem = (Post & { feedItemType: 'post' }) | (Ad & { feedItemType: 'ad' });

export function isPost(item: FeedItem): item is Post & { feedItemType: 'post' } {
    return 'caption' in item;
}

export function isAd(item: FeedItem): item is Ad & { feedItemType: 'ad' } {
    return 'headline' in item;
}

// AI Flow Types

export const GenerateVibeInputSchema = z.object({
  captions: z.array(z.string()).describe('A list of post captions from a user.'),
});
export type GenerateVibeInput = z.infer<typeof GenerateVibeInputSchema>;

export const GenerateVibeOutputSchema = z.object({
  vibe: z.string().describe("A short, fun, emoji-filled vibe that summarizes the user's personality based on their post captions."),
});
export type GenerateVibeOutput = z.infer<typeof GenerateVibeOutputSchema>;

export const GenerateCaptionInputSchema = z.object({
  mediaDataUri: z.string().describe('The media to generate a caption for, as a data uri.'),
});
export type GenerateCaptionInput = z.infer<typeof GenerateCaptionInputSchema>;

export const GenerateCaptionOutputSchema = z.object({
  captions: z.array(z.string()).describe('A list of 3-5 suggested captions for the media.'),
});
export type GenerateCaptionOutput = z.infer<typeof GenerateCaptionOutputSchema>;

export const SuggestHashtagsInputSchema = z.object({
  mediaDataUri: z.string().describe('The media to suggest hashtags for, as a data uri.'),
  description: z.string().optional().describe('An optional user-provided description of the media.'),
});
export type SuggestHashtagsInput = z.infer<typeof SuggestHashtagsInputSchema>;

export const SuggestHashtagsOutputSchema = z.object({
    hashtags: z.array(z.string()).describe('A list of 5-10 relevant hashtags, each starting with #.')
});
export type SuggestHashtagsOutput = z.infer<typeof SuggestHashtagsOutputSchema>;

export const DetectObjectsInputSchema = z.object({
  mediaDataUri: z.string().describe("A photo of the scene to analyze, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});
export type DetectObjectsInput = z.infer<typeof DetectObjectsInputSchema>;

export const DetectObjectsOutputSchema = z.object({
  objects: z.array(z.object({
    label: z.string().describe('A descriptive label for the detected object (e.g., "dog", "latte", "sunglasses").'),
    box: z.array(z.number()).length(4).describe('The bounding box of the object, in the format [x_min, y_min, x_max, y_max] with normalized coordinates (0-1).'),
  })).describe('A list of objects detected in the image.')
});
export type DetectObjectsOutput = z.infer<typeof DetectObjectsOutputSchema>;

const PostContentSchema = z.object({
  id: z.string(),
  caption: z.string(),
});

export const SemanticSearchInputSchema = z.object({
  query: z.string().describe('The user-provided search query.'),
  posts: z.array(PostContentSchema).describe('The list of posts to search through.'),
});
export type SemanticSearchInput = z.infer<typeof SemanticSearchInputSchema>;

export const SemanticSearchOutputSchema = z.object({
  sortedPostIds: z.array(z.string()).describe(
    'An array of post IDs, sorted by their semantic relevance to the query (most relevant first).'
  ),
});
export type SemanticSearchOutput = z.infer<typeof SemanticSearchOutputSchema>;
