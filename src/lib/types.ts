
import { Timestamp } from "firebase/firestore";

export type User = {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio: string;
  followers?: string[];
  following?: string[];
};

export type Comment = {
  id: string;
  text: string;
  user: User;
  timestamp: string | Timestamp;
};

export type Post = {
  id: string;
  user: User;
  type: 'image' | 'video';
  contentUrl: string;
  caption: string;
  hashtags: string[];
  likes: number;
  likedBy: string[];
  comments: Comment[];
  timestamp: string | Timestamp;
  dataAiHint?: string;
};

export type Story = {
    id: string;
    user: User;
    type: 'image' | 'video';
    contentUrl: string;
    duration: number; // in seconds
    timestamp: string | Timestamp;
    dataAiHint?: string;
}
