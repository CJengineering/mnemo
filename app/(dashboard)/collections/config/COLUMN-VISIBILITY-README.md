# Dynamic Column Visibility Feature

## Overview

This feature allows users to dynamically show/hide columns in collection list views, with preferences saved per collection type.

## Files Created

### 1. `column-visibility-selector.tsx`

- **Purpose**: UI component for selecting visible columns
- **Features**:
  - Dropdown menu with checkboxes
  - Shows count of visible/total columns
  - Reset button to restore defaults
  - Click outside to close

### 2. `use-column-visibility.ts` (Hook)

- **Purpose**: Manages column visibility state and localStorage persistence
- **Features**:
  - Per-collection preferences saved to localStorage
  - Returns active (visible) columns
  - Toggle and reset functions
  - Validates stored columns against current config

### 3. `column-configs.tsx`

- **Purpose**: Defines available columns for each collection type
- **Collections Configured**:
  - **Events**: Title, Event Date, Status, Attendance Type, City, Description, Slug
  - **Team**: Name, Position, Category, Order, Status, Slug
  - **Programme**: Name, Slug, Description, Status, Date
  - **Partner**: Name, Description, Status, Slug, Date
  - **Default**: Title, Description, Status, Date, Type

### 4. `items-list.tsx` (Updated)

- **Changes**: Now uses dynamic column system instead of hardcoded columns

## Usage

### For Users

1. Navigate to any collection (Events, Team, Programme, Partner, etc.)
2. Click the **"Columns"** button in the toolbar
3. Check/uncheck columns to show/hide them
4. Click **"Reset"** to restore default columns
5. Your preferences are automatically saved per collection

### For Developers

#### Adding a New Collection Type

Edit `config/column-configs.tsx`:

```tsx
// Add your collection to the config
export const collectionColumnConfigs: Record<string, ColumnConfig[]> = {
  // ... existing configs

  mycollection: [
    {
      id: 'title',
      label: 'Title',
      defaultVisible: true,
      render: (item) => (
        <div className="text-sm font-medium text-white">{item.title}</div>
      )
    },
    {
      id: 'customField',
      label: 'Custom Field',
      defaultVisible: false,
      render: (item) => (
        <span className="text-sm text-gray-400">{item.customField || '—'}</span>
      )
    }
  ]
};
```

#### Adding a New Column to Existing Collection

```tsx
// In column-configs.tsx, add to the array
events: [
  // ...existing columns
  {
    id: 'newField',
    label: 'New Field',
    defaultVisible: false, // Won't show by default
    render: (item: any) => (
      <span className="text-sm text-gray-400">{item.newField || '—'}</span>
    )
  }
];
```

## Data Flow

```
User selects collection
       ↓
items-list.tsx loads
       ↓
getColumnConfigForCollection(collectionId)
       ↓
useColumnVisibility hook
       ↓
Loads from localStorage: `collection_columns_{collectionId}`
       ↓
Returns activeColumns (visible only)
       ↓
Table renders dynamic columns
```

## LocalStorage Schema

```json
{
  "collection_columns_events": ["title", "eventDate", "status", "description"],
  "collection_columns_team": ["title", "position", "filter", "status"],
  "collection_columns_programme": ["title", "slug", "description", "status"]
}
```

## Styling

The component uses the existing design system:

- Dark theme (gray-800, gray-900)
- Blue accent for selections (blue-600)
- Border colors (gray-600, gray-700)
- Consistent with other UI components

## Browser Support

- **localStorage**: All modern browsers
- **React 18+**: Required for hooks
- **TypeScript**: Fully typed

## Future Enhancements

- [ ] Column reordering (drag & drop)
- [ ] Column width customization
- [ ] Export column preferences
- [ ] Share column layouts with team
- [ ] Keyboard shortcuts for column toggling
- [ ] Column grouping/categories
- [ ] Sort by column click
- [ ] Filter by column values
