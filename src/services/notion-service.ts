'use server';

/**
 * @fileOverview A service for interacting with the Notion API.
 * 
 * - createNotionPage - A tool that creates a new Notion page with the meeting summary.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { Client } from '@notionhq/client';

// Notion's rich text content limit is 2000 characters per block.
const NOTION_CHAR_LIMIT = 2000;

/**
 * Splits a long string into multiple Notion paragraph blocks to avoid character limits.
 * @param text The text content to convert.
 * @returns An array of Notion block objects.
 */
const textToNotionBlocks = (text: string) => {
    const blocks: any[] = [];
    if (!text) return blocks;
    
    // Split by newlines to preserve paragraph breaks
    const paragraphs = text.split('\n');

    for (const paragraph of paragraphs) {
        // If a paragraph is empty, it can be skipped or represented as an empty block.
        // For this use case, we'll just skip it.
        if (paragraph.trim() === '') continue;

        // Split long paragraphs into multiple chunks to respect the character limit
        for (let i = 0; i < paragraph.length; i += NOTION_CHAR_LIMIT) {
            const chunk = paragraph.substring(i, i + NOTION_CHAR_LIMIT);
            blocks.push({
                object: 'block',
                type: 'paragraph',
                paragraph: {
                    rich_text: [{ type: 'text', text: { content: chunk } }],
                },
            });
        }
    }
    return blocks;
};


export const createNotionPage = ai.defineTool(
    {
        name: 'createNotionPage',
        description: 'Creates a new page in Notion with the meeting summary.',
        inputSchema: z.object({
            title: z.string().describe('The title for the Notion page.'),
            content: z.string().describe('The meeting summary content.'),
        }),
        outputSchema: z.object({
            pageId: z.string(),
            url: z.string(),
        }),
    },
    async ({ title, content }) => {
        const notionApiKey = process.env.NOTION_API_KEY;
        const notionPageId = process.env.NOTION_PAGE_ID;

        if (!notionApiKey || notionApiKey === 'YOUR_NOTION_API_KEY') {
          throw new Error(
            'Notion API Key is missing. Please add your Internal Integration Token as `NOTION_API_KEY` to your .env file.'
          );
        }
        
        if (!notionPageId || notionPageId === 'YOUR_NOTION_PAGE_ID') {
          throw new Error(
            'Notion Page ID is missing. Please add the ID of the page you want to export to as `NOTION_PAGE_ID` in your .env file.'
          );
        }

        const notion = new Client({ auth: notionApiKey });

        try {
            const response = await notion.pages.create({
                parent: { page_id: notionPageId },
                properties: {
                    title: [
                        {
                            text: {
                                content: title,
                            },
                        },
                    ],
                },
                children: textToNotionBlocks(content) as any[],
            });

            return {
                pageId: response.id,
                url: (response as any).url,
            };
        } catch (e: any) {
            console.error("Notion API Error:", e.body || e.message);
            const errorMessage = e.body?.message || e.message;
            if (errorMessage.includes('Could not find page with ID')) {
                 throw new Error(`Failed to create Notion page: Could not find the parent page. Please ensure the 'NOTION_PAGE_ID' in your .env file is correct and that you have shared that page with your Notion integration.`);
            }
            throw new Error(`Failed to create Notion page: ${errorMessage}`);
        }
    }
);
