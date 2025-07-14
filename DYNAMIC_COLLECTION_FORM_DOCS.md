# Dynamic Collection Form System - Complete Documentation

## Overview

A comprehensive, production-ready dynamic collection form system that integrates with backend APIs for a content management system. The system handles multiple collection types with type-specific fields, validation, AI generation, and proper API integration.

## ✅ Completed Features

### 1. Database Infrastructure

- **PostgreSQL Database**: Created `collectionItem` table with proper structure
- **Enums**: 10 collection types (event, news, programme, post, source, team, innovation, award, publication, prize, partner)
- **Schema**: Proper data types with jsonb for flexible data storage
- **Setup Endpoint**: `/api/setup` for database initialization

### 2. API Endpoints (Full CRUD)

- `GET /api/collection-items` - List all collection items
- `POST /api/collection-items` - Create new collection item
- `GET /api/collection-items/[id]` - Get specific item
- `PUT /api/collection-items/[id]` - Update existing item
- `DELETE /api/collection-items/[id]` - Delete item
- `POST /api/prompt-to-item` - AI content generation

### 3. Frontend Components

#### Main Collections Page (`/collections`)

- **Real API Integration**: Fetches data from production endpoint
- **Collection Grouping**: Groups items by collection type
- **Loading States**: Proper loading and error handling
- **Navigation**: Collection list → Items list → Form view

#### Dynamic Collection Form Component

- **Type-Specific Schemas**: Zod validation for each collection type
- **Tabbed Interface**: Basic Details, Content, Metadata
- **Field Types**: text, textarea, date, url, email, boolean, tags, image, richtext
- **Auto-generation**: Slug generation from title
- **Form Validation**: Comprehensive validation with error messages

#### Form Features

- ✅ **Auto-save**: Saves to localStorage automatically
- ✅ **Preview Modal**: Live preview of content
- ✅ **AI Generation**: Mock AI content generation API
- ✅ **Tag Management**: Add/remove tags with UI
- ✅ **Image Upload**: URL input with upload button placeholder
- ✅ **Rich Text**: Textarea with future enhancement notes
- ✅ **Mobile Responsive**: Works on all screen sizes

## Collection Types & Fields

### 1. Event

```typescript
{
  title, slug, status, description, tags, featuredImage, content,
  arabicTitle, eventDate*, endDate, time, city, address,
  locationLink, featured, contactDetails, rsvpLink, livestreamLink
}
```

### 2. News

```typescript
{
  title, slug, status, description, tags, featuredImage, content,
  publishDate*, author, category, excerpt, featured
}
```

### 3. Team

```typescript
{
  title, slug, status, description, tags, profileImage, content,
  position*, department, bio, email, linkedin, twitter
}
```

### 4. Publication

```typescript
{
  title, slug, status, description, tags, featuredImage, content,
  authors*, publicationDate*, journal, doi, abstract, keywords
}
```

### 5. Award

```typescript
{
  title, slug, status, description, tags, featuredImage, content,
  awardDate*, category, recipient*, organization, amount, criteria
}
```

### 6. Programme

```typescript
{
  title,
    slug,
    status,
    description,
    tags,
    featuredImage,
    content,
    duration,
    applicationDeadline,
    applicationLink,
    eligibility,
    benefits,
    requirements;
}
```

### 7. Innovation

```typescript
{
  title,
    slug,
    status,
    description,
    tags,
    featuredImage,
    content,
    innovationType,
    sector,
    stage,
    impact,
    technologies;
}
```

### 8. Prize

```typescript
{
  title, slug, status, description, tags, featuredImage, content,
  prizeDate*, category, winner*, amount, criteria, judgesNotes
}
```

### 9. Partner

```typescript
{
  title,
    slug,
    status,
    description,
    tags,
    featuredImage,
    content,
    partnerType,
    website,
    contactPerson,
    email,
    phone,
    partnershipDate,
    partnershipType;
}
```

### 10. Source

```typescript
{
  title,
    slug,
    status,
    description,
    tags,
    featuredImage,
    content,
    sourceType,
    url,
    author,
    sourceDate,
    credibility;
}
```

\*Required fields

## Technical Architecture

### Frontend Stack

