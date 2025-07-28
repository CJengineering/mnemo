// Generated news Interface from Webflow API analysis
export interface WebflowNews {
  id: string;
  cmsLocaleId: string | null;
  lastPublished: string;
  lastUpdated: string;
  createdOn: string;
  isArchived: boolean;
  isDraft: boolean;
  fieldData: {
    'arabic-title'?: string;
    'date-published'?: string;
    'external-link'?: string;
    'featured'?: boolean;
    'hero-image'?: {
      fileId: string;
      url: string;
      alt: string | null;
    };
    'name'?: string;
    'people'?: string[];
    'programme'?: string;
    'programme-s'?: string[];
    'push-to-gr'?: boolean;
    'remove-from-news-grid'?: boolean;
    'slug'?: string;
    'sources'?: string;
    'summary'?: string;
    'thumbnail'?: {
      fileId: string;
      url: string;
      alt: string | null;
    };
  };
}
