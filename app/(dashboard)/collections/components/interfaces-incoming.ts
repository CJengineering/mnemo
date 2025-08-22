// Incoming interfaces for frontend form data
// These represent the simplified data structure that the frontend will send

interface IncomingImageField {
  url: string;
  alt: string;
}

interface IncomingReferenceItem {
  id: string;
  slug: string;
}

// Incoming Event Data from Frontend Form
export interface IncomingEventData {
  title: string;
  description?: string;
  slug: string;
  status?: 'published' | 'draft';

  // Event specific fields
  arabicTitle?: string;
  seoTitle?: string;
  seoMetaDescription?: string;
  teaserText?: string;
  shortDescription?: string;
  richText?: string;

  // Event details
  eventDate?: string;
  endDate?: string;
  time?: string;
  city?: string;
  address?: string;
  locationLink?: string;
  extraLocationInformation?: string;

  // Links and CTAs
  rsvpLink?: string;
  contactDetails?: string;
  livestreamLink?: string;
  ctaLink?: string;
  buttonCtaText?: string;
  attendanceType?: string;

  // Media
  thumbnail?: IncomingImageField;
  heroImage?: IncomingImageField;
  imageGallery?: IncomingImageField[];
  galleryPhotoCredits?: string;

  // Video fields
  videoAsHero?: boolean;
  mainVideo?: string;
  mainVideoEmbedCode?: string;
  video2?: string;
  video2EmbedCode?: string;
  video3?: string;
  video3EmbedCode?: string;

  // Rich text content fields
  signupEmbed?: string;
  moreInformation?: string;
  moreDetails?: string;
  relatedPeopleRichText?: string;
  inTheMedia?: string;
  customCodeForHidingWeglot?: string;

  // Boolean toggles
  pushToGr?: boolean;
  pushToGR?: boolean; // Keep both for compatibility
  newsOnOff?: boolean;
  moreDetailsOnOff?: boolean;
  inTheMediaOnOff?: boolean;
  featured?: boolean;

  // References
  group?: IncomingReferenceItem;
  programmeLabel?: IncomingReferenceItem;
  relatedProgrammes?: IncomingReferenceItem[];
  tags?: IncomingReferenceItem[];
  relatedPeople?: IncomingReferenceItem[];
  organisers?: IncomingReferenceItem[];
  partners?: IncomingReferenceItem[];
  withRepresentativesFrom?: IncomingReferenceItem[];
}

// Incoming Programme Data from Frontend Form
export interface IncomingProgrammeData {
  title: string;
  description?: string;
  slug: string;
  status?: 'published' | 'draft';

  // Programme specific fields
  type?:
    | 'Centre'
    | 'Fund'
    | 'Scholarship'
    | 'Project'
    | 'Programme'
    | 'Lab'
    | 'Community Jameel';
  nameArabic?: string;
  shortNameEnglish?: string;
  shortNameArabic?: string;

  // Content
  missionEnglish?: string;
  missionArabic?: string;
  summaryEnglish?: string;
  summaryArabic?: string;
  summaryLongEnglish?: string;
  summaryLongArabic?: string;
  oldMissionEnglish?: string;
  researchEnglish?: string;
  researchArabic?: string;

  // Details
  yearEstablished?: number;
  yearClosed?: number;
  headquartersEnglish?: string;
  headquartersArabic?: string;

  // Media
  logoSvgDark?: IncomingImageField;
  logoSvgLight?: IncomingImageField;
  logoSvgDarkOriginal?: IncomingImageField;
  logoSvgLightOriginal?: IncomingImageField;
  heroSquare?: IncomingImageField;
  heroWide?: IncomingImageField;
  hero1x1?: IncomingImageField;
  hero16x9?: IncomingImageField;
  heroImage?: IncomingImageField;
  thumbnail?: IncomingImageField;
  openGraph?: IncomingImageField;

  // Video & Links
  mainVideo?: string;
  customLink?: string;
  buttonText?: string;

  // Location
  longitude?: string;
  latitude?: string;

  // External links
  website?: string;
  linkedin?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;
  facebook?: string;

  // Relations
  partners?: IncomingReferenceItem[];
  leadership?: IncomingReferenceItem[];
  relatedProgrammes?: IncomingReferenceItem[];
  features?: IncomingReferenceItem[];

  // Impact metrics
  impact01?: string;
  impact01TitleArabic?: string;
  impact02?: string;
  impact02TitleArabic?: string;
  impact03?: string;
  impact03TitleArabic?: string;
  impact04?: string;
  impact04TitleArabic?: string;
  impact05?: string;
  impact05TitleArabic?: string;
  impact06?: string;
  impact06TitleArabic?: string;

  // Flags
  lab?: boolean;
  pushToGR?: boolean;
  order?: number;
}

// Incoming News Data from Frontend Form
export interface IncomingNewsData {
  title: string;
  description?: string;
  slug: string;
  status?: 'published' | 'draft';

