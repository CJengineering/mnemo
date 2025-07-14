# Unified Form Components Guide

## Overview

We've created unified, reusable form components to ensure consistency across all collection forms. These components provide a unified interface for common form patterns like rich text editing, image uploads, and content management.

## Available Components

### 1. RichTextField - Unified Rich Text Editor

**Purpose**: Provides consistent rich text editing across all forms using the SimpleEditor component.

**Usage**:

```tsx
import { RichTextField } from './form-fields';

<RichTextField
  control={form.control}
  name="description"
  label="Description"
  required
  description="Add rich text content with formatting"
  minHeight="300px"
/>;
```

**Features**:

- Based on the same SimpleEditor used in TextDataForm
- Supports formatting, links, images, lists
- Consistent toolbar and behavior
- Customizable minimum height

### 2. ContentTypeField - Dynamic Content Type Selection

**Purpose**: Allows users to choose content type like in TextDataForm.

**Usage**:

```tsx
<ContentTypeField
  control={form.control}
  name="contentType"
  label="Content Type"
  required
  contentTypes={[
    { value: 'text', label: 'Plain Text' },
    { value: 'rich-text', label: 'Rich Text' },
    { value: 'markdown', label: 'Markdown' }
  ]}
/>
```

### 3. DynamicContentField - Content that adapts to type

**Purpose**: Renders different input types based on the selected content type.

**Usage**:

```tsx
<DynamicContentField
  control={form.control}
  contentTypeField="contentType"
  contentField="content"
  label="Content"
  required
/>
```

**Behavior**:

- `rich-text`: Shows SimpleEditor
- `html`: Shows code textarea
- `markdown`: Shows markdown textarea
- `text`: Shows plain textarea

### 4. MultiImageField - Enhanced Image Gallery

**Purpose**: Unified multiple image upload with preview and metadata.

**Usage**:

```tsx
<MultiImageField
  control={form.control}
  name="gallery"
  label="Image Gallery"
  description="Upload multiple images for this article"
  maxImages={10}
/>
```

**Features**:

- Multiple image upload using the same API as TextDataForm
- Individual alt text and captions
- Image preview with removal
- Drag and drop support
- Maximum image limits

### 5. URLField - Enhanced URL Input

**Purpose**: URL input with validation and preview.

**Usage**:

```tsx
<URLField
  control={form.control}
  name="externalLink"
  label="External Link"
  required
  showPreview
  description="Link to the original article"
/>
```

**Features**:

- URL validation
- Optional preview button
- Visual feedback for valid URLs

### 6. DateRangeField - Event Date Ranges

**Purpose**: Unified date range selection for events and programs.

**Usage**:

```tsx
<DateRangeField
  control={form.control}
  startDateField="startDate"
  endDateField="endDate"
  label="Event Dates"
  required
  includeTime
/>
```

### 7. AIContentField - AI Content Generation

**Purpose**: Integrated AI content generation like in TextDataForm.

**Usage**:

```tsx
<AIContentField
  control={form.control}
  name="summary"
  label="Summary"
  contentType="summary"
  contextFields={['title', 'description']}
/>
```

**Features**:

- AI button next to field label
- Context-aware generation
- Uses other form fields as context

## Enhanced Existing Components

### ImageField (Enhanced)

- Now uses the same API.uploadImage as TextDataForm
- Better error handling and preview
- Consistent styling

### ReferenceField (Enhanced)

- Search functionality
- Better visual feedback
- Consistent badge styling

## Migration Guide

### Before (Individual implementations):

```tsx
// Different rich text implementations across forms
<Textarea rows={10} {...field} />  // Basic textarea
<SomeCustomEditor {...field} />    // Custom implementation
<ReactQuill {...field} />          // Different library
```

### After (Unified approach):

```tsx
// Same rich text editor everywhere
<RichTextField control={form.control} name="content" label="Content" required />
```

## Example: Complete News Form with Unified Components

```tsx
import {
  RichTextField,
  MultiImageField,
  URLField,
  AIContentField,
  ContentTypeField,
  DynamicContentField,
  DateRangeField,
  TextField,
  ImageField,
  ReferenceField
} from './form-fields';

export function NewsForm({ initialData, onSubmit }: NewsFormProps) {
  const form = useForm({
    resolver: zodResolver(newsSchema),
    defaultValues: {
      title: '',
      contentType: 'rich-text',
      content: '',
      summary: ''
      // ...other fields
    }
  });

  return (
    <Form {...form}>
      <Tabs defaultValue="basic">
        <TabsList>
          <TabsTrigger value="basic">Basic Details</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <TextField
            control={form.control}
            name="title"
            label="Title"
            required
          />

          <URLField
            control={form.control}
            name="externalLink"
            label="External Link"
            required
            showPreview
          />

          <AIContentField
            control={form.control}
            name="summary"
            label="Summary"
            contentType="summary"
            contextFields={['title']}
          />
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <ContentTypeField
            control={form.control}
            name="contentType"
            label="Content Type"
          />

          <DynamicContentField
            control={form.control}
            contentTypeField="contentType"
            contentField="content"
            label="Main Content"
            required
          />
        </TabsContent>

        <TabsContent value="media" className="space-y-6">
          <ImageField
            control={form.control}
            name="thumbnail"
            label="Thumbnail"
            required
          />

          <MultiImageField
            control={form.control}
            name="gallery"
            label="Image Gallery"
            maxImages={10}
          />
        </TabsContent>
      </Tabs>
    </Form>
  );
}
```

## Benefits of Unified Components

1. **Consistency**: Same behavior across all collection types
2. **Maintainability**: Single source of truth for each component type
3. **Rich Features**: All forms get advanced features like AI generation, rich text editing
4. **Type Safety**: Proper TypeScript integration
5. **Performance**: Optimized components with proper memoization
6. **User Experience**: Consistent interface reduces learning curve

## Implementation Status

✅ **Completed Components**:

- RichTextField (SimpleEditor integration)
- MultiImageField (Enhanced gallery)
- URLField (With validation)
- ContentTypeField (Type selection)
- DynamicContentField (Adaptive content)
- DateRangeField (Event dates)
- AIContentField (AI integration)

🔄 **In Progress**:

- Migration of existing forms to use unified components
- Enhanced validation integration
- Better accessibility features

📋 **Next Steps**:

1. Update all collection forms to use unified components
2. Add more specialized components as needed
3. Implement component-level testing
4. Create Storybook documentation

## Best Practices

1. **Always use unified components** instead of creating custom implementations
2. **Extend existing components** rather than creating new ones
3. **Keep component APIs consistent** with similar prop patterns
4. **Add proper TypeScript types** for all props
5. **Include helpful descriptions** and validation messages
6. **Test components** in isolation and within forms

This unified approach ensures that all collection forms have the same powerful features as the TextDataForm, including rich text editing, image handling, and AI content generation.
