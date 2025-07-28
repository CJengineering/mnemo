/**
 * Mapper function to convert Webflow post data to Mnemo collection item format
 *
 * Maps from Webflow API response structure to APICollectionItem interface
 * used in the Mnemo collections system.
 */

import { APICollectionItem } from 'app/(dashboard)/collections/page-backup';
import {
  imageUploaderToCDN,
  batchImageUploaderToCDN,
  ImageUploadResult,
  CDNUploadConfig
} from '../utils/imageUploader';

// Webflow Post Interface (based on complete collection schema)
export interface WebflowPost {
  id: string;
  cmsLocaleId: string | null;
  lastPublished: string;
  lastUpdated: string;
  createdOn: string;
  isArchived: boolean;
  isDraft: boolean;
  fieldData: {
    // Core content (required fields)
    name: string; // Title (English)
    slug: string;
    'date-published': string;
    'seo-title': string;
    'seo-meta': string;
    thumbnail: {
      fileId: string;
      url: string;
      alt: string | null;
    };
    'main-image': {
      fileId: string;
      url: string;
      alt: string | null;
    };
    'open-graph-image': {
      fileId: string;
      url: string;
      alt: string | null;
    };

    // Optional content fields
    'arabic-title'?: string;
    'arabic-complete-incomplete'?: boolean;
    body?: string; // Body (English) - RichText
    'body-arabic'?: string; // Body (Arabic) - RichText
    'bullet-points-english'?: string; // RichText
    'bullet-points-arabic'?: string; // RichText

    // SEO fields (optional)
    'seo-title-arabic'?: string;
    'seo-meta-arabic'?: string;

    // Location fields
    location?: string; // Location (English)
    'location-arabic'?: string; // Location (Arabic)

    // Video integration
    'video-as-hero-yes-no'?: boolean;
    'hero-video-youtube-embed-id'?: string;
    'hero-video-arabic-youtube-video-id'?: string;

    // Image metadata
    'alt-text-for-hero-image'?: string;
    'alt-text-hero-image-arabic'?: string;
    'photo-credit-hero-image'?: string;
    'hero-image-photo-credit-arabic'?: string;

    // Image gallery
    'image-carousel'?: Array<{
      fileId: string;
      url: string;
      alt: string | null;
    }>;
    'image-carousel-credits'?: string; // Image gallery credits (English)
    'image-gallery-credits-arabic'?: string; // Image gallery credits (Arabic)

    // Programme relationships
    'programme-2'?: string; // Single programme reference
    'programmes-multiple'?: string[]; // Multi programme reference

    // Content relationships
    'theme-3'?: string[]; // Tags (MultiReference)
    'blogs-categories-2'?: string; // Blog Categories (Reference)
    'related-event'?: string; // Related event (Reference)
    people?: string[]; // People (MultiReference)
    innovations?: string[]; // Innovations (MultiReference)

    // Marketing flags
    featured?: boolean;
    'push-to-gr'?: boolean;
  };
}

/**
 * Maps Webflow post data to Mnemo APICollectionItem format with integrated CDN upload
 *
 * @param webflowPost - Raw Webflow post data from API
 * @param uploadImages - Whether to upload images to CDN (default: false)
 * @param collectionName - Collection name for folder structure (default: 'posts')
 * @param cdnConfig - CDN configuration options
 * @returns APICollectionItem formatted for Mnemo system
 */
