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

  // Event details
  eventDate?: string;
  endDate?: string;
  time?: string;
  city?: string;
  address?: string;
  locationLink?: string;

  // Media
  thumbnail?: IncomingImageField;
  heroImage?: IncomingImageField;
  mainVideo?: string;

  // Relations
  programmeLabel?: IncomingReferenceItem;
  relatedProgrammes?: IncomingReferenceItem[];
  tags?: IncomingReferenceItem[];
  relatedPeople?: IncomingReferenceItem[];

  // Flags
  featured?: boolean;
  pushToGR?: boolean;
  videoAsHero?: boolean;

  // RSVP/Contact
  rsvpLink?: string;
  contactDetails?: string;
  livestreamLink?: string;
  attendanceType?: string;
}

// Incoming Programme Data from Frontend Form
export interface IncomingProgrammeData {
  title: string;
  description?: string;
  slug: string;
  status?: 'published' | 'draft';

  // Programme specific fields
  nameArabic?: string;
  shortNameEnglish?: string;
  shortNameArabic?: string;

  // Content
  missionEnglish?: string;
  missionArabic?: string;
  summaryEnglish?: string;
  summaryArabic?: string;
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
  heroSquare?: IncomingImageField;
  heroWide?: IncomingImageField;

  // Location
  longitude?: string;
  latitude?: string;

  // External links
  website?: string;
  linkedin?: string;
  instagram?: string;
  twitter?: string;

  // Relations
  partners?: IncomingReferenceItem[];
  leadership?: IncomingReferenceItem[];
  relatedProgrammes?: IncomingReferenceItem[];

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

  // Relations (required for news)
  sources: IncomingReferenceItem;
  programmeLabel: IncomingReferenceItem;
  relatedProgrammes: IncomingReferenceItem[];

  // Optional relations
  people?: IncomingReferenceItem[];
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
  mainImage: IncomingImageField;
  openGraphImage: IncomingImageField;

  // Video
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
  videoAsHero?: boolean;
  arabicCompleteIncomplete?: boolean;
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
