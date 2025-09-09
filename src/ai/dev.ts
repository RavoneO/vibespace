
'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/ai-suggested-hashtags.ts';
import '@/ai/flows/ai-generated-caption.ts';
import '@/ai/flows/ai-semantic-search.ts';
import '@/ai/flows/ai-profile-vibe.ts';
