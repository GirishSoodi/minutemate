
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
import { promises as fs } from 'fs';
import path from 'path';

// Define paths for credentials and token files
const CREDENTIALS_PATH = path.join(process.cwd(), 'src/google/credentials.json');
const TOKEN_PATH = path.join(process.cwd(), 'src/google/token.json');

/**
 * Load or refresh the authorization client.
 */
async function authorize(): Promise<OAuth2Client> {
    let credentials;
    try {
        const credentialsContent = await fs.readFile(CREDENTIALS_PATH, 'utf8');
        credentials = JSON.parse(credentialsContent);
    } catch (err) {
        throw new Error(
            'Failed to load credentials.json. Please ensure you have downloaded your credentials from the Google Cloud Console and placed the file at src/google/credentials.json.'
        );
    }

    const { client_secret, client_id, redirect_uris, project_id } = credentials.installed || credentials.web;

    if (!client_id || !client_secret || client_id.includes('YOUR_CLIENT_ID')) {
         throw new Error('Google client_id or client_secret is missing or incomplete in src/google/credentials.json. Please add them from your Google Cloud project.');
    }
     if (!project_id || project_id.includes('YOUR_PROJECT_ID')) {
         throw new Error('Google project_id is missing or incomplete in src/google/credentials.json. Please add it from your Google Cloud project.');
    }

    const auth = new google.auth.OAuth2(client_id, client_secret, redirect_uris?.[0]);

    try {
        const tokenContent = await fs.readFile(TOKEN_PATH, 'utf8');
        const token = JSON.parse(tokenContent);
        auth.setCredentials(token);
    } catch (tokenError) {
        throw new Error(
            'Failed to load token.json. This application cannot create it for you. Please run the one-time authorization script (`node auth.js`) locally to generate `token.json` and add it to the `src/google` directory.'
        );
    }

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
        // Check for specific 'invalid_grant' error
        if (e.message && e.message.includes('invalid_grant')) {
             throw new Error("Google authentication failed due to an invalid token. Your `token.json` has likely expired. Please delete the `src/google/token.json` file and regenerate it by running `node auth.js` in your local terminal.");
        }
        console.error("Google Docs API Error:", e);
        throw new Error(`Failed to create Google Doc: ${e.message}`);
    }
  }
);