  // News specific fields
  arabicTitle?: string;
  summary?: string;
  summaryArabic?: string;
  excerpt?: string;

  // External data
  externalLink: string;
  datePublished: string;

  // Media
  thumbnail?: IncomingImageField;
  heroImage?: IncomingImageField;
  imageAltTextEnglish?: string;
  imageAltTextArabic?: string;

  // Relations (optional for news)
  sources?: IncomingReferenceItem;
  programmeLabel?: IncomingReferenceItem;
  relatedProgrammes?: IncomingReferenceItem[];

  // People relations
  people?: IncomingReferenceItem[];
  relatedCjTeamMembers?: IncomingReferenceItem[];

  // Optional relations
  innovations?: IncomingReferenceItem[];
  relatedEvent?: IncomingReferenceItem;
  relatedEvents?: IncomingReferenceItem[];
  tags?: IncomingReferenceItem[];

  // Flags
  featured?: boolean;
  pushToGR?: boolean;
  removeFromNewsGrid?: boolean;
}

// Incoming Post Data from Frontend Form
export interface IncomingPostData {
  title: string;
  description?: string;
  slug: string;
  status?: 'published' | 'draft';

  // Post specific fields
  arabicTitle?: string;
  arabicCompleteIncomplete?: boolean;
  datePublished: string;
  location?: string;
  locationArabic?: string;

  // SEO
  seoTitle: string;
  seoTitleArabic?: string;
  seoMeta: string;
  seoMetaArabic?: string;

  // Content
  bodyEnglish?: string;
  bodyArabic?: string;
  bulletPointsEnglish?: string;
  bulletPointsArabic?: string;

  // Media (required for posts)
  thumbnail: IncomingImageField;
  heroImage: IncomingImageField;
  mainImage: IncomingImageField;
  openGraphImage: IncomingImageField;

  // Image metadata
  altTextHeroImageEnglish?: string;
  altTextHeroImageArabic?: string;
  photoCreditHeroImageEnglish?: string;
  photoCreditHeroImageArabic?: string;

  // Video
  videoAsHero?: boolean;
  heroVideoYoutubeId?: string;
  heroVideoArabicYoutubeId?: string;

  // Relations
  programmeLabel?: IncomingReferenceItem;
  relatedProgrammes?: IncomingReferenceItem[];
  tags?: IncomingReferenceItem[];
  blogCategory?: IncomingReferenceItem;
  relatedEvent?: IncomingReferenceItem;
  people?: IncomingReferenceItem[];
  innovations?: IncomingReferenceItem[];

  // Image gallery
  imageCarousel?: IncomingImageField[];
  imageGalleryCredits?: string;
  imageGalleryCreditsArabic?: string;

  // Flags
  featured?: boolean;
  pushToGR?: boolean;
  sitemapIndexing?: boolean;
}

// Incoming Source Data from Frontend Form
export interface IncomingSourceData {
  title: string;
  description?: string;
  slug: string;
  status?: 'published' | 'draft';

  // Source specific fields
  nameArabic?: string;
  shortNameEnglish?: string;
  shortNameArabic?: string;

  // Media
  logo?: IncomingImageField;
  logoNative?: IncomingImageField;
}

// Minimal Incoming Innovation Data
export interface IncomingInnovationData {
  title: string;
  description?: string;
  slug: string;
  status?: 'published' | 'draft';
}

// Minimal Incoming Award Data
export interface IncomingAwardData {
  title: string;
  description?: string;
  slug: string;
  status?: 'published' | 'draft';
}

// Minimal Incoming Publication Data
export interface IncomingPublicationData {
  title: string;
  description?: string;
  slug: string;
  status?: 'published' | 'draft';
}

// Minimal Incoming Prize Data
export interface IncomingPrizeData {
  title: string;
  description?: string;
  slug: string;
  status?: 'published' | 'draft';
}

// Incoming Team Data from Frontend Form
export interface IncomingTeamData {
  title: string; // maps to name
  slug: string;
  status?: 'published' | 'draft';

  // Personal information
  name: string;
  nameArabic?: string;
  position?: string;
  positionArabic?: string;

  // Images
  photo: IncomingImageField; // required
  photoHires?: string; // URL
  altTextImage?: string;
  altTextImageArabic?: string;

  // Biography
  paragraphDescription: string; // required
  biographyArabic?: string;

  // Meta information
  metaDescription?: string;
  metaDescriptionArabic?: string;

  // Categorization
  filter?:
    | 'Leadership'
    | 'Team'
    | 'Advisory Committee'
    | 'Alumnus'
    | 'COP27 Youth Delegate';
  order: number; // required

  // Settings
  newsOnOff?: boolean;
  tags?: IncomingReferenceItem[];
}

// Incoming Partner Data from Frontend Form
export interface IncomingPartnerData {
  title: string; // maps to partner name
  slug: string;
  status?: 'published' | 'draft';

