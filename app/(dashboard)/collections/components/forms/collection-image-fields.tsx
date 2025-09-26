/**
 * Collection-specific image field components with organized folder structure
 * These upload images to: /collection/[collection-type]/[slug]/image-name.extension
 */

'use client';

import React, { useState } from 'react';
import { Control } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Upload } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { CollectionAPI } from '@/tip-tap/lib/collection-api';

// Collection Image Upload Field Props
interface CollectionImageFieldProps {
  control: Control<any>;
  name: string;
  label: string;
  required?: boolean;
  helperText?: string;
  multiple?: boolean;
  maxImages?: number;
  collectionType: string; // e.g., 'team', 'events', 'news'
  slug: string; // The item slug for folder organization
  preserveFormat?: boolean; // Whether to preserve original format
}

/**
 * Single Image Upload Component for Collections
 */
export function CollectionImageField({
  control,
  name,
  label,
  required = false,
  helperText,
  collectionType,
  slug,
  preserveFormat = false
}: Omit<CollectionImageFieldProps, 'multiple' | 'maxImages'>) {
  const [isUploading, setIsUploading] = useState(false);

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="space-y-3">
          <FormLabel className="text-sm font-medium text-white flex items-center gap-1">
            {label}
            {required && <span className="text-red-500">*</span>}
          </FormLabel>
          <Card className="bg-gray-800 border-gray-600">
            <CardContent className="p-4 space-y-4">
              {helperText && (
                <p className="text-xs text-gray-400">{helperText}</p>
              )}

              {/* Current Image Display */}
              {field.value?.url && (
                <div className="relative group">
                  <div className="bg-gray-700 rounded-lg overflow-hidden inline-flex items-center justify-center">
                    <img
                      src={field.value.url}
                      alt={field.value.alt || 'Uploaded image'}
                      className="h-[50px] max-h-[50px] w-auto object-contain"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => {
                      field.onChange({ url: '', alt: '' });
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}

              {/* Upload Section */}
              <div className="space-y-3">
                <Input
                  type="file"
                  accept="image/*"
                  disabled={isUploading || !slug}
                  className="hidden"
                  id={`${name}-collection-upload`}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file || !slug) return;

                    setIsUploading(true);
                    try {
                      const uploadedURL =
                        await CollectionAPI.uploadCollectionImage(
                          file,
                          collectionType,
                          slug,
                          preserveFormat
                        );

                      if (!uploadedURL) {
                        alert('Upload failed. Try again.');
                        return;
                      }

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

                <Button
                  type="button"
                  variant="outline"
                  className="w-full bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                  disabled={isUploading || !slug}
                  onClick={() =>
                    document
                      .getElementById(`${name}-collection-upload`)
                      ?.click()
                  }
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isUploading
                    ? 'Uploading...'
                    : field.value?.url
                      ? 'Replace Image'
                      : 'Upload Image'}
                </Button>

                {!slug && (
                  <p className="text-xs text-yellow-400">
                    ⚠️ Please save the item first to enable image uploads
                  </p>
                )}

                {/* Alt Text Input */}
                {field.value?.url && (
                  <Input
                    placeholder="Image description (alt text)"
                    value={field.value.alt || ''}
                    onChange={(e) => {
                      const currentValue = field.value || {};
                      field.onChange({
                        ...currentValue,
                        alt: e.target.value
                      });
                    }}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  />
                )}

                {/* URL Input Alternative */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-px bg-gray-600"></div>
                  <span className="text-xs text-gray-400">or</span>
                  <div className="flex-1 h-px bg-gray-600"></div>
                </div>

                <Input
                  type="url"
                  placeholder="Paste image URL"
                  value={field.value?.url || ''}
                  onChange={(e) => {
                    const currentValue = field.value || {};
                    field.onChange({
                      ...currentValue,
                      url: e.target.value,
                      alt: currentValue.alt || ''
                    });
                  }}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />

                {/* File Path Display */}
                {field.value?.url && field.value.url.includes(CDN_BASE_URL) && (
                  <div className="text-xs text-gray-500 break-all">
                    📁 Stored at: collection/{collectionType}/{slug}/
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          <FormMessage className="text-red-400 text-xs" />
        </FormItem>
      )}
    />
  );
}

/**
 * Multiple Images Upload Component for Collections
 */
export function CollectionMultiImageField({
  control,
  name,
  label,
  required = false,
  helperText,
  maxImages = 5,
  collectionType,
  slug,
  preserveFormat = false
}: CollectionImageFieldProps) {
  const [isUploading, setIsUploading] = useState(false);

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="space-y-3">
          <FormLabel className="text-sm font-medium text-white flex items-center gap-1">
            {label}
            {required && <span className="text-red-500">*</span>}
          </FormLabel>
          <Card className="bg-gray-800 border-gray-600">
            <CardContent className="p-4 space-y-4">
              {helperText && (
                <p className="text-xs text-gray-400">{helperText}</p>
              )}

              {/* Current Images Display */}
              {field.value && field.value.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {field.value.map((image: any, index: number) => (
                    <div key={index} className="relative group">
                      <div className="bg-gray-700 rounded-lg overflow-hidden inline-flex items-center justify-center">
                        {image.url ? (
                          <img
                            src={image.url}
                            alt={image.alt || `Image ${index + 1}`}
                            className="h-[50px] max-h-[50px] w-auto object-contain"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Upload className="h-8 w-8" />
                          </div>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
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
                  ))}
                </div>
              )}

              {/* Add Images Button */}
              {(!field.value || field.value.length < maxImages) && (
                <div>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={isUploading || !slug}
                    className="hidden"
                    id={`${name}-collection-multi-upload`}
                    onChange={async (e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length === 0 || !slug) return;

                      setIsUploading(true);
                      try {
                        const uploadedURLs =
                          await CollectionAPI.uploadMultipleCollectionImages(
                            files,
                            collectionType,
                            slug,
                            preserveFormat
                          );

                        const newImages = uploadedURLs
                          .filter((url) => url)
                          .map((url) => ({ url, alt: '' }));

                        const currentImages = field.value || [];
                        const updatedImages = [
                          ...currentImages,
                          ...newImages
                        ].slice(0, maxImages);
                        field.onChange(updatedImages);
                      } catch (error) {
                        console.error('Upload error:', error);
                        alert('Upload failed. Please try again.');
                      } finally {
                        setIsUploading(false);
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                    disabled={isUploading || !slug}
                    onClick={() =>
                      document
                        .getElementById(`${name}-collection-multi-upload`)
                        ?.click()
                    }
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {isUploading ? 'Uploading...' : 'Add Images'}
                  </Button>

                  {!slug && (
                    <p className="text-xs text-yellow-400 mt-2">
                      ⚠️ Please save the item first to enable image uploads
                    </p>
                  )}
                </div>
              )}

              {/* File Path Display */}
              {field.value && field.value.length > 0 && slug && (
                <div className="text-xs text-gray-500">
                  📁 Images stored at: collection/{collectionType}/{slug}/
                </div>
              )}
            </CardContent>
          </Card>
          <FormMessage className="text-red-400 text-xs" />
        </FormItem>
      )}
    />
  );
}

// Helper constant for CDN base URL
const CDN_BASE_URL = 'https://cdn.communityjameel.io';
