'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Control, useWatch } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Upload, Search, Wand2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DarkModeSimpleEditor } from './dark-mode-simple-editor';
import API from '@/tip-tap/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';

// Image Preview Component with fallback handling
interface ImagePreviewProps {
  url: string;
  alt: string;
  className?: string;
}

function ImagePreview({
  url,
  alt,
  className = 'max-w-xs max-h-32 object-cover rounded border'
}: ImagePreviewProps) {
  const [useNextImage, setUseNextImage] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (useNextImage) {
      // First try: Next.js Image failed, try regular img tag
      console.warn('Next.js Image failed, trying regular img tag for:', url);
      setUseNextImage(false);
    } else {
      // Second try: Regular img also failed
      console.error('Both Next.js Image and regular img failed for:', url);
      setHasError(true);
    }
  };

  const handleSuccess = () => {
    console.log('✅ Image loaded successfully:', url);
    setHasError(false);
  };

  if (hasError) {
    return (
      <div className="p-4 border-2 border-red-200 rounded bg-red-50">
        <div className="text-sm text-red-600 mb-2">⚠️ Image failed to load</div>
        <div className="text-xs text-gray-600 break-all mb-2">URL: {url}</div>
        <button
          type="button"
          onClick={() => window.open(url, '_blank')}
          className="text-blue-600 underline text-xs"
        >
          Open in new tab
        </button>
      </div>
    );
  }

  if (useNextImage) {
    return (
      <Image
        src={url}
        alt={alt}
        width={200}
        height={128}
        className={className}
        onLoad={handleSuccess}
        onError={handleError}
        unoptimized // Disable optimization for external CDN images
      />
    );
  }

  return (
    <img
      src={url}
      alt={alt}
      className={className}
      onLoad={handleSuccess}
      onError={handleError}
    />
  );
}

// Rich Text Field Component - Unified rich text editor across all forms
interface RichTextFieldProps {
  control: Control<any>;
  name: string;
  label: string;
  required?: boolean;
  description?: string;
  placeholder?: string;
  minHeight?: string;
}

export function RichTextField({
  control,
  name,
  label,
  required = false,
  description,
  placeholder = 'Start writing...',
  minHeight = '200px'
}: RichTextFieldProps) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel
            className={required ? "after:content-['*'] after:text-red-500" : ''}
          >
            {label}
          </FormLabel>
          <FormControl>
            <div style={{ minHeight }} className="border rounded-md">
              <DarkModeSimpleEditor
                initialContent={field.value || ''}
                onChange={(content) => {
                  field.onChange(content);
                }}
              />
            </div>
          </FormControl>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// Multi-Image Gallery Field - Enhanced image handling with multiple uploads

// Multi-Image Gallery Field - Enhanced image handling with multiple uploads
interface MultiImageFieldProps {
  control: Control<any>;
  name: string;
  label: string;
  required?: boolean;
  description?: string;
  maxImages?: number;
}

