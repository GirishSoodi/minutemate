'use server';

/**
 * @fileOverview A service for interacting with the Google Docs API.
 *
 * - createGoogleDoc - A tool that creates a new Google Doc with the given title and content.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

/**
 * Load the authorization client using environment variables.
 */
async function authorize(): Promise<OAuth2Client> {
  const {
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI,
    GOOGLE_REFRESH_TOKEN,
  } = process.env;

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI || !GOOGLE_REFRESH_TOKEN) {
    throw new Error('Missing one or more Google OAuth environment variables.');
  }

  const auth = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );

  auth.setCredentials({
    refresh_token: GOOGLE_REFRESH_TOKEN,
  });

  return auth;
}

export const createGoogleDoc = ai.defineTool(
  {
    name: 'createGoogleDoc',
    description: 'Creates a Google Doc with the provided title and content.',
    inputSchema: z.object({
      title: z.string().describe('The title of the document.'),
      content: z.string().describe('The body content of the document, formatted with markdown.'),
    }),
    outputSchema: z.object({
      documentId: z.string(),
      url: z.string(),
    }),
  },
  async ({ title, content }) => {
    try {
      const auth = await authorize();
      const docs = google.docs({ version: 'v1', auth });

      const createResponse = await docs.documents.create({
        requestBody: {
          title: title,
        },
      });

      const documentId = createResponse.data.documentId;
      if (!documentId) {
        throw new Error('Failed to create Google Doc: No document ID returned.');
      }

      await docs.documents.batchUpdate({
        documentId: documentId,
        requestBody: {
          requests: [
            {
              insertText: {
                location: {
                  index: 1, // Start at the beginning of the document
                },
                text: content,
              },
            },
          ],
        },
      });

      const url = `https://docs.google.com/document/d/${documentId}/edit`;

      return { documentId, url };
    } catch (e: any) {
      if (e.message && e.message.includes('invalid_grant')) {
        throw new Error(
          'Google authentication failed due to an invalid or expired token. Please regenerate your refresh token and update the environment variable.'
        );
      }

      console.error('Google Docs API Error:', e);
      throw new Error(`Failed to create Google Doc: ${e.message}`);
    }
  }
);
