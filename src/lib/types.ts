export type User = {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio: string;
};

export type Comment = {
  id: string;
  text: string;
  user: User;
  timestamp: string;
};

export type Post = {
  id: string;
  user: User;
  type: 'image' | 'video';
  contentUrl: string;
  caption: string;
  hashtags: string[];
  likes: number;
  comments: Comment[];
  timestamp: string;
  dataAiHint?: string;
};
