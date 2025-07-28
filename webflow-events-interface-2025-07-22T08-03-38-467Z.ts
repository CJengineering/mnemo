// Generated Event Interface from Webflow API analysis
export interface WebflowEvent {
  id: string;
  cmsLocaleId: string | null;
  lastPublished: string;
  lastUpdated: string;
  createdOn: string;
  isArchived: boolean;
  isDraft: boolean;
  fieldData: {
    'address'?: string;
    'city'?: string;
    'end-date'?: string;
    'event-date'?: string;
    'featured'?: boolean;
    'hero-image'?: {
      fileId: string;
      url: string;
      alt: string | null;
    };
    'hero-image-caption'?: string;
    'image-gallery'?: string[];
    'in-the-media-on-off'?: boolean;
    'more-details-on-off'?: boolean;
    'name'?: string;
    'news-on-off'?: boolean;
    'open-graph-image'?: {
      fileId: string;
      url: string;
      alt: string | null;
    };
    'organisers'?: string[];
    'partners'?: string[];
    'programme-label'?: string;
    'push-to-gr'?: boolean;
    'related-people-rich-text'?: string;
    'related-programme-s'?: string[];
    'seo-meta-description'?: string;
    'seo-title'?: string;
    'short-description-2'?: string;
    'slug'?: string;
    'thumbnail'?: {
      fileId: string;
      url: string;
      alt: string | null;
    };
    'time'?: string;
    'trailer-livestream-highlights-video-link'?: any;
    'video-as-hero-on-off'?: boolean;
  };
}