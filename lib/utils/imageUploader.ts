/**
 * Image upload utilities for Google Cloud Storage integration
 *
 * Handles uploading images from external sources (like Webflow CDN)
 * to Community Jameel's Google Cloud Storage bucket with organized folder structure.
 */

import { Storage } from '@google-cloud/storage';
import sharp from 'sharp';

// Image upload result interface
export interface ImageUploadResult {
  originalUrl: string;
  newUrl: string;
  success: boolean;
  error?: string;
}

// CDN upload configuration interface
export interface CDNUploadConfig {
  bucketName?: string;
  cdnBaseUrl?: string;
  compressToWebP?: boolean; // Whether to compress and convert to WebP
  quality?: number; // WebP quality (1-100)
}

// Initialize Google Cloud Storage
const theKey = process.env.PRIVATE_GCL;

const storage = new Storage({
  projectId: 'cj-tech-381914',
  credentials: {
    client_email: 'todo-test@cj-tech-381914.iam.gserviceaccount.com',
    private_key: `-----BEGIN PRIVATE KEY-----\n${theKey}=\n-----END PRIVATE KEY-----\n`
  }
});

const bucket = storage.bucket('mnemo');
const CDN_BASE_URL = 'https://cdn.communityjameel.io';

/**
 * Compress and convert an image to WebP format
 */
async function compressToWebP(
  fileBuffer: Buffer,
  quality: number = 80
): Promise<Buffer> {
  return await sharp(fileBuffer).webp({ quality }).toBuffer();
}

/**
 * Upload buffer to Google Cloud Storage
 */