export async function postWebflowMapperToMnemoData(
  webflowPost: WebflowPost,
  uploadImages: boolean = false,
  collectionName: string = 'posts',
  cdnConfig?: CDNUploadConfig
): Promise<APICollectionItem> {
  const { fieldData } = webflowPost;

  // Transform status: Webflow uses isDraft, Mnemo uses status enum
  const status: 'published' | 'draft' = webflowPost.isDraft
    ? 'draft'
    : 'published';

  // Collect all image URLs that need to be uploaded
  const imageUrls: string[] = [];
  const imageCarouselUrls: string[] = [];

  if (uploadImages) {
    // Main images
    if (fieldData['main-image']?.url)
      imageUrls.push(fieldData['main-image'].url);
    if (fieldData.thumbnail?.url) imageUrls.push(fieldData.thumbnail.url);
    if (fieldData['open-graph-image']?.url)
      imageUrls.push(fieldData['open-graph-image'].url);

    // Image carousel
    if (fieldData['image-carousel']) {
      fieldData['image-carousel'].forEach((img) => {
        if (img.url) imageCarouselUrls.push(img.url);
      });
    }
  }

  // Upload images to CDN if requested
  let imageUploadResults: ImageUploadResult[] = [];
  let carouselUploadResults: ImageUploadResult[] = [];

  if (uploadImages && imageUrls.length > 0) {
    imageUploadResults = await batchImageUploaderToCDN(
      imageUrls,
      collectionName,
      fieldData.slug,
      cdnConfig
    );

    if (imageCarouselUrls.length > 0) {
      carouselUploadResults = await batchImageUploaderToCDN(
        imageCarouselUrls,
        collectionName,
        fieldData.slug,
        cdnConfig
      );
    }
  }

  // Helper function to get new URL or fallback to original
  const getUpdatedImageUrl = (originalUrl: string): string => {
    if (!uploadImages) return originalUrl;

    const result = imageUploadResults.find(
      (r) => r.originalUrl === originalUrl
    );
    return result?.success ? result.newUrl : originalUrl;
  };

  const getUpdatedCarouselImageUrl = (originalUrl: string): string => {
    if (!uploadImages) return originalUrl;

    const result = carouselUploadResults.find(
      (r) => r.originalUrl === originalUrl
    );
    return result?.success ? result.newUrl : originalUrl;
  };

  // Build the mapped collection item
  const mnemoItem: APICollectionItem = {
    // Root level fields (Mnemo system fields)
    id: webflowPost.id,
    title: fieldData.name,
    type: 'post',
    slug: fieldData.slug,
    status: status,

    // Data object (contains all Webflow-specific content)
    data: {
      // Basic post info
      title: fieldData.name,
      slug: fieldData.slug,
      status: status,
      description: fieldData.body || '', // Keep rich text as-is

      // Bilingual content
      arabicTitle: fieldData['arabic-title'],
      arabicCompleteIncomplete: fieldData['arabic-complete-incomplete'],

      // Publication details
      datePublished: fieldData['date-published'],
      location: fieldData.location,
      locationArabic: fieldData['location-arabic'],

      // SEO fields
      seoTitle: fieldData['seo-title'],
      seoTitleArabic: fieldData['seo-title-arabic'],
      seoMeta: fieldData['seo-meta'],
      seoMetaArabic: fieldData['seo-meta-arabic'],

      // Content fields
      bodyEnglish: fieldData.body,
      bodyArabic: fieldData['body-arabic'],
      bulletPointsEnglish: fieldData['bullet-points-english'],
      bulletPointsArabic: fieldData['bullet-points-arabic'],

      // Media fields (with CDN URLs if uploaded)
      mainImage: {
        url: getUpdatedImageUrl(fieldData['main-image'].url),
        alt: fieldData['main-image'].alt || ''
      },
      thumbnail: {
        url: getUpdatedImageUrl(fieldData.thumbnail.url),
        alt: fieldData.thumbnail.alt || ''
      },
      openGraphImage: {
        url: getUpdatedImageUrl(fieldData['open-graph-image'].url),
        alt: fieldData['open-graph-image'].alt || ''
      },

      // Video fields
      heroVideoYoutubeId: fieldData['hero-video-youtube-embed-id'],
      heroVideoArabicYoutubeId: fieldData['hero-video-arabic-youtube-video-id'],
      videoAsHero: fieldData['video-as-hero-yes-no'],

      // Programme relationships (convert to Mnemo format)
      programmeLabel: fieldData['programme-2']
        ? {
            id: fieldData['programme-2'],
            slug: fieldData['programme-2'] // Would need programme lookup to get actual slug
          }
        : undefined,
      relatedProgrammes:
        fieldData['programmes-multiple']?.map((progId) => ({
          id: progId,
          slug: progId // Would need programme lookup to get actual slugs
        })) || [],

      // Relations from Webflow schema
      tags:
        fieldData['theme-3']?.map((tagId) => ({
          id: tagId,
          slug: tagId // Would need tag lookup to get actual slugs
        })) || [],
      blogCategory: fieldData['blogs-categories-2']
        ? {
            id: fieldData['blogs-categories-2'],
            slug: fieldData['blogs-categories-2'] // Would need category lookup to get actual slug
          }
        : undefined,
      relatedEvent: fieldData['related-event']
        ? {
            id: fieldData['related-event'],
            slug: fieldData['related-event'] // Would need event lookup to get actual slug
          }
        : undefined,
      people:
        fieldData.people?.map((personId) => ({
          id: personId,
          slug: personId // Would need people lookup to get actual slugs
        })) || [],
      innovations:
        fieldData.innovations?.map((innovationId) => ({
          id: innovationId,
          slug: innovationId // Would need innovation lookup to get actual slugs
        })) || [],

      // Image gallery from Webflow schema (with CDN URLs if uploaded)
      imageCarousel:
        fieldData['image-carousel']?.map((img) => ({
          url: getUpdatedCarouselImageUrl(img.url),
          alt: img.alt || ''
        })) || [],
      imageGalleryCredits: fieldData['image-carousel-credits'],
      imageGalleryCreditsArabic: fieldData['image-gallery-credits-arabic'],

      // Marketing flags
      featured: fieldData.featured,
      pushToGR: fieldData['push-to-gr'],

      // CDN upload metadata (if images were uploaded)
      cdnUploadResults: uploadImages
        ? {
            mainImages: imageUploadResults,
            carouselImages: carouselUploadResults,
            uploadedAt: new Date().toISOString(),
            collectionPath: `website/collection/${collectionName}/${fieldData.slug}`
          }
        : undefined,

      // Webflow-specific metadata (for reference/debugging)
      webflowMeta: {
        webflowId: webflowPost.id,
        cmsLocaleId: webflowPost.cmsLocaleId,
        lastPublished: webflowPost.lastPublished,
        isArchived: webflowPost.isArchived,
        fileIds: {
          mainImage: fieldData['main-image'].fileId,
          thumbnail: fieldData.thumbnail.fileId,
          openGraphImage: fieldData['open-graph-image'].fileId
        }
      }
    }
  };

  return mnemoItem;
}

