'use server';
/**
 * @fileOverview Centralized Genkit AI initialization.
 */

import {genkit} from 'genkit';
import {googleAI} from 'genkit/googleai';

const googleApiKey = process.env.GOOGLE_API_KEY;
if (!googleApiKey) {
  if (process.env.NODE_ENV === 'production') {
    // In production, we should fail hard if the key is not set.
    throw new Error('GOOGLE_API_KEY is not set in the environment.');
  } else {
    // In development, we can warn the developer.
    console.warn(
      'GOOGLE_API_KEY is not set. AI features will not be available.'
    );
  }
}

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: googleApiKey,
    }),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
