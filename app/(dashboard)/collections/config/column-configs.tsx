import type { ColumnConfig } from '../components/column-visibility-selector';

// Utility functions for rendering
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

const renderBoolean = (value: boolean | undefined) => {
  return value ? (
    <span className="text-sm text-green-400">✓</span>
  ) : (
    <span className="text-sm text-gray-400">—</span>
  );
};

const renderImage = (imageObj: any) => {
  if (!imageObj?.url) return <span className="text-sm text-gray-400">—</span>;
  return (
    <div className="flex items-center">
      <img
        src={imageObj.url}
        alt={imageObj.alt || ''}
        className="w-8 h-8 rounded object-cover mr-2"
      />
      <span className="text-xs text-gray-500">Image</span>
    </div>
  );
};

const renderBadge = (value: string | undefined, color: string = 'gray') => {
  if (!value) return <span className="text-sm text-gray-400">—</span>;

  const colorClasses = {
    gray: 'bg-gray-700 text-gray-300 border-gray-600',
    blue: 'bg-blue-900/60 text-blue-300 border-blue-500/30',
    purple: 'bg-purple-900/60 text-purple-300 border-purple-500/30',
    green: 'bg-green-900/60 text-green-300 border-green-500/30',
    yellow: 'bg-yellow-900/60 text-yellow-300 border-yellow-500/30',
    indigo: 'bg-indigo-900/60 text-indigo-300 border-indigo-500/30'
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClasses[color as keyof typeof colorClasses] || colorClasses.gray}`}
    >
      {value}
    </span>
  );
};

// Field type detection and rendering
const detectFieldTypeAndRender = (key: string, value: any): React.ReactNode => {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return <span className="text-sm text-gray-400">—</span>;
  }

  // Handle different field types based on key patterns and value types

  // Title/Name fields (most important)
  if (['title', 'name'].includes(key)) {
    return (
      <div className="text-sm font-medium text-white line-clamp-2 max-w-xs">
        {value}
      </div>
    );
  }

  // Status field
  if (key === 'status') {
    return <span className={getStatusBadge(value)}>{value}</span>;
  }

  // Date fields
  if (key.toLowerCase().includes('date') || key === 'datePublished') {
    return (
      <div className="text-sm text-gray-400 whitespace-nowrap">
        {formatDate(value)}
      </div>
    );
  }

  // Boolean fields
  if (typeof value === 'boolean') {
    return renderBoolean(value);
  }

  // Image objects
  if (typeof value === 'object' && value.url) {
    return renderImage(value);
  }

  // Array fields (references, tags, etc.)
  if (Array.isArray(value)) {
    if (value.length === 0)
      return <span className="text-sm text-gray-400">—</span>;
    return (
      <span className="text-sm text-gray-400">
        {value.length} item{value.length !== 1 ? 's' : ''}
      </span>
    );
  }

  // Enum/Category fields (based on key patterns)
  if (['type', 'filter', 'attendanceType', 'role'].includes(key)) {
    return renderBadge(value, 'blue');
  }

  // Position/Job title fields
  if (['position', 'positionArabic', 'role'].includes(key)) {
    return <div className="text-sm text-gray-400">{value}</div>;
  }

  // Description/Content fields
  if (
    key.toLowerCase().includes('description') ||
    key.toLowerCase().includes('mission') ||
    key.toLowerCase().includes('summary') ||
    key.toLowerCase().includes('biography')
  ) {
    return (
      <div className="text-sm text-gray-400 line-clamp-2 max-w-md">
        {truncateText(value)}
      </div>
    );
  }

  // URL fields
  if (
    key.toLowerCase().includes('link') ||
    key.toLowerCase().includes('website') ||
    key.toLowerCase().includes('url')
  ) {
    return value ? (
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-blue-400 hover:text-blue-300 underline"
        onClick={(e) => e.stopPropagation()}
      >
        Link
      </a>
    ) : (
      <span className="text-sm text-gray-400">—</span>
    );
  }

  // Slug fields
  if (key === 'slug') {
    return <span className="text-xs text-gray-500 font-mono">{value}</span>;
  }

  // Order/Number fields
  if (key === 'order' || key === 'yearEstablished' || key === 'yearClosed') {
    return <span className="text-sm text-gray-400">{value}</span>;
  }

  // Default: render as simple text
  if (typeof value === 'string') {
    return (
      <span className="text-sm text-gray-400">{truncateText(value, 50)}</span>
    );
  }

  if (typeof value === 'number') {
    return <span className="text-sm text-gray-400">{value}</span>;
  }

  // Object or other complex types
  return <span className="text-sm text-gray-500">Object</span>;
};

// Generate columns dynamically based on actual item data
export function generateColumnsFromData(
  items: any[],
  collectionId: string
): ColumnConfig[] {
  if (!items || items.length === 0) {
    return getDefaultColumns();
  }

  // Analyze all items to find common fields
  const fieldCounts: Record<string, number> = {};
  const fieldExamples: Record<string, any> = {};

  items.forEach((item) => {
    Object.keys(item).forEach((key) => {
      fieldCounts[key] = (fieldCounts[key] || 0) + 1;
      if (
        !fieldExamples[key] &&
        item[key] !== null &&
        item[key] !== undefined
      ) {
        fieldExamples[key] = item[key];
      }
    });
  });

  // Create column configs for fields that appear in most items
  const totalItems = items.length;
  const minAppearanceThreshold = Math.max(1, Math.floor(totalItems * 0.3)); // Field must appear in at least 30% of items

  const columns: ColumnConfig[] = [];

  // Define field priority and default visibility
  const fieldPriority: Record<
    string,
    { priority: number; defaultVisible: boolean }
  > = {
    // Core fields (always show by default)
    title: { priority: 1, defaultVisible: true },
    name: { priority: 1, defaultVisible: true },
    status: { priority: 2, defaultVisible: true },

    // Important date/time fields
    eventDate: { priority: 3, defaultVisible: true },
    datePublished: { priority: 3, defaultVisible: true },
    date: { priority: 3, defaultVisible: true },

    // Category/Type fields
    type: { priority: 4, defaultVisible: true },
    filter: { priority: 4, defaultVisible: true },
    attendanceType: { priority: 5, defaultVisible: false },
    role: { priority: 5, defaultVisible: true },

    // Location/Contact
    city: { priority: 6, defaultVisible: true },
    position: { priority: 6, defaultVisible: true },

    // Content
    description: { priority: 7, defaultVisible: false },
    missionEnglish: { priority: 7, defaultVisible: false },
    shortDescription: { priority: 7, defaultVisible: false },

    // Technical
    slug: { priority: 10, defaultVisible: false },
    order: { priority: 10, defaultVisible: false }

    // Everything else gets lower priority
  };

  // Generate columns for qualifying fields
  Object.entries(fieldCounts)
    .filter(([key, count]) => count >= minAppearanceThreshold)
    .sort(([keyA], [keyB]) => {
      const priorityA = fieldPriority[keyA]?.priority || 8;
      const priorityB = fieldPriority[keyB]?.priority || 8;
      return priorityA - priorityB;
    })
    .forEach(([key]) => {
      const config = fieldPriority[key];
      const example = fieldExamples[key];

      columns.push({
        id: key,
        label: formatFieldLabel(key),
        defaultVisible: config?.defaultVisible ?? false,
        render: (item: any) => detectFieldTypeAndRender(key, item[key])
      });
    });

  return columns.length > 0 ? columns : getDefaultColumns();
}

// Format field key into human-readable label
function formatFieldLabel(key: string): string {
  // Handle special cases
  const specialLabels: Record<string, string> = {
    eventDate: 'Event Date',
    datePublished: 'Published',
    attendanceType: 'Type',
    shortDescription: 'Description',
    missionEnglish: 'Mission',
    nameArabic: 'Name (Arabic)',
    positionArabic: 'Position (Arabic)',
    yearEstablished: 'Year',
    yearClosed: 'Closed',
    pushToGr: 'Push to GR',
    newsOnOff: 'News',
    moreDetailsOnOff: 'Details',
    inTheMediaOnOff: 'Media'
  };

  if (specialLabels[key]) {
    return specialLabels[key];
  }

  // Convert camelCase and snake_case to Title Case
  return key
    .replace(/([A-Z])/g, ' $1') // Add space before capitals
    .replace(/[-_]/g, ' ') // Replace dashes and underscores with spaces
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .trim();
}

// Fallback default columns
function getDefaultColumns(): ColumnConfig[] {
  return [
    {
      id: 'title',
      label: 'Title',
      defaultVisible: true,
      render: (item: any) =>
        detectFieldTypeAndRender('title', item.title || item.name)
    },
    {
      id: 'status',
      label: 'Status',
      defaultVisible: true,
      render: (item: any) => detectFieldTypeAndRender('status', item.status)
    },
    {
      id: 'description',
      label: 'Description',
      defaultVisible: false,
      render: (item: any) =>
        detectFieldTypeAndRender('description', item.description)
    },
    {
      id: 'slug',
      label: 'Slug',
      defaultVisible: false,
      render: (item: any) => detectFieldTypeAndRender('slug', item.slug)
    }
  ];
}

// Main function to get column config for a collection
export function getColumnConfigForCollection(
  collectionId: string,
  items?: any[]
): ColumnConfig[] {
  if (items && items.length > 0) {
    return generateColumnsFromData(items, collectionId);
  }

  return getDefaultColumns();
}