async function uploadToGCS(
  buffer: Buffer,
  gcsPath: string,
  contentType: string
): Promise<string> {
  try {
    const file = bucket.file(gcsPath);

    await file.save(buffer, {
      metadata: {
        contentType: contentType,
        cacheControl: 'public, max-age=31536000' // 1 year cache
      }
    });

    return `${CDN_BASE_URL}/${gcsPath}`;
  } catch (error) {
    throw new Error(
      `GCS upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get content type from file extension
 */
function getContentType(fileName: string): string {
  const ext = getFileExtension(fileName).toLowerCase();
  const contentTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml'
  };
  return contentTypes[ext] || 'image/jpeg';
}

/**
 * Uploads images from external CDN to Community Jameel's Google Cloud Storage
 *
 * @param imageUrl - The original external CDN URL (e.g., Webflow, other sources)
 * @param collectionName - Name of the collection (e.g., 'posts', 'events')
 * @param slug - The item slug for folder organization
 * @param filename - Optional custom filename, defaults to extracted from URL
 * @param config - CDN configuration
 * @returns Promise with upload result containing new URL
 */
export async function imageUploaderToCDN(
  imageUrl: string,
  collectionName: string,
  slug: string,
  filename?: string,
  config?: CDNUploadConfig
): Promise<ImageUploadResult> {
  try {
    // Default config
    const defaultConfig: CDNUploadConfig = {
      bucketName: 'mnemo',
      cdnBaseUrl: CDN_BASE_URL,
      compressToWebP: true,
      quality: 80
    };

    const uploadConfig = { ...defaultConfig, ...config };

    // Extract filename from URL if not provided
    if (!filename) {
      const urlParts = imageUrl.split('/');
      const lastPart = urlParts[urlParts.length - 1];
      // Remove query parameters and get clean filename
      filename = lastPart.split('?')[0];

      // Ensure we have a valid filename with extension
      if (!filename || !filename.includes('.')) {
        const timestamp = Date.now();
        filename = `image-${timestamp}.jpg`; // Default fallback
      }
    }

    // Sanitize filename: remove spaces, special chars, convert to lowercase
    const sanitizedFileName = filename
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/[^a-zA-Z0-9.-]/g, '') // Remove special characters except dots and hyphens
      .toLowerCase(); // Convert to lowercase

    // Create the folder path: website/collection/[collection-name]/[slug]/
    const folderPath = `website/collection/${collectionName}/${slug}`;

    // If compressing to WebP, change extension
    let finalFileName = sanitizedFileName;
    if (uploadConfig.compressToWebP && !sanitizedFileName.endsWith('.webp')) {
      finalFileName = sanitizedFileName.replace(/\.[^/.]+$/, '') + '.webp';
    }

    const fullPath = `${folderPath}/${finalFileName}`;

    console.log(`🔄 Downloading image from: ${imageUrl}`);

    // Download image from external source
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
    }

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    // Process the image (compress to WebP if requested)
    let processedBuffer = imageBuffer;
    let contentType = getContentType(filename);

    if (uploadConfig.compressToWebP && !filename.endsWith('.webp')) {
      console.log(
        `🔄 Compressing to WebP with quality ${uploadConfig.quality}%`
      );
      processedBuffer = await compressToWebP(
        imageBuffer,
        uploadConfig.quality || 80
      );
      contentType = 'image/webp';
    }

    console.log(`🔄 Uploading to GCS: ${fullPath}`);

    // Upload to Google Cloud Storage
    const newUrl = await uploadToGCS(processedBuffer, fullPath, contentType);

    console.log(`✅ Image uploaded successfully: ${imageUrl} → ${newUrl}`);

    return {
      originalUrl: imageUrl,
      newUrl: newUrl,
      success: true
    };
  } catch (error) {
    console.error('❌ Image upload failed:', error);
    return {
      originalUrl: imageUrl,
      newUrl: imageUrl, // Fallback to original URL
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Batch upload multiple images and return URL mapping
 *
 * @param imageUrls - Array of external image URLs
 * @param collectionName - Name of the collection
 * @param slug - The item slug
 * @param config - CDN configuration
 * @param concurrent - Number of concurrent uploads (default: 3)
 * @returns Promise with array of upload results
 */
export async function batchImageUploaderToCDN(
  imageUrls: string[],
  collectionName: string,
  slug: string,
  config?: CDNUploadConfig,
  concurrent: number = 3
): Promise<ImageUploadResult[]> {
  if (imageUrls.length === 0) return [];

  console.log(
    `📦 Starting batch upload of ${imageUrls.length} images for ${collectionName}/${slug}`
  );

  // Process uploads in batches to avoid overwhelming the CDN
  const results: ImageUploadResult[] = [];

  for (let i = 0; i < imageUrls.length; i += concurrent) {
    const batch = imageUrls.slice(i, i + concurrent);

    const batchPromises = batch.map((url, index) => {
      // Generate unique filename for each image in batch
      const filename = `image-${i + index + 1}-${Date.now()}.${getFileExtension(url)}`;
      return imageUploaderToCDN(url, collectionName, slug, filename, config);
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Small delay between batches to be respectful to CDN
    if (i + concurrent < imageUrls.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  const successful = results.filter((r) => r.success).length;
  console.log(
    `✅ Batch upload completed: ${successful}/${imageUrls.length} successful`
  );

  return results;
}

/**
 * Helper function to extract file extension from URL
 *
 * @param url - Image URL
 * @returns File extension (e.g., 'jpg', 'png', 'webp')
 */
function getFileExtension(url: string): string {
  try {
    // Remove query parameters and get the path
    const pathname = new URL(url).pathname;
    const extension = pathname.split('.').pop()?.toLowerCase();

    // Common image extensions
    const validExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'];

    if (extension && validExtensions.includes(extension)) {
      return extension;
    }

    // Default fallback
    return 'jpg';
  } catch {
    return 'jpg';
  }
}

/**
 * Utility to create URL mapping for easy replacement
 *
 * @param uploadResults - Results from batch upload
 * @returns Map of original URL to new URL
 */
export function createUrlMapping(
  uploadResults: ImageUploadResult[]
): Map<string, string> {
  const urlMap = new Map<string, string>();

  uploadResults.forEach((result) => {
    if (result.success) {
      urlMap.set(result.originalUrl, result.newUrl);
    } else {
      // Keep original URL if upload failed
      urlMap.set(result.originalUrl, result.originalUrl);
    }
  });

  return urlMap;
}

/**
 * Replace image URLs in text content (useful for rich text content)
 *
 * @param content - Text content that may contain image URLs
 * @param urlMapping - Map of original URLs to new URLs
 * @returns Updated content with new URLs
 */
export function replaceImageUrlsInContent(
  content: string,
  urlMapping: Map<string, string>
): string {
  let updatedContent = content;

  urlMapping.forEach((newUrl, originalUrl) => {
    // Replace all occurrences of the original URL
    updatedContent = updatedContent.replace(
      new RegExp(escapeRegExp(originalUrl), 'g'),
      newUrl
    );
  });

  return updatedContent;
}

/**
 * Escape special regex characters in string
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
