import type { ColumnConfig } from '../components/column-visibility-selector';

// Utility functions for rendering different data types
const formatDate = (dateString: string | undefined) => {
  if (!dateString) return '—';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return '—';
  }
};

const getStatusBadge = (status: string | undefined) => {
  const baseClasses =
    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
  const statusValue = status || 'draft';
  switch (statusValue) {
    case 'published':
      return `${baseClasses} bg-green-900/60 text-green-300 border border-green-500/30`;
    case 'draft':
      return `${baseClasses} bg-yellow-900/60 text-yellow-300 border border-yellow-500/30`;
    default:
      return `${baseClasses} bg-gray-700 text-gray-300 border border-gray-600`;
  }
};

const truncateText = (text: string | undefined, maxLength: number = 100) => {
  if (!text) return '—';
  // Strip HTML tags if present
  const stripped = text.replace(/<[^>]*>/g, '');
  if (stripped.length <= maxLength) return stripped;
  return stripped.substring(0, maxLength) + '...';
};

const formatBoolean = (value: boolean | undefined) => {
  if (value === true) return <span className="text-green-400 text-sm">✓</span>;
  if (value === false) return <span className="text-red-400 text-sm">✗</span>;
  return <span className="text-gray-400 text-sm">—</span>;
};

const formatUrl = (url: string | undefined) => {
  if (!url) return <span className="text-gray-400 text-sm">—</span>;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-400 hover:text-blue-300 underline text-sm"
      onClick={(e) => e.stopPropagation()}
    >
      Link
    </a>
  );
};

const formatImage = (image: any) => {
  if (!image || !image.url)
    return <span className="text-gray-400 text-sm">—</span>;
  return (
    <div className="flex items-center space-x-2">
      <div className="w-8 h-8 bg-gray-700 rounded border overflow-hidden flex-shrink-0">
        <img
          src={image.url}
          alt={image.alt || ''}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>
      <span className="text-xs text-gray-400">Image</span>
    </div>
  );
};

const formatArray = (array: any[] | undefined, fieldName: string) => {
  if (!array || array.length === 0)
    return <span className="text-gray-400 text-sm">—</span>;

  // Handle image arrays
  if (
    fieldName.toLowerCase().includes('image') ||
    fieldName === 'imageGallery'
  ) {
    return (
      <span className="text-sm text-gray-400">
        {array.length} image{array.length !== 1 ? 's' : ''}
      </span>
    );
  }

  // Handle reference arrays (tags, people, etc.)
  return (
    <span className="text-sm text-gray-400">
      {array.length} item{array.length !== 1 ? 's' : ''}
    </span>
  );
};

