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
  features?: IncomingReferenceItem[];
  partners?: IncomingReferenceItem[];
  leadership?: IncomingReferenceItem[];
  relatedProgrammes?: IncomingReferenceItem[];

  // Impact metrics (6 sets)
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

// Union type for all incoming data types
export type IncomingCollectionItemData =
  | IncomingEventData
  | IncomingProgrammeData
  | IncomingNewsData
  | IncomingPostData
  | IncomingSourceData
  | IncomingTeamData;

// Type discriminator for the frontend to specify which type they're sending
export interface IncomingCollectionItem {
  type: 'event' | 'programme' | 'news' | 'post' | 'source' | 'team';
  data: IncomingCollectionItemData;
}