  // Partner fields
  nameArabic?: string;
  shortDescription?: string;
  shortDescriptionArabic?: string;
  website?: string;

  // Media
  logo?: IncomingImageField;

  // Relations
  group?: IncomingReferenceItem;
  tags?: IncomingReferenceItem[];
}

// New: Incoming People Data from Frontend Form
export interface IncomingPersonData {
  title: string;
  slug: string;
  status?: 'published' | 'draft';

  // Core information (matching JSON field names)
  name: string; // Required - from "name" field
  'name-arabic'?: string; // Optional - from "name-arabic" field
  'arabic-on-off'?: boolean; // Optional - from "arabic-on-off" field
  'push-to-gr'?: boolean; // Optional - from "push-to-gr" field
  hero?: boolean; // Optional - from "hero" field

  // Programme relations
  'related-programme'?: IncomingReferenceItem; // Optional - from "related-programme" field
  'related-programmes'?: IncomingReferenceItem[]; // Optional - from "related-programmes" field

  // Appearance
  color?: string; // Optional - from "color" field

  // Role information
  role?: string; // Optional - from "role" field (English)
  'role-arabic'?: string; // Optional - from "role-arabic" field

  // Descriptions
  'short-description'?: string; // Optional - from "short-description" field (English)
  'short-description-arabic'?: string; // Optional - from "short-description-arabic" field

  // Biographies (RichText)
  biography?: string; // Optional - from "biography" field (English)
  'biography-arabic'?: string; // Optional - from "biography-arabic" field

  // Events (RichText)
  events?: string; // Optional - from "events" field (English)
  'events-arabic'?: string; // Optional - from "events-arabic" field

  // Research areas (RichText)
  'research-area-english'?: string; // Optional - from "research-area-english" field
  'research-areas-arabic'?: string; // Optional - from "research-areas-arabic" field

  // Type classification
  type?: string; // Optional - from "type" field (Professor, Doctor, etc.)

  // Images
  'hero-image'?: IncomingImageField; // Optional - from "hero-image" field
  'profile-picture'?: IncomingImageField; // Optional - from "profile-picture" field

  // Video
  'feature-video'?: string; // Optional - from "feature-video" field (YouTube ID)

  // Relations
  'related-people-s'?: IncomingReferenceItem[]; // Optional - from "related-people-s" field
  'partner-organisation'?: IncomingReferenceItem[]; // Optional - from "partner-organisation" field

  // Social links
  'instagram-link'?: string; // Optional - from "instagram-link" field
  'linkedin-link'?: string; // Optional - from "linkedin-link" field
  'twitter-link'?: string; // Optional - from "twitter-link" field
  facebook?: string; // Optional - from "facebook" field
  'youtube-link'?: string; // Optional - from "youtube-link" field
  github?: string; // Optional - from "github" field
  'website-link'?: string; // Optional - from "website-link" field
  shop?: string; // Optional - from "shop" field

  // Gallery
  photos?: IncomingImageField[]; // Optional - from "photos" field (MultiImage)

  // Visibility toggles
  'hide-news'?: boolean; // Optional - from "hide-news" field
  'hide-multimedia'?: boolean; // Optional - from "hide-multimedia" field
  'hide-events'?: boolean; // Optional - from "hide-events" field
  'hide-publications'?: boolean; // Optional - from "hide-publications" field
  'hide-photos'?: boolean; // Optional - from "hide-photos" field
  'hide-events-rich-text'?: boolean; // Optional - from "hide-events-rich-text" field

  // Additional relations
  multimedia?: IncomingReferenceItem[]; // Optional - from "multimedia" field
  tag?: IncomingReferenceItem[]; // Optional - from "tag" field (Tags)

  // Ordering and location
  order?: number; // Optional - from "order" field
  country?: string; // Optional - from "country" field
}

// New: Incoming Tag Data from Frontend Form
export interface IncomingTagData {
  title: string;
  slug: string;
  status?: 'published' | 'draft';
  name: string;
  'name-arabic'?: string;
}

// Union type for all incoming data types
export type IncomingCollectionItemData =
  | IncomingEventData
  | IncomingProgrammeData
  | IncomingNewsData
  | IncomingPostData
  | IncomingSourceData
  | IncomingInnovationData
  | IncomingAwardData
  | IncomingPublicationData
  | IncomingPrizeData
  | IncomingTeamData
  | IncomingPartnerData
  | IncomingPersonData
  | IncomingTagData;

// Type discriminator for the frontend to specify which type they're sending
export interface IncomingCollectionItem {
  type:
    | 'event'
    | 'programme'
    | 'news'
    | 'post'
    | 'source'
    | 'team'
    | 'innovation'
    | 'award'
    | 'publication'
    | 'prize'
    | 'partner'
    | 'people'
    | 'tag';
  data: IncomingCollectionItemData;
}
