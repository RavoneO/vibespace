
import { Timestamp } from "firebase/firestore";

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
  blockedUsers?: string[];
  interests?: string[];
  isPrivate?: boolean;
  showActivityStatus?: boolean;
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
  isReel?: boolean;
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