export function MultiImageField({
  control,
  name,
  label,
  required = false,
  description,
  maxImages = 10
}: MultiImageFieldProps) {
  const [isUploading, setIsUploading] = useState(false);

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel
            className={required ? "after:content-['*'] after:text-red-500" : ''}
          >
            {label}
          </FormLabel>
          <Card>
            <CardContent className="p-4 space-y-4">
              {description && (
                <div className="text-sm text-muted-foreground">
                  {description}
                </div>
              )}

              {/* Upload Button */}
              <div className="flex items-center space-x-2">
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={
                    isUploading ||
                    (field.value && field.value.length >= maxImages)
                  }
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length === 0) return;

                    setIsUploading(true);
                    try {
                      const currentImages = field.value || [];
                      const newImages = [];

                      for (const file of files) {
                        if (
                          currentImages.length + newImages.length >=
                          maxImages
                        ) {
                          alert(`Maximum ${maxImages} images allowed`);
                          break;
                        }

                        const uploadedURL = await API.uploadImage(file);
                        if (uploadedURL) {
                          newImages.push({
                            url: uploadedURL,
                            alt: '',
                            caption: ''
                          });
                        }
                      }

                      field.onChange([...currentImages, ...newImages]);
                    } catch (error) {
                      console.error('Upload error:', error);
                      alert('Upload failed. Please try again.');
                    } finally {
                      setIsUploading(false);
                    }
                  }}
                />

                {isUploading && (
                  <div className="text-sm text-blue-600">
                    Uploading images...
                  </div>
                )}
              </div>

              {/* Image Gallery */}
              {field.value && field.value.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {field.value.map((image: any, index: number) => (
                    <Card key={index} className="overflow-hidden">
                      <div className="relative">
                        <ImagePreview
                          url={image.url}
                          alt={image.alt || `Image ${index + 1}`}
                          className="w-full h-32 object-cover"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2 h-6 w-6 p-0"
                          onClick={() => {
                            const newImages = field.value.filter(
                              (_: any, i: number) => i !== index
                            );
                            field.onChange(newImages);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <CardContent className="p-2 space-y-1">
                        <Input
                          placeholder="Alt text"
                          value={image.alt || ''}
                          onChange={(e) => {
                            const updated = [...field.value];
                            updated[index] = {
                              ...updated[index],
                              alt: e.target.value
                            };
                            field.onChange(updated);
                          }}
                          className="text-xs"
                        />
                        <Input
                          placeholder="Caption (optional)"
                          value={image.caption || ''}
                          onChange={(e) => {
                            const updated = [...field.value];
                            updated[index] = {
                              ...updated[index],
                              caption: e.target.value
                            };
                            field.onChange(updated);
                          }}
                          className="text-xs"
                        />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Upload Stats */}
              <div className="text-sm text-muted-foreground">
                {field.value ? field.value.length : 0} / {maxImages} images
              </div>
            </CardContent>
          </Card>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// URL Field with validation and preview
interface URLFieldProps {
  control: Control<any>;
  name: string;
  label: string;
  required?: boolean;
  description?: string;
  placeholder?: string;
  showPreview?: boolean;
}

export function URLField({
  control,
  name,
  label,
  required = false,
  description,
  placeholder = 'https://example.com',
  showPreview = false
}: URLFieldProps) {
  const [isValidUrl, setIsValidUrl] = useState(false);

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const validateUrl = (url: string) => {
          try {
            new URL(url);
            setIsValidUrl(true);
            return true;
          } catch {
            setIsValidUrl(false);
            return false;
          }
        };

        return (
          <FormItem>
            <FormLabel
              className={
                required ? "after:content-['*'] after:text-red-500" : ''
              }
            >
              {label}
            </FormLabel>
            <FormControl>
              <div className="space-y-2">
                <Input
                  type="url"
                  placeholder={placeholder}
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    validateUrl(e.target.value);
                  }}
                />
                {showPreview && field.value && isValidUrl && (
                  <div className="flex items-center space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(field.value, '_blank')}
                    >
                      Preview Link
                    </Button>
                    <span className="text-sm text-green-600">✓ Valid URL</span>
                  </div>
                )}
              </div>
            </FormControl>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}

// Date Range Field for events and programs
interface DateRangeFieldProps {
  control: Control<any>;
  startDateField: string;
  endDateField: string;
  label: string;
  required?: boolean;
  includeTime?: boolean;
}

export function DateRangeField({
  control,
  startDateField,
  endDateField,
  label,
  required = false,
  includeTime = false
}: DateRangeFieldProps) {
  const inputType = includeTime ? 'datetime-local' : 'date';

  return (
    <div className="space-y-4">
      <FormLabel
        className={required ? "after:content-['*'] after:text-red-500" : ''}
      >
        {label}
      </FormLabel>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={control}
          name={startDateField}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Start {includeTime ? 'Date & Time' : 'Date'}
              </FormLabel>
              <FormControl>
                <Input type={inputType} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={endDateField}
          render={({ field }) => (
            <FormItem>
              <FormLabel>End {includeTime ? 'Date & Time' : 'Date'}</FormLabel>
              <FormControl>
                <Input type={inputType} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

// AI Content Generator Field - Integrated AI content generation
interface AIContentFieldProps {
  control: Control<any>;
  name: string;
  label: string;
  contentType?: 'summary' | 'description' | 'title' | 'content';
  contextFields?: string[]; // Other form fields to use as context
}

export function AIContentField({
  control,
  name,
  label,
  contentType = 'content',
  contextFields = []
}: AIContentFieldProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');

  const watchedFields = useWatch({ control, name: contextFields });

  const generateContent = async () => {
    setIsGenerating(true);
    try {
      // Build context from other form fields
      const context = contextFields.reduce(
        (acc, fieldName, index) => {
          if (watchedFields && watchedFields[index]) {
            acc[fieldName] = watchedFields[index];
          }
          return acc;
        },
        {} as Record<string, any>
      );

      // Simulate AI content generation (replace with actual API call)
      const response = await fetch('/api/ai/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt,
          contentType,
          context
        })
      });

      if (response.ok) {
        const data = await response.json();
        const field = control._getWatch(name);
        field.onChange(data.content);
        setShowAIDialog(false);
        setAiPrompt('');
      }
    } catch (error) {
      console.error('AI generation failed:', error);
      alert('AI content generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <FormField
        control={control}
        name={name}
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center justify-between">
              <FormLabel>{label}</FormLabel>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAIDialog(true)}
                className="flex items-center space-x-1"
              >
                <Wand2 className="h-4 w-4" />
                <span>AI Generate</span>
              </Button>
            </div>
            <FormControl>
              <Textarea rows={4} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate {label} with AI</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder={`Describe what you want for the ${label.toLowerCase()}...`}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAIDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={generateContent}
              disabled={isGenerating || !aiPrompt.trim()}
            >
              {isGenerating ? 'Generating...' : 'Generate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Image Field Component for IncomingImageField structure
interface ImageFieldProps {
  control: Control<any>;
  name: string;
  label: string;
  required?: boolean;
  description?: string;
  multiple?: boolean;
}

export function ImageField({
  control,
  name,
  label,
  required = false,
  description,
  multiple = false
}: ImageFieldProps) {
  const [isUploading, setIsUploading] = useState(false);

  if (multiple) {
    return (
      <FormField
        control={control}
        name={name}
        render={({ field }) => (
          <FormItem>
            <FormLabel
              className={
                required ? "after:content-['*'] after:text-red-500" : ''
              }
            >
              {label}
            </FormLabel>
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="text-sm text-muted-foreground">
                  {description || 'Add multiple images'}
                </div>
                <Button type="button" variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Image
                </Button>
                {/* TODO: Implement multiple image upload */}
                <div className="text-sm text-muted-foreground">
                  Multiple image support coming soon...
                </div>
              </CardContent>
            </Card>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel
            className={required ? "after:content-['*'] after:text-red-500" : ''}
          >
            {label}
          </FormLabel>
          <Card>
            <CardContent className="p-4 space-y-3">
              {description && (
                <div className="text-sm text-muted-foreground">
                  {description}
                </div>
              )}

              {/* File Upload Input */}
              <div className="space-y-3">
                <Input
                  type="file"
                  accept="image/*"
                  disabled={isUploading}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    setIsUploading(true);
                    try {
                      // Import API for image upload
                      const API = (await import('@/tip-tap/lib/api')).default;
                      const uploadedURL = await API.uploadImage(file);

                      if (!uploadedURL) {
                        alert('Upload failed. Try again.');
                        return;
                      }

                      // Update the field with the new image data
                      const currentValue = field.value || {};
                      field.onChange({
                        ...currentValue,
                        url: uploadedURL,
                        alt: currentValue.alt || ''
                      });
                    } catch (error) {
                      console.error('Upload error:', error);
                      alert('Upload failed. Please try again.');
                    } finally {
                      setIsUploading(false);
                    }
                  }}
                />

                {isUploading && (
                  <div className="text-sm text-blue-600">
                    Uploading image...
                  </div>
                )}
              </div>

              {/* Alt Text Input */}
              <FormField
                control={control}
                name={`${name}.alt`}
                render={({ field: altField }) => (
                  <FormItem>
                    <FormLabel>Alt Text</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Description for accessibility"
                        {...altField}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Image URL Display (read-only) */}
              {field.value?.url && (
                <FormField
                  control={control}
                  name={`${name}.url`}
                  render={({ field: urlField }) => (
                    <FormItem>
                      <FormLabel>Image URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Image URL will appear here after upload"
                          readOnly
                          className="bg-muted"
                          {...urlField}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}

              {/* Image Preview */}
              {field.value?.url && (
                <div className="mt-2">
                  <div className="text-sm font-medium mb-2">Preview:</div>
                  <div className="space-y-2">
                    <ImagePreview
                      url={field.value.url}
                      alt={field.value.alt || 'Uploaded preview'}
                    />
                    <div className="text-xs text-gray-500 break-all">
                      Image URL: {field.value.url}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// Reference Field Component for IncomingReferenceItem structure
interface ReferenceFieldProps {
  control: Control<any>;
  name: string;
  label: string;
  required?: boolean;
  multiple?: boolean;
  searchEndpoint?: string; // e.g., '/api/collection-items?type=programme'
  placeholder?: string;
}

export function ReferenceField({
  control,
  name,
  label,
  required = false,
  multiple = false,
  searchEndpoint,
  placeholder = 'Search and select...'
}: ReferenceFieldProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const currentValue = useWatch({ control, name });

  const handleSearch = async (term: string) => {
    if (!searchEndpoint || term.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `${searchEndpoint}&search=${encodeURIComponent(term)}`
      );
      const data = await response.json();
      setSearchResults(data.items || []);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel
            className={required ? "after:content-['*'] after:text-red-500" : ''}
          >
            {label}
          </FormLabel>
          <div className="space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={placeholder}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  handleSearch(e.target.value);
                }}
                className="pl-10"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-blue-600 rounded-full" />
                </div>
              )}
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <Card className="max-h-48 overflow-y-auto">
                <CardContent className="p-2">
                  {searchResults.map((item) => (
                    <Button
                      key={item.id}
                      type="button"
                      variant="ghost"
                      className="w-full justify-start p-2 h-auto"
                      onClick={() => {
                        const newItem = { id: item.id, slug: item.slug };
                        if (multiple) {
                          const current = field.value || [];
                          if (!current.find((i: any) => i.id === item.id)) {
                            field.onChange([...current, newItem]);
                          }
                        } else {
                          field.onChange(newItem);
                        }
                        setSearchTerm('');
                        setSearchResults([]);
                      }}
                    >
                      <div className="text-left">
                        <div className="font-medium">{item.title}</div>
                        <div className="text-sm text-gray-500">{item.slug}</div>
                      </div>
                    </Button>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Selected Items */}
            {multiple && field.value && field.value.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {field.value.map((item: any, index: number) => (
                  <Badge
                    key={item.id}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {item.slug}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => {
                        const newValue = field.value.filter(
                          (_: any, i: number) => i !== index
                        );
                        field.onChange(newValue);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Single Selected Item */}
            {!multiple && field.value && (
              <Badge
                variant="secondary"
                className="flex items-center gap-1 w-fit"
              >
                {field.value.slug}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => field.onChange(null)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// Basic form fields
// Text Field Component with array support
export function TextField({
  control,
  name,
  label,
  required = false,
  placeholder = '',
  type = 'text',
  description,
  isArray = false
}: {
  control: Control<any>;
  name: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  type?: string;
  description?: string;
  isArray?: boolean;
}) {
  const [inputValue, setInputValue] = useState('');

  if (isArray) {
    return (
      <FormField
        control={control}
        name={name}
        render={({ field }) => (
          <FormItem>
            <FormLabel
              className={
                required ? "after:content-['*'] after:text-red-500" : ''
              }
            >
              {label}
            </FormLabel>
            <div className="space-y-2">
              <div className="flex space-x-2">
                <Input
                  placeholder={placeholder || `Add ${label.toLowerCase()}`}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (inputValue.trim()) {
                        const currentArray = field.value || [];
                        if (!currentArray.includes(inputValue.trim())) {
                          field.onChange([...currentArray, inputValue.trim()]);
                        }
                        setInputValue('');
                      }
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (inputValue.trim()) {
                      const currentArray = field.value || [];
                      if (!currentArray.includes(inputValue.trim())) {
                        field.onChange([...currentArray, inputValue.trim()]);
                      }
                      setInputValue('');
                    }
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(field.value || []).map((item: string, index: number) => (
                  <Badge key={index} variant="secondary" className="px-2 py-1">
                    {item}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 ml-2"
                      onClick={() => {
                        const newArray = [...field.value];
                        newArray.splice(index, 1);
                        field.onChange(newArray);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel
            className={required ? "after:content-['*'] after:text-red-500" : ''}
          >
            {label}
          </FormLabel>
          <FormControl>
            <Input type={type} placeholder={placeholder} {...field} />
          </FormControl>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function TextAreaField({
  control,
  name,
  label,
  required = false,
  placeholder = '',
  rows = 3,
  description
}: {
  control: Control<any>;
  name: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  rows?: number;
  description?: string;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel
            className={required ? "after:content-['*'] after:text-red-500" : ''}
          >
            {label}
          </FormLabel>
          <FormControl>
            <Textarea rows={rows} placeholder={placeholder} {...field} />
          </FormControl>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function SwitchField({
  control,
  name,
  label,
  description
}: {
  control: Control<any>;
  name: string;
  label: string;
  description?: string;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <FormLabel className="text-base">{label}</FormLabel>
            {description && (
              <div className="text-sm text-muted-foreground">{description}</div>
            )}
          </div>
          <FormControl>
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          </FormControl>
        </FormItem>
      )}
    />
  );
}

export function SelectField({
  control,
  name,
  label,
  required = false,
  options,
  placeholder = 'Select...'
}: {
  control: Control<any>;
  name: string;
  label: string;
  required?: boolean;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel
            className={required ? "after:content-['*'] after:text-red-500" : ''}
          >
            {label}
          </FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