const formatEnum = (value: string | undefined, fieldName: string) => {
  if (!value) return <span className="text-gray-400 text-sm">—</span>;

  // Choose color based on field type
  let colorClass = 'bg-blue-900/60 text-blue-300 border-blue-500/30';

  if (fieldName === 'filter') {
    colorClass = 'bg-purple-900/60 text-purple-300 border-purple-500/30';
  } else if (fieldName === 'attendanceType') {
    colorClass = 'bg-indigo-900/60 text-indigo-300 border-indigo-500/30';
  } else if (fieldName === 'type') {
    colorClass = 'bg-teal-900/60 text-teal-300 border-teal-500/30';
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass} capitalize`}
    >
      {value}
    </span>
  );
};

// Main function to detect field type and render appropriately
const renderFieldValue = (value: any, fieldName: string): React.ReactNode => {
  // Handle null/undefined
  if (value === null || value === undefined || value === '') {
    return <span className="text-gray-400 text-sm">—</span>;
  }

  // Handle booleans
  if (typeof value === 'boolean') {
    return formatBoolean(value);
  }

  // Handle numbers
  if (typeof value === 'number') {
    return <span className="text-sm text-gray-400">{value}</span>;
  }

  // Handle arrays
  if (Array.isArray(value)) {
    return formatArray(value, fieldName);
  }

  // Handle objects
  if (typeof value === 'object') {
    // Handle image objects
    if (
      value.url &&
      (fieldName.toLowerCase().includes('image') ||
        fieldName === 'photo' ||
        fieldName === 'thumbnail' ||
        fieldName === 'logo')
    ) {
      return formatImage(value);
    }

    // Handle reference objects
    if (value.slug || value.id) {
      return (
        <span className="text-sm text-gray-400">{value.slug || value.id}</span>
      );
    }

    // Handle other objects
    return <span className="text-xs text-gray-500">Object</span>;
  }

  // Handle strings
  if (typeof value === 'string') {
    // Handle status specially
    if (fieldName === 'status') {
      return <span className={getStatusBadge(value)}>{value}</span>;
    }

    // Handle dates
    if (
      fieldName.toLowerCase().includes('date') ||
      fieldName === 'datePublished'
    ) {
      return (
        <span className="text-sm text-gray-400 whitespace-nowrap">
          {formatDate(value)}
        </span>
      );
    }

    // Handle URLs
    if (
      fieldName.toLowerCase().includes('link') ||
      fieldName.toLowerCase().includes('url') ||
      fieldName === 'website' ||
      fieldName === 'externalLink' ||
      value.startsWith('http')
    ) {
      return formatUrl(value);
    }

    // Handle title/name fields - these should be prominent
    if (
      fieldName === 'title' ||
      fieldName === 'name' ||
      fieldName.toLowerCase().includes('title')
    ) {
      return (
        <div className="text-sm font-medium text-white line-clamp-2 max-w-xs">
          {value}
        </div>
      );
    }

    // Handle slug fields
    if (fieldName === 'slug') {
      return <span className="text-xs text-gray-500 font-mono">{value}</span>;
    }

    // Handle enum-like fields with badges
    if (['type', 'filter', 'attendanceType', 'role'].includes(fieldName)) {
      return formatEnum(value, fieldName);
    }

    // Handle long content fields
    if (
      fieldName.toLowerCase().includes('description') ||
      fieldName.toLowerCase().includes('summary') ||
      fieldName.toLowerCase().includes('mission') ||
      fieldName.toLowerCase().includes('biography') ||
      fieldName.toLowerCase().includes('body') ||
      fieldName.toLowerCase().includes('content') ||
      fieldName.toLowerCase().includes('meta')
    ) {
      return (
        <div className="text-sm text-gray-400 line-clamp-2 max-w-md">
          {truncateText(value)}
        </div>
      );
    }

    // Default string handling
    return (
      <span className="text-sm text-gray-400">{truncateText(value, 50)}</span>
    );
  }

  return <span className="text-gray-400 text-sm">—</span>;
};

// Create human-readable labels from field names
const createFieldLabel = (fieldName: string): string => {
  // Handle special cases
  const specialLabels: Record<string, string> = {
    eventDate: 'Event Date',
    endDate: 'End Date',
    datePublished: 'Published',
    attendanceType: 'Attendance',
    shortDescription: 'Description',
    missionEnglish: 'Mission',
    nameArabic: 'Name (Arabic)',
    positionArabic: 'Position (Arabic)',
    yearEstablished: 'Year Est.',
    yearClosed: 'Year Closed',
    pushToGr: 'Push to GR',
    pushToGR: 'Push to GR',
    newsOnOff: 'News',
    moreDetailsOnOff: 'More Details',
    inTheMediaOnOff: 'In Media',
    videoAsHero: 'Video Hero',
    altTextImage: 'Alt Text',
    paragraphDescription: 'Biography',
    metaDescription: 'Meta Desc',
    seoTitle: 'SEO Title',
    seoMeta: 'SEO Meta',
    seoMetaDescription: 'SEO Meta',
    externalLink: 'External Link',
    rsvpLink: 'RSVP Link',
    livestreamLink: 'Livestream',
    ctaLink: 'CTA Link',
    customLink: 'Custom Link',
    buttonText: 'Button Text',
    buttonCtaText: 'CTA Text',
    mainVideo: 'Main Video',
    photoHires: 'Hi-Res Photo',
    'name-arabic': 'Name (Arabic)',
    'role-arabic': 'Role (Arabic)',
    'short-description': 'Description',
    'short-description-arabic': 'Desc (Arabic)',
    'research-area-english': 'Research Area',
    'biography-arabic': 'Bio (Arabic)',
    'hero-image': 'Hero Image',
    'profile-picture': 'Profile Pic',
    'feature-video': 'Feature Video',
    'instagram-link': 'Instagram',
    'linkedin-link': 'LinkedIn',
    'twitter-link': 'Twitter',
    'youtube-link': 'YouTube',
    'website-link': 'Website'
  };

  if (specialLabels[fieldName]) {
    return specialLabels[fieldName];
  }

  // Convert camelCase, snake_case, and kebab-case to Title Case
  return fieldName
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .replace(/[-_]/g, ' ') // Replace hyphens and underscores with spaces
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .trim();
};

// Define which fields should be visible by default for different collection types
const getDefaultVisibleFields = (collectionId: string): string[] => {
  const id = collectionId.toLowerCase();
  const defaults: Record<string, string[]> = {
    event: ['title', 'eventDate', 'status', 'city'],
    team: ['name', 'position', 'filter', 'status'],
    programme: ['title', 'type', 'status', 'yearEstablished'],
    partner: ['title', 'shortDescription', 'status'],
    news: ['title', 'datePublished', 'status', 'featured'],
    post: ['title', 'datePublished', 'status', 'location'],
    people: ['name', 'role', 'type', 'status'],
    tag: ['name', 'slug', 'status'],
    source: ['title', 'shortNameEnglish', 'status'],
    innovation: ['title', 'type', 'status'],
    award: ['title', 'type', 'status'],
    publication: ['title', 'datePublished', 'status'],
    prize: ['title', 'type', 'status'],
    default: ['title', 'status']
  };

  return defaults[id] || defaults.default;
};

// Safely get a nested value by path like "data.eventDate" or fallback between top-level and data.*
const getValueForField = (item: any, fieldName: string) => {
  if (!item) return undefined;

  // Direct top-level field first
  if (Object.prototype.hasOwnProperty.call(item, fieldName)) {
    const v = item[fieldName];
    if (v !== undefined) return v;
  }

  // Try first-level under data
  if (item.data && typeof item.data === 'object') {
    if (Object.prototype.hasOwnProperty.call(item.data, fieldName)) {
      const v = item.data[fieldName];
      if (v !== undefined) return v;
    }
  }

  // Support explicit dot-paths
  if (fieldName.includes('.')) {
    try {
      return fieldName.split('.').reduce((acc: any, key: string) => {
        if (acc && typeof acc === 'object' && key in acc) return acc[key];
        return undefined;
      }, item);
    } catch {
      return undefined;
    }
  }

  return undefined;
};

// Generate columns dynamically from actual item data
export function generateColumnsFromData(
  items: any[],
  collectionId: string
): ColumnConfig[] {
  if (!items || items.length === 0) {
    return []; // Return empty array if no data
  }

  // Collect all unique field names from top-level and first-level of data.*
  const allFields = new Set<string>();
  const fieldExamples: Record<string, any> = {};

  items.forEach((item) => {
    if (item && typeof item === 'object') {
      // Top-level keys (except the raw 'data' bucket)
      Object.keys(item).forEach((key) => {
        if (key === 'data') return; // don't show the whole data object as a column
        allFields.add(key);
        if (
          fieldExamples[key] === undefined &&
          item[key] !== null &&
          item[key] !== undefined &&
          item[key] !== ''
        ) {
          fieldExamples[key] = item[key];
        }
      });

      // First-level fields inside data
      if (
        item.data &&
        typeof item.data === 'object' &&
        !Array.isArray(item.data)
      ) {
        Object.keys(item.data).forEach((key) => {
          // Avoid duplicating if a top-level field with same name already exists
          if (!allFields.has(key)) {
            allFields.add(key);
          }
          if (
            fieldExamples[key] === undefined &&
            item.data[key] !== null &&
            item.data[key] !== undefined &&
            item.data[key] !== ''
          ) {
            fieldExamples[key] = item.data[key];
          }
        });
      }
    }
  });

  const defaultVisible = getDefaultVisibleFields(collectionId);

  // Define field priority for sorting
  const fieldPriority: Record<string, number> = {
    // Core identity fields
    title: 1,
    name: 1,

    // Status and dates
    status: 2,
    eventDate: 3,
    datePublished: 3,
    date: 3,
    endDate: 4,

    // Categories and types
    type: 5,
    filter: 5,
    role: 5,
    attendanceType: 6,

    // Location and position
    city: 7,
    position: 7,
    location: 7,

    // Descriptions
    description: 8,
    shortDescription: 8,
    missionEnglish: 8,
    summary: 8,

    // Important metadata
    order: 9,
    yearEstablished: 9,

    // Boolean flags
    featured: 10,
    hero: 10,

    // URLs and links
    website: 11,
    externalLink: 11,

    // Arabic fields
    nameArabic: 12,
    positionArabic: 12,

    // Technical fields
    slug: 20
  };

  // Convert to columns, resolving values from either top-level or data.*
  const columns: ColumnConfig[] = Array.from(allFields)
    .sort((a, b) => {
      const priorityA = fieldPriority[a] || 15;
      const priorityB = fieldPriority[b] || 15;
      if (priorityA !== priorityB) return priorityA - priorityB;
      return a.localeCompare(b); // Alphabetical for same priority
    })
    .map((fieldName) => ({
      id: fieldName,
      label: createFieldLabel(fieldName),
      defaultVisible: defaultVisible.includes(fieldName),
      render: (item: any) =>
        renderFieldValue(getValueForField(item, fieldName), fieldName)
    }));

  return columns;
}

// Main function - this is what the component calls
export function getColumnConfigForCollection(
  collectionId: string,
  items?: any[]
): ColumnConfig[] {
  if (items && items.length > 0) {
    return generateColumnsFromData(items, collectionId);
  }

  // Fallback when no items available
  return [
    {
      id: 'title',
      label: 'Title',
      defaultVisible: true,
      render: (item: any) => renderFieldValue(item.title || item.name, 'title')
    },
    {
      id: 'status',
      label: 'Status',
      defaultVisible: true,
      render: (item: any) => renderFieldValue(item.status, 'status')
    }
  ];
}
