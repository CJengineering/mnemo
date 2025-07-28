# Posts Migration Script - Webflow API v2 Update

## Overview

The posts migration script (`migrate-posts-images.js`) has been updated to use **Webflow API v2** directly instead of the Community Jameel API endpoint. This provides better field mapping and ensures body content is included properly.

## Changes Made

### 1. API Endpoint Migration

- **Before**: Used `https://www.communityjameel.org/api/posts` (Community Jameel API)
- **After**: Uses `https://api.webflow.com/v2/collections/{collection}/items` (Webflow API v2)

### 2. Authentication

- Added proper Webflow API Bearer token authentication
- Includes required headers: `Authorization`, `Accept`, `Accept-Version`

### 3. Pagination Support

- Implements proper pagination with `limit` and `offset` parameters
- Fetches all posts automatically across multiple requests
- Respects rate limits with delays between requests

### 4. Field Mapping Updates

The script now correctly maps Webflow API v2 field names:

**Image Fields:**

- `thumbnail-image` → `thumbnail`
- `main-image` → `mainImage`
- `open-graph-image` → `openGraphImage`
- `image-carousel` → `imageCarousel`

**Content Fields:**

- `body` → `bodyEnglish`
- `body-arabic` → `bodyArabic`
- `arabic-title` → `arabicTitle`
- `summary-arabic` → `summaryArabic`

**SEO Fields:**

- `seo-title` → `seoTitle`
- `seo-title-arabic` → `seoTitleArabic`
- `seo-meta-description` → `seoMeta`
- `seo-meta-description-arabic` → `seoMetaArabic`

**Media Fields:**

- `hero-video-youtube-id` → `heroVideoYoutubeId`
- `hero-video-arabic-youtube-id` → `heroVideoArabicYoutubeId`
- `image-gallery-credits` → `imageGalleryCredits`
- `image-gallery-credits-arabic` → `imageGalleryCreditsArabic`

**Flag Fields:**

- `push-to-gr` → `pushToGR`

## Required Environment Variables

Add these to your `.env.local` file:

```bash
# Webflow API Configuration for posts migration
WEBFLOW_API_TOKEN=your_webflow_api_token_here
WEBFLOW_SITE_ID=your_webflow_site_id_here
WEBFLOW_POSTS_COLLECTION_ID=your_posts_collection_id_here
```

### How to Get These Values:

#### 1. WEBFLOW_API_TOKEN

1. Go to your Webflow account settings
2. Navigate to "Integrations" > "API Access"
3. Generate a new API token with the following scopes:
   - `cms:read` - Read CMS items
   - `cms:write` - Write CMS items (if needed)
4. Copy the token and add to `.env.local`

#### 2. WEBFLOW_SITE_ID

1. In your Webflow dashboard, open your site
2. Go to Site Settings > General
3. Copy the Site ID from the URL or settings page
4. Add to `.env.local`

#### 3. WEBFLOW_POSTS_COLLECTION_ID

1. In Webflow CMS, go to your Posts collection
2. Copy the Collection ID from the URL or collection settings
3. Add to `.env.local`

## Usage

The usage remains the same, but now fetches from Webflow API v2:

```bash
# Test with 5 posts
node migrate-posts-images.js --test-limit=5

# Dry run (preview without uploading)
node migrate-posts-images.js --dry-run

# Full migration
node migrate-posts-images.js
```

## Benefits of Using Webflow API v2

1. **Better Data Structure**: Direct access to Webflow field structure
2. **More Reliable**: No intermediate API layer
3. **Better Field Mapping**: Proper mapping of all post fields
4. **Body Content**: Ensures body content is properly retrieved and migrated
5. **Metadata**: Access to creation dates, update dates, and other metadata
6. **Pagination**: Handles large collections automatically
7. **Rate Limiting**: Respects Webflow API limits

## Debugging

The script includes comprehensive debug logging:

- Field availability and content length
- Body content previews
- Image processing results
- API response structure

Enable debug mode by checking the console output during migration.

## Error Handling

The script will now:

- Validate all required environment variables before starting
- Provide clear error messages for missing Webflow credentials
- Handle pagination errors gracefully
- Retry failed requests with proper delays

## Backward Compatibility

The script maintains backward compatibility with:

- Existing image processing logic
- GCS upload functionality
- Mnemo database creation
- Report generation
- Command line arguments

## Next Steps

1. Set up the required Webflow API credentials
2. Test with a small batch using `--test-limit=5`
3. Run a dry run to verify field mappings
4. Execute full migration once confirmed working

This update ensures better data integrity and more reliable post migration from Webflow to the Mnemo database.