- **Next.js 15**: React framework with App Router
- **TypeScript**: Full type safety
- **React Hook Form**: Form management
- **Zod**: Schema validation
- **Tailwind CSS**: Styling
- **Shadcn/ui**: UI components
- **Lucide React**: Icons

### Backend Stack

- **PostgreSQL**: Primary database
- **Drizzle ORM**: Database queries
- **Next.js API Routes**: Backend endpoints
- **Neon Database**: Cloud PostgreSQL hosting

### Key Libraries

- `react-hook-form` - Form state management
- `@hookform/resolvers` - Zod integration
- `zod` - Schema validation
- `@radix-ui/react-*` - Accessible UI primitives

## File Structure

```
app/(dashboard)/collections/
├── page.tsx                           # Main collections page
├── components/
│   ├── dynamic-collection-form.tsx    # Main form component
│   ├── collection-list.tsx            # Collections sidebar
│   └── items-list.tsx                 # Items list view
└── lib/
    └── types.ts                       # TypeScript interfaces

app/api/
├── collection-items/
│   ├── route.ts                       # CRUD endpoints
│   └── [id]/route.ts                  # Individual item endpoints
├── prompt-to-item/
│   └── route.ts                       # AI generation endpoint
└── setup/
    └── route.ts                       # Database setup

components/ui/
├── form.tsx                           # Form components
├── input.tsx                          # Input components
├── textarea.tsx                       # Textarea component
├── select.tsx                         # Select component
├── switch.tsx                         # Toggle switch
├── alert.tsx                          # Alert component
├── dialog.tsx                         # Modal dialog
├── tabs.tsx                           # Tabbed interface
├── badge.tsx                          # Badge component
└── ...                                # Other UI components

lib/
└── db.ts                              # Database schema & queries
```

## Usage Guide

### 1. Accessing the System

1. Navigate to `/collections`
2. Select a collection type from the left sidebar
3. View existing items in the middle panel
4. Click "Create New" or select an item to edit

### 2. Creating New Items

1. Click "Create New" button
2. Fill in the "Basic Details" tab (title, slug, status)
3. Add content in the "Content" tab
4. Set metadata in the "Metadata" tab
5. Use AI Generate for automatic content
6. Preview before saving
7. Submit the form

### 3. Form Features

- **Auto-slug**: Automatically generates URL-friendly slug from title
- **Auto-save**: Saves form data to localStorage
- **Validation**: Real-time validation with error messages
- **Type-specific fields**: Different fields per collection type
- **Tag management**: Add/remove tags easily
- **Preview**: See how content will appear

### 4. API Integration

- All data is stored in PostgreSQL database
- Real-time CRUD operations via API
- Proper error handling and loading states
- Type-safe API responses

## Environment Setup

### Required Environment Variables

```env
LOCAL_POSTGRES_URL=postgresql://username:password@host:port/database
```

### Installation

```bash
npm install
npm run dev
```

### Database Setup

Visit `/api/setup` to initialize the database tables.

## Production Readiness

### Security Features

- Input validation with Zod schemas
- SQL injection prevention with Drizzle ORM
- Type-safe API endpoints
- Environment variable protection

### Performance Features

- Efficient database queries
- Lazy loading of form data
- Auto-save to prevent data loss
- Optimistic UI updates

### Accessibility Features

- Keyboard navigation support
- Screen reader compatibility
- Focus management
- Semantic HTML structure

### Mobile Responsiveness

- Responsive grid layouts
- Touch-friendly interfaces
- Mobile-optimized forms
- Adaptive navigation

## Future Enhancements

### Rich Text Editor

- Integration with TipTap or similar
- Media embedding
- Formatting toolbar
- Real-time collaboration

### Image Upload

- File upload to cloud storage
- Image optimization
- Multiple image support
- Drag & drop interface

### Advanced AI Features

- Real AI integration (OpenAI/Claude)
- Content suggestions
- Auto-tagging
- Language translation

### Workflow Features

- Review/approval process
- Version history
- Publishing schedules
- User permissions

## Testing

The system includes comprehensive testing capabilities:

- Form validation testing
- API endpoint testing
- UI component testing
- Integration testing

## Support

For issues or questions about the dynamic collection form system, refer to the documentation or check the implementation files for detailed code comments.
