
/**
 * @fileOverview Centralized Genkit AI initialization.
 */

import {genkit, ai} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {logger} from 'genkit/logging';

logger.setLogLevel('debug');

const googleApiKey = process.env.GOOGLE_API_KEY;
if (!googleApiKey) {
  if (process.env.NODE_ENV === 'production' && process.env.npm_lifecycle_event !== 'build') {
    // In production, we should fail hard if the key is not set.
    throw new Error('GOOGLE_API_KEY is not set in the environment.');
  } else {
    // In development, we can warn the developer.
    console.warn(
      'GOOGLE_API_KEY is not set. AI features will not be available.'
    );
  }
}

genkit({
  plugins: [
    googleAI({
      apiKey: googleApiKey,
    }),
  ],
});

export {ai};
