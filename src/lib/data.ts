
import type { User, Post, Comment, Story } from "@/lib/types";

export const users: User[] = [
  {
    id: "user1",
    name: "Vibe Dog",
    username: "vibedog",
    email: "vibedog@example.com",
    avatar: "https://picsum.photos/id/237/100/100",
    bio: "Just a happy dog sharing my daily adventures. 🐾",
  },
  {
    id: "user2",
    name: "Creative Cat",
    username: "creativecat",
    email: "creativecat@example.com",
    avatar: "https://picsum.photos/id/1074/100/100",
    bio: "Designer & artist. Turning caffeine into art. 🎨",
  },
  {
    id: "user3",
    name: "Travel Explorer",
    username: "travelexplorer",
    email: "travelexplorer@example.com",
    avatar: "https://picsum.photos/id/1015/100/100",
    bio: "Wandering the globe one city at a time. ✈️",
  },
];

export const currentUser = users[0];

const now = Date.now();

const comments: Comment[] = [
    {
        id: "comment1",
        text: "This looks amazing! 🔥",
        user: users[1],
        userId: users[1].id,
        timestamp: now - 2 * 60 * 60 * 1000,
    },
    {
        id: "comment2",
        text: "So cute!",
        user: users[2],
        userId: users[2].id,
        timestamp: now - 1 * 60 * 60 * 1000,
    },
];

export const posts: Post[] = [
  {
    id: "post1",
    user: users[0],
    type: "image",
    contentUrl: "https://picsum.photos/id/237/600/600",
    dataAiHint: "dog black",
    caption: "Enjoying a beautiful day out in the park! The weather is perfect for a long walk.",
    hashtags: ["#doglife", "#goodboy", "#parkdays", "#vibes"],
    likes: 128,
    likedBy: [],
    comments: comments,
    timestamp: now - 3 * 60 * 60 * 1000,
  },
  {
    id: "post2",
    user: users[1],
    type: "image",
    contentUrl: "https://picsum.photos/id/1060/600/750",
    dataAiHint: "mountain landscape",
    caption: "Morning hike views. There's nothing like watching the sunrise from the top of a mountain.",
    hashtags: ["#hikingadventures", "#sunrise", "#naturelover", "#getoutside"],
    likes: 256,
    likedBy: [],
    comments: [],
    timestamp: now - 5 * 60 * 60 * 1000,
  },
  {
    id: "post3",
    user: users[2],
    type: "image",
    contentUrl: "https://picsum.photos/id/1025/600/600",
    dataAiHint: "dog puppy",
    caption: "Meet the newest member of the family! Everyone, say hi to Buddy.",
    hashtags: ["#puppylove", "#newfriend", "#dogsofinstagram"],
    likes: 512,
    likedBy: [],
    comments: comments.slice(0, 1),
    timestamp: now - 24 * 60 * 60 * 1000,
  },
    {
    id: "post4",
    user: users[0],
    type: "image",
    contentUrl: "https://picsum.photos/id/10/600/400",
    dataAiHint: "forest path",
    caption: "Lost in the right direction.",
    hashtags: ["#forest", "#path", "#nature"],
    likes: 98,
    likedBy: [],
    comments: [],
    timestamp: now - 2 * 24 * 60 * 60 * 1000,
  },
];

export const stories: Story[] = [
    {
        id: 'story-current-user',
        user: currentUser,
        type: 'image',
        contentUrl: 'https://picsum.photos/id/433/450/800',
        duration: 5,
        timestamp: now - 15 * 60 * 1000,
        dataAiHint: 'city skyline',
    },
    ...users.filter(u => u.id !== currentUser.id).map((user, index) => ({
        id: `story${index + 1}`,
        user,
        type: 'image' as 'image',
        contentUrl: `https://picsum.photos/id/${10 + index * 5}/450/800`,
        duration: 5,
        timestamp: now - (index + 1) * 2 * 60 * 60 * 1000,
        dataAiHint: 'nature portrait',
    }))
];
