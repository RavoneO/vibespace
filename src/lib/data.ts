
import type { User, Post, Comment, Story } from "@/lib/types";

export const users: User[] = [
  {
    id: "user1",
    name: "Vibe Dog",
    username: "vibedog",
    avatar: "https://picsum.photos/id/237/100/100",
    bio: "Just a happy dog sharing my daily adventures. 🐾",
  },
  {
    id: "user2",
    name: "Creative Cat",
    username: "creativecat",
    avatar: "https://picsum.photos/id/1074/100/100",
    bio: "Designer & artist. Turning caffeine into art. 🎨",
  },
  {
    id: "user3",
    name: "Travel Explorer",
    username: "travelexplorer",
    avatar: "https://picsum.photos/id/1015/100/100",
    bio: "Wandering the globe one city at a time. ✈️",
  },
];

export const currentUser = users[0];

const comments: Comment[] = [
    {
        id: "comment1",
        text: "This looks amazing! 🔥",
        user: users[1],
        timestamp: "2h ago",
    },
    {
        id: "comment2",
        text: "So cute!",
        user: users[2],
        timestamp: "1h ago",
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
    comments: comments,
    timestamp: "3h ago",
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
    comments: [],
    timestamp: "5h ago",
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
    comments: comments.slice(0, 1),
    timestamp: "1d ago",
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
    comments: [],
    timestamp: "2d ago",
  },
];

export const stories: Story[] = [
    {
        id: 'story-current-user',
        user: currentUser,
        type: 'image',
        contentUrl: 'https://picsum.photos/id/433/450/800',
        duration: 5,
        timestamp: '15m ago',
        dataAiHint: 'city skyline',
    },
    ...users.filter(u => u.id !== currentUser.id).map((user, index) => ({
        id: `story${index + 1}`,
        user,
        type: 'image' as 'image',
        contentUrl: `https://picsum.photos/id/${10 + index * 5}/450/800`,
        duration: 5,
        timestamp: `${(index + 1) * 2}h ago`,
        dataAiHint: 'nature portrait',
    }))
];