/**
 * Type guard to check if data is a valid Webflow post
 *
 * @param data - Data to check
 * @returns True if data matches WebflowPost structure
 */
export function isWebflowPost(data: any): data is WebflowPost {
  return (
    data &&
    typeof data.id === 'string' &&
    typeof data.fieldData === 'object' &&
    typeof data.fieldData.name === 'string' &&
    typeof data.fieldData.slug === 'string'
  );
}

/**
 * Batch mapper for multiple Webflow posts with CDN upload
 *
 * @param webflowPosts - Array of Webflow posts
 * @param uploadImages - Whether to upload images to CDN (default: false)
 * @param collectionName - Collection name for folder structure (default: 'posts')
 * @param cdnConfig - CDN configuration options
 * @returns Promise resolving to array of mapped Mnemo collection items
 */
export async function mapWebflowPostsToMnemoData(
  webflowPosts: WebflowPost[],
  uploadImages: boolean = false,
  collectionName: string = 'posts',
  cdnConfig?: CDNUploadConfig
): Promise<APICollectionItem[]> {
  const validPosts = webflowPosts.filter(isWebflowPost);

  // Process posts sequentially to avoid overwhelming the CDN with concurrent uploads
  const results: APICollectionItem[] = [];

  for (const post of validPosts) {
    try {
      const mappedItem = await postWebflowMapperToMnemoData(
        post,
        uploadImages,
        collectionName,
        cdnConfig
      );
      results.push(mappedItem);

      // Optional: Add small delay between uploads to be respectful to CDN
      if (uploadImages && validPosts.length > 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error(`Failed to process post ${post.id}:`, error);
      // Fallback to regular mapping without CDN upload
      const fallbackItem = await postWebflowMapperToMnemoData(post, false);
      results.push(fallbackItem);
    }
  }

  return results;
}

/**
 * Reverse mapper: Convert Mnemo collection item back to Webflow format
 * Useful for syncing data back to Webflow
 *
 * @param mnemoItem - Mnemo collection item
 * @returns Partial Webflow post data (for updates)
 */
export function mnemoDataToWebflowPost(
  mnemoItem: APICollectionItem
): Partial<WebflowPost['fieldData']> {
  const data = mnemoItem.data;

  return {
    name: mnemoItem.title,
    body: data.bodyEnglish || '',
    slug: mnemoItem.slug,
    'date-published': data.datePublished,
    'seo-title': data.seoTitle || '',
    'seo-meta': data.seoMeta || '',
    location: data.location || '',
    featured: data.featured || false,
    'push-to-gr': data.pushToGR || false,
    'video-as-hero-yes-no': data.videoAsHero || false,
    'arabic-complete-incomplete': data.arabicCompleteIncomplete || false,
    'hero-video-youtube-embed-id': data.heroVideoYoutubeId,
    'programme-2': data.programmeLabel?.id,
    'programmes-multiple': data.relatedProgrammes?.map((p: any) => p.id) || []
  };
}
