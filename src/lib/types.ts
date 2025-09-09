
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
  isPrivate?: boolean;
  showActivityStatus?: boolean;
};

export type Comment = {
  id: string;
  text: string;
  user: User;
  timestamp: string | Timestamp;
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
  timestamp: string | Timestamp;
  status?: 'processing' | 'published';
  dataAiHint?: string;
};

export type Story = {
    id: string;
    user: User;
    type: 'image' | 'video';
    contentUrl: string;
    duration: number; // in seconds
    timestamp: string | Timestamp;
    status?: 'processing' | 'published';
    dataAiHint?: string;
    viewed?: boolean;
}

export type Message = {
    id: string;
    senderId: string;
    text: string;
    timestamp: Timestamp | Date;
}

export type Conversation = {
    id: string;
    userIds: string[];
    users: User[];
    lastMessage: Message | null;
    timestamp: Timestamp | Date;
}

export type Activity = {
    id:string;
    type: 'like' | 'comment' | 'follow' | 'mention';
    actor: User; // The user who performed the action
    targetPost?: { id: string; contentUrl: string; type: 'image' | 'video' };
    timestamp: Timestamp;
};
