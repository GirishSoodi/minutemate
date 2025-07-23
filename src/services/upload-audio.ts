'use server';

/**
 * @fileOverview Uploads an audio file to Cloudinary.
 *
 * - uploadAudio - A function that handles the audio upload process.
 * - UploadAudioInput - The input type for the uploadAudio function.
 */

import { v2 as cloudinary } from 'cloudinary';
import { z } from 'zod';
import { config } from 'dotenv';

config();

const UploadAudioInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "An audio file, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type UploadAudioInput = z.infer<typeof UploadAudioInputSchema>;

export async function uploadAudio(input: UploadAudioInput): Promise<void> {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  if (!process.env.CLOUDINARY_API_KEY) {
      throw new Error('Cloudinary API Key not configured. Please check your .env file.');
  }

  const validatedInput = UploadAudioInputSchema.parse(input);

  try {
    await cloudinary.uploader.upload(validatedInput.audioDataUri, {
      resource_type: 'video', // Cloudinary treats audio as video
      folder: 'meeting-maestro-audio',
      use_filename: true,
      unique_filename: true,
    });
  } catch (error: any) {
    const errorMessage = error.message || 'An unknown error occurred while uploading to Cloudinary.';
    console.error('Error uploading to Cloudinary:', error);
    throw new Error(`Failed to upload audio file: ${errorMessage}`);
  }
}
