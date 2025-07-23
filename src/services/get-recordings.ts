'use server';

/**
 * @fileOverview Fetches audio recordings from Cloudinary.
 *
 * - getRecordings - A function that fetches all audio recordings from a specific folder.
 * - Recording - The type definition for a recording object.
 */
import { v2 as cloudinary } from 'cloudinary';
import { config } from 'dotenv';

config(); // Load environment variables from .env file

// Ensure Cloudinary is configured
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export interface Recording {
  public_id: string;
  filename: string;
  secure_url: string;
  created_at: string;
  duration: number;
}

export async function getRecordings(): Promise<Recording[]> {
  if (!cloudinary.config().api_key) {
    console.warn(
      'Cloudinary environment variables are not properly configured. Returning empty array for recordings.'
    );
    return [];
  }

  try {
    const { resources } = await cloudinary.search
      .expression('resource_type:video AND folder=meeting-maestro-audio')
      .sort_by('created_at', 'desc')
      .max_results(50)
      .execute();

    return resources.map((resource: any) => ({
      public_id: resource.public_id,
      filename: resource.filename,
      secure_url: resource.secure_url,
      created_at: resource.created_at,
      duration: resource.duration || 0,
    }));
  } catch (error: any) {
    // Log the actual error message from Cloudinary if it exists
    const errorMessage = error.error?.message || error.message || 'An unknown error occurred';
    console.error('Error fetching recordings from Cloudinary:', errorMessage);
    // For more detailed debugging, you might want to log the full error object
    // console.error(JSON.stringify(error, null, 2));
    throw new Error(`Failed to fetch recordings: ${errorMessage}`);
  }
}
