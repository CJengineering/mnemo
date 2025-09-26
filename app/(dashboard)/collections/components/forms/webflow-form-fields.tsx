'use client';

import React, { useState, useEffect } from 'react';
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
import { X, Plus, Upload, Link, ExternalLink, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { DarkModeSimpleEditor } from './dark-mode-simple-editor';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import './compact-form.css';

// Webflow-style Text Field
interface WebflowTextFieldProps {
  control: Control<any>;
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  helperText?: string;
  type?: 'text' | 'email' | 'url' | 'password' | 'number';
}

export function WebflowTextField({
  control,
  name,
  label,
  placeholder,
  required = false,
  helperText,
  type = 'text'
}: WebflowTextFieldProps) {
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
          <FormControl>
            <Input
              type={type}
              placeholder={placeholder}
              {...field}
              className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 h-12"
            />
          </FormControl>
          {helperText && <p className="text-xs text-gray-400">{helperText}</p>}
          <FormMessage className="text-red-400 text-xs" />
        </FormItem>
      )}
    />
  );
}

// Webflow-style Slug Field with URL Preview
interface WebflowSlugFieldProps {
  control: Control<any>;
  name: string;
  label: string;
  required?: boolean;
  baseUrl?: string;
}

export function WebflowSlugField({
  control,
  name,
  label,
  required = false,
  baseUrl = 'https://communityjamel.org'
}: WebflowSlugFieldProps) {
  const slugValue = useWatch({ control, name });

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
          <FormControl>
            <Input
              placeholder="url-slug"
              {...field}
              className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 h-12"
            />
          </FormControl>
          {slugValue && (
            <div className="flex items-center gap-2 p-3 bg-gray-900 rounded-md border border-gray-700">
              <Link className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-300">
                {baseUrl}/{slugValue}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="p-1 h-auto text-gray-400 hover:text-gray-300"
                onClick={() => window.open(`${baseUrl}/${slugValue}`, '_blank')}
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          )}
          <FormMessage className="text-red-400 text-xs" />
        </FormItem>
      )}
    />
  );
}

// Webflow-style Textarea Field
interface WebflowTextareaFieldProps {
  control: Control<any>;
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  helperText?: string;
  rows?: number;
}

export function WebflowTextareaField({
  control,
  name,
  label,
  placeholder,
  required = false,
  helperText,
  rows = 4
}: WebflowTextareaFieldProps) {
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
          <FormControl>
            <Textarea
              placeholder={placeholder}
              rows={rows}
              {...field}
              className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 resize-none"
            />
          </FormControl>
          {helperText && <p className="text-xs text-gray-400">{helperText}</p>}
          <FormMessage className="text-red-400 text-xs" />
        </FormItem>
      )}
    />
  );
}

// Webflow-style Select Field
interface WebflowSelectFieldProps {
  control: Control<any>;
  name: string;
  label: string;
  options: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
}

export function WebflowSelectField({
  control,
  name,
  label,
  options,
  required = false,
  placeholder = 'Select an option'
}: WebflowSelectFieldProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedValue, setSelectedValue] = React.useState('');
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const fieldRef = React.useRef<any>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = React.useCallback((optionValue: string) => {
    setSelectedValue(optionValue);
    if (fieldRef.current) {
      fieldRef.current.onChange(optionValue);
    }
    setIsOpen(false);
    setHighlightedIndex(-1);
    triggerRef.current?.focus();
  }, []);

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        // Store field reference for callbacks
        fieldRef.current = field;

        // Sync field value with local state
        React.useEffect(() => {
          setSelectedValue(field.value || '');
        }, [field.value]);

        const selectedOption = options.find(
          (option) => option.value === selectedValue
        );

        return (
          <FormItem className="space-y-3">
            <FormLabel className="text-sm font-medium text-white flex items-center gap-1">
              {label}
              {required && <span className="text-red-500">*</span>}
            </FormLabel>
            <div className="relative" ref={dropdownRef}>
              {/* Trigger Button */}
              <button
                ref={triggerRef}
                type="button"
                className={`
                  dropdown-trigger flex h-12 w-full items-center justify-between rounded-lg border px-4 py-3 text-sm 
                  transition-all duration-200 ease-in-out
                  ${
                    isOpen
                      ? 'border-blue-400 ring-2 ring-blue-400/20'
                      : 'border-gray-600 hover:border-gray-500'
                  }
                  focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20
                  disabled:cursor-not-allowed disabled:opacity-50
                `}
                onClick={() => {
                  setIsOpen(!isOpen);
                  if (!isOpen) {
                    setHighlightedIndex(
                      selectedValue
                        ? options.findIndex(
                            (opt) => opt.value === selectedValue
                          )
                        : 0
                    );
                  }
                }}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-label={`Select ${label}`}
              >
                <span
                  className={
                    selectedOption ? 'text-white font-medium' : 'text-gray-400'
                  }
                >
                  {selectedOption ? selectedOption.label : placeholder}
                </span>
                <div
                  className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                >
                  <svg
                    className="h-4 w-4 text-gray-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </button>

              {/* Dropdown Menu */}
              {isOpen && (
                <div className="dropdown-menu absolute top-full left-0 right-0 z-50 mt-2 max-h-60 overflow-auto rounded-lg">
                  <div className="py-1">
                    {options.map((option, index) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`
                          dropdown-option w-full px-4 py-3 text-left text-sm
                          ${
                            selectedValue === option.value
                              ? 'selected text-white font-medium'
                              : 'text-gray-200 hover:text-white'
                          }
                          ${highlightedIndex === index ? 'bg-blue-600/50 text-white' : ''}
                          ${index === 0 ? 'rounded-t-lg' : ''}
                          ${index === options.length - 1 ? 'rounded-b-lg' : ''}
                          focus:outline-none focus:text-white
                        `}
                        onClick={() => handleSelect(option.value)}
                        onMouseEnter={() => setHighlightedIndex(index)}
                        role="option"
                        aria-selected={selectedValue === option.value}
                      >
                        <div className="flex items-center justify-between">
                          <span>{option.label}</span>
                          {selectedValue === option.value && (
                            <svg
                              className="h-4 w-4 text-green-400"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <FormMessage className="text-red-400 text-xs" />
          </FormItem>
        );
      }}
    />
  );
}

// Webflow-style Switch Field
interface WebflowSwitchFieldProps {
  control: Control<any>;
  name: string;
  label: string;
  description?: string;
}

export function WebflowSwitchField({
  control,
  name,
  label,
  description
}: WebflowSwitchFieldProps) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-row items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700">
          <div className="space-y-0.5">
            <FormLabel className="text-sm font-medium text-white">
              {label}
            </FormLabel>
            {description && (
              <p className="text-xs text-gray-400">{description}</p>
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

// Webflow-style Date Field
interface WebflowDateFieldProps {
  control: Control<any>;
  name: string;
  label: string;
  required?: boolean;
}

export function WebflowDateField({
  control,
  name,
  label,
  required = false
}: WebflowDateFieldProps) {
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
          <FormControl>
            <DateTimePicker
              value={field.value}
              onChange={field.onChange}
              placeholder={`Select ${label.toLowerCase()}...`}
              className="w-full"
            />
          </FormControl>
          <FormMessage className="text-red-400 text-xs" />
        </FormItem>
      )}
    />
  );
}

// Webflow-style Image Upload Field
interface WebflowImageFieldProps {
  control: Control<any>;
  name: string;
  label: string;
  required?: boolean;
  helperText?: string;
  multiple?: boolean;
  maxImages?: number;
  // New optional props for organized folder structure
  collectionType?: string; // e.g., 'team', 'events', 'news'
  slug?: string; // The item slug for folder organization
  preserveFormat?: boolean; // Whether to preserve original format
}

export function WebflowImageField({
  control,
  name,
  label,
  required = false,
  helperText,
  multiple = false,
  maxImages = 5,
  collectionType,
  slug,
  preserveFormat = false
}: WebflowImageFieldProps) {
  const [isUploading, setIsUploading] = useState(false);

  // Determine which API to use based on whether collection info is provided
  const useCollectionAPI = Boolean(collectionType && slug);

  if (multiple) {
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
                        <div className="h-[50px] max-h-[50px] bg-gray-700 rounded-lg overflow-hidden flex items-center justify-center">
                          {image.url ? (
                            <img
                              src={image.url}
                              alt={image.alt || `Image ${index + 1}`}
                              className="max-h-[50px] w-auto object-contain"
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

                {/* Add Image Button */}
                {(!field.value || field.value.length < maxImages) && (
                  <div>
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      disabled={isUploading}
                      className="hidden"
                      id={`${name}-upload`}
                      onChange={async (e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length === 0) return;

                        setIsUploading(true);
                        try {
                          if (useCollectionAPI) {
                            // Use collection-specific API
                            const CollectionAPI = (
                              await import('@/tip-tap/lib/collection-api')
                            ).default;
                            const uploadedURLs =
                              await CollectionAPI.uploadMultipleCollectionImages(
                                files,
                                collectionType!,
                                slug!,
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
                          } else {
                            // Use original API
                            const API = (await import('@/tip-tap/lib/api'))
                              .default;
                            const uploadPromises = files.map((file) =>
                              API.uploadImage(file)
                            );
                            const uploadedURLs =
                              await Promise.all(uploadPromises);

                            const newImages = uploadedURLs
                              .filter((url) => url)
                              .map((url) => ({ url, alt: '' }));

                            const currentImages = field.value || [];
                            const updatedImages = [
                              ...currentImages,
                              ...newImages
                            ].slice(0, maxImages);
                            field.onChange(updatedImages);
                          }
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
                      disabled={isUploading || (useCollectionAPI && !slug)}
                      onClick={() =>
                        document.getElementById(`${name}-upload`)?.click()
                      }
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {isUploading ? 'Uploading...' : 'Add Images'}
                    </Button>

                    {/* Show warning if using collection API but no slug */}
                    {useCollectionAPI && !slug && (
                      <p className="text-xs text-yellow-400">
                        ⚠️ Please save the item first to enable organized image
                        uploads
                      </p>
                    )}
                  </div>
                )}

                {/* Show folder structure info if using collection API */}
                {useCollectionAPI && slug && (
                  <div className="text-xs text-gray-500 break-all">
                    📁 Images will be stored at: collection/{collectionType}/
                    {slug}/
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

  // Single Image Upload
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
                  disabled={isUploading || (useCollectionAPI && !slug)}
                  className="hidden"
                  id={`${name}-upload`}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    setIsUploading(true);
                    try {
                      if (useCollectionAPI) {
                        // Use collection-specific API
                        const CollectionAPI = (
                          await import('@/tip-tap/lib/collection-api')
                        ).default;
                        const uploadedURL =
                          await CollectionAPI.uploadCollectionImage(
                            file,
                            collectionType!,
                            slug!,
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
                      } else {
                        // Use original API
                        const API = (await import('@/tip-tap/lib/api')).default;
                        const uploadedURL = await API.uploadImage(file);

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
                      }
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
                  disabled={isUploading || (useCollectionAPI && !slug)}
                  onClick={() =>
                    document.getElementById(`${name}-upload`)?.click()
                  }
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isUploading
                    ? 'Uploading...'
                    : field.value?.url
                      ? 'Replace Image'
                      : 'Upload Image'}
                </Button>

                {/* Show warning if using collection API but no slug */}
                {useCollectionAPI && !slug && (
                  <p className="text-xs text-yellow-400">
                    ⚠️ Please save the item first to enable organized image
                    uploads
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

                {/* Show folder structure info if using collection API */}
                {useCollectionAPI && slug && (
                  <div className="text-xs text-gray-500 break-all">
                    📁 Image will be stored at: collection/{collectionType}/
                    {slug}/
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

// Webflow-style Rich Text Field with TipTap Editor
interface WebflowRichTextFieldProps {
  control: Control<any>;
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  helperText?: string;
  minHeight?: string;
}

export function WebflowRichTextField({
  control,
  name,
  label,
  placeholder = 'Start writing...',
  required = false,
  helperText,
  minHeight = '200px'
}: WebflowRichTextFieldProps) {
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
          <FormControl>
            <div
              style={{ minHeight }}
              className="border border-gray-600 rounded-lg bg-gray-800 overflow-hidden"
            >
              <DarkModeSimpleEditor
                key={name}
                initialContent={field.value || ''}
                onChange={(content) => {
                  field.onChange(content);
                }}
              />
            </div>
          </FormControl>
          {helperText && <p className="text-xs text-gray-400">{helperText}</p>}
          <FormMessage className="text-red-400 text-xs" />
        </FormItem>
      )}
    />
  );
}

// Enhanced Webflow-style Image Field with Upload and Preview
interface WebflowAdvancedImageFieldProps {
  control: Control<any>;
  name: string;
  label: string;
  required?: boolean;
}

export function WebflowAdvancedImageField({
  control,
  name,
  label,
  required = false
}: WebflowAdvancedImageFieldProps) {
  const [preview, setPreview] = useState<string>('');

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
          <FormControl>
            <div className="space-y-3">
              <Input
                placeholder="Enter image URL"
                value={field.value?.url || ''}
                onChange={(e) => {
                  field.onChange({ ...field.value, url: e.target.value });
                  setPreview(e.target.value);
                }}
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 h-12"
              />
              <Button
                type="button"
                variant="outline"
                className="w-full bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Image
              </Button>
              {(preview || field.value?.url) && (
                <div className="relative">
                  <img
                    src={preview || field.value?.url}
                    alt="Preview"
                    className="h-[50px] max-h-[50px] w-auto object-contain rounded border border-gray-600"
                    onError={() => setPreview('')}
                  />
                </div>
              )}
            </div>
          </FormControl>
          <FormMessage className="text-red-400 text-xs" />
        </FormItem>
      )}
    />
  );
}

// Webflow-style Tags Field for Reference Items
interface WebflowTagsFieldProps {
  control: Control<any>;
  name: string;
  label: string;
  required?: boolean;
  helperText?: string;
  searchEndpoint?: string;
}

export function WebflowTagsField({
  control,
  name,
  label,
  required = false,
  helperText,
  searchEndpoint = '/api/collection-items?type=tag'
}: WebflowTagsFieldProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
          <FormControl>
            <div className="space-y-3">
              {/* Add Tag Input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Add tag..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (searchTerm.trim()) {
                        const newTag = {
                          id: searchTerm.toLowerCase().replace(/\s+/g, '-'),
                          slug: searchTerm.toLowerCase().replace(/\s+/g, '-')
                        };
                        const currentTags = field.value || [];
                        const tagExists = currentTags.some(
                          (tag: any) => tag.slug === newTag.slug
                        );

                        if (!tagExists) {
                          field.onChange([...currentTags, newTag]);
                        }
                        setSearchTerm('');
                      }
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                  onClick={() => {
                    if (searchTerm.trim()) {
                      const newTag = {
                        id: searchTerm.toLowerCase().replace(/\s+/g, '-'),
                        slug: searchTerm.toLowerCase().replace(/\s+/g, '-')
                      };
                      const currentTags = field.value || [];
                      const tagExists = currentTags.some(
                        (tag: any) => tag.slug === newTag.slug
                      );

                      if (!tagExists) {
                        field.onChange([...currentTags, newTag]);
                      }
                      setSearchTerm('');
                    }
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Current Tags */}
              {field.value && field.value.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {field.value.map((tag: any, index: number) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="bg-blue-900 text-blue-100 hover:bg-blue-800 px-3 py-1 flex items-center gap-1"
                    >
                      {tag.slug}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-blue-800"
                        onClick={() => {
                          const newTags = field.value.filter(
                            (_: any, i: number) => i !== index
                          );
                          field.onChange(newTags);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </FormControl>
          {helperText && <p className="text-xs text-gray-400">{helperText}</p>}
          <FormMessage className="text-red-400 text-xs" />
        </FormItem>
      )}
    />
  );
}

// New: Dynamic reference selector (fetches collection items and stores only slugs)
interface WebflowReferenceSelectFieldProps {
  control: Control<any>;
  name: string; // form field name
  label: string; // UI label
  collectionType: string; // e.g. 'programme', 'event', 'people', 'tag', 'source'
  multiple?: boolean; // multi-select
  required?: boolean;
  placeholder?: string;
  helperText?: string;
  statusFilter?: 'published' | 'all'; // default published
  disabled?: boolean;
  maxSelections?: number; // optional cap for multi
  allowClear?: boolean; // single select clear
  allowCreatePlaceholderItem?: boolean; // future option
}

interface FetchedCollectionItem {
  id: string;
  slug: string;
  title?: string;
  data?: Record<string, any>;
}

// Simple in-memory cache per session (type+status -> items)
const referenceCache: Record<string, FetchedCollectionItem[]> = {};
// External API base (must point to deployed backend with the database)
const EXTERNAL_API_BASE =
  process.env.NEXT_PUBLIC_EXTERNAL_API_BASE_URL ||
  'https://mnemo-app-e4f6j5kdsq-ew.a.run.app';

// Webflow Reference Select Field Component
export function WebflowReferenceSelectField({
  control,
  name,
  label,
  collectionType,
  multiple = false,
  required = false,
  placeholder = 'Select...',
  helperText,
  statusFilter = 'published',
  disabled = false,
  maxSelections,
  allowClear = true,
  allowCreatePlaceholderItem = false
}: WebflowReferenceSelectFieldProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<FetchedCollectionItem[]>([]);
  const [emptyMessage, setEmptyMessage] = useState<string | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const lastFetchedQuery = React.useRef<string>('');

  const cacheKey = `${collectionType}|${statusFilter}`;

  const mergeItems = React.useCallback((incoming: FetchedCollectionItem[]) => {
    setItems((prev) => {
      const map = new Map<string, FetchedCollectionItem>();
      [...prev, ...incoming].forEach((i) => {
        if (!map.has(i.slug)) map.set(i.slug, i);
        else {
          // prefer item with title/data
          const existing = map.get(i.slug)!;
          if (
            (!existing.title && i.title) ||
            (!existing.data && i.data) ||
            (JSON.stringify(existing.data || {}) === '{}' && i.data)
          ) {
            map.set(i.slug, i);
          }
        }
      });
      return Array.from(map.values());
    });
  }, []);

  // Map slug -> label for quick lookup
  const labelFor = React.useCallback(
    (slug: string): string => {
      const found = items.find((i) => i.slug === slug);
      if (!found) return slug; // fallback
      return (
        found.title ||
        (found.data && (found.data.name || found.data.title)) ||
        found.slug
      );
    },
    [items]
  );

  // Initial fetch with caching
  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      setEmptyMessage(null);
      try {
        if (referenceCache[cacheKey]) {
          mergeItems(referenceCache[cacheKey]);
          setLoading(false);
          return;
        }
        const qs = new URLSearchParams();
        qs.append('type', collectionType);
        if (statusFilter === 'published') qs.append('status', 'published');
        const res = await fetch(
          `${EXTERNAL_API_BASE}/api/collection-items?${qs.toString()}`
        );
        if (!res.ok) throw new Error('Failed to load items');
        const json = await res.json();
        if (!active) return;
        if (json.success && Array.isArray(json.collectionItems)) {
          const list = json.collectionItems as FetchedCollectionItem[];
          if (list.length === 0) {
            setEmptyMessage(
              `No items found for type "${collectionType}"${statusFilter === 'published' ? ' (published only)' : ''}.`
            );
          }
          setItems(list);
          referenceCache[cacheKey] = list;
        } else {
          throw new Error(json.error || 'Invalid response');
        }
      } catch (e: any) {
        if (!active) return;
        if (
          e.message.includes('relation') ||
          e.message.includes('does not exist')
        ) {
          setEmptyMessage(
            `Collection type "${collectionType}" is not implemented.`
          );
        } else {
          setError(e.message || 'Error fetching items');
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [collectionType, statusFilter, cacheKey, mergeItems]);

  // When field has selected slugs that are not yet in items, fetch them by slug list
  const preloadMissing = React.useCallback(
    async (slugs: string[]) => {
      const missing = slugs.filter((s) => !items.some((i) => i.slug === s));
      if (missing.length === 0) return;
      try {
        const qs = new URLSearchParams();
        qs.append('type', collectionType);
        qs.append('slugs', missing.join(','));
        if (statusFilter === 'published') qs.append('status', 'published');
        const res = await fetch(
          `${EXTERNAL_API_BASE}/api/collection-items?${qs.toString()}`
        );
        if (!res.ok) return;
        const json = await res.json();
        if (json.success && Array.isArray(json.collectionItems)) {
          mergeItems(json.collectionItems as FetchedCollectionItem[]);
        }
      } catch (err) {
        // silent
      }
    },
    [collectionType, statusFilter, items, mergeItems]
  );

  // Server-side search (debounced)
  useEffect(() => {
    if (!open) return; // only search when dropdown open
    const term = search.trim();
    if (term.length === 0) return; // skip empty -> rely on cached initial list
    const key = `${cacheKey}|search:${term}`;
    if (lastFetchedQuery.current === key) return; // avoid duplicates
    const handle = setTimeout(async () => {
      lastFetchedQuery.current = key;
      setLoading(true);
      try {
        const qs = new URLSearchParams();
        qs.append('type', collectionType);
        qs.append('search', term);
        if (statusFilter === 'published') qs.append('status', 'published');
        const res = await fetch(
          `${EXTERNAL_API_BASE}/api/collection-items?${qs.toString()}`
        );
        if (!res.ok) throw new Error('Search failed');
        const json = await res.json();
        if (json.success && Array.isArray(json.collectionItems)) {
          mergeItems(json.collectionItems as FetchedCollectionItem[]);
        }
      } catch (e) {
        // ignore search errors silently
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [search, open, cacheKey, collectionType, statusFilter, mergeItems]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [open]);

  // Filter items client-side for instant feedback (includes searched merges)
  const filtered = items.filter((i) => {
    const label = labelFor(i.slug).toLowerCase();
    const term = search.toLowerCase();
    return !term || label.includes(term) || i.slug.toLowerCase().includes(term);
  });

  const toggleSlug = (value: string[], slug: string): string[] => {
    if (value.includes(slug)) {
      return value.filter((s) => s !== slug);
    }
    if (maxSelections && value.length >= maxSelections) return value; // cap
    return [...value, slug];
  };

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const currentValue = field.value || (multiple ? [] : '');
        const selectedSlugs: string[] = multiple
          ? (currentValue as string[])
          : currentValue
            ? [currentValue as string]
            : [];

        // Preload any missing selected slugs
        useEffect(() => {
          if (selectedSlugs.length > 0) preloadMissing(selectedSlugs);
        }, [selectedSlugs, preloadMissing]);

        return (
          <FormItem className="space-y-3" ref={containerRef}>
            <FormLabel className="text-sm font-medium text-white flex items-center gap-1">
              {label}
              {required && <span className="text-red-500">*</span>}
            </FormLabel>
            <FormControl>
              <div className="relative">
                {/* Display area */}
                <div
                  className={
                    'min-h-[46px] w-full flex items-center flex-wrap gap-2 rounded-lg border px-3 py-2 cursor-pointer bg-gray-800 border-gray-600 hover:border-gray-500 ' +
                    (disabled ? 'opacity-60 cursor-not-allowed' : '')
                  }
                  onClick={() => !disabled && setOpen((o) => !o)}
                >
                  {multiple ? (
                    selectedSlugs.length > 0 ? (
                      selectedSlugs.map((slug) => (
                        <Badge
                          key={slug}
                          variant="secondary"
                          className="bg-blue-900 text-blue-100 hover:bg-blue-800 px-2 py-1 flex items-center gap-1"
                        >
                          {labelFor(slug)}
                          <button
                            type="button"
                            className="ml-1 text-blue-300 hover:text-white"
                            onClick={(e) => {
                              e.stopPropagation();
                              const newVal = selectedSlugs.filter(
                                (s) => s !== slug
                              );
                              field.onChange(newVal);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400">
                        {placeholder}
                      </span>
                    )
                  ) : selectedSlugs.length === 1 ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white truncate">
                        {labelFor(selectedSlugs[0])}
                      </span>
                      {allowClear && !disabled && (
                        <button
                          type="button"
                          className="text-gray-400 hover:text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            field.onChange('');
                          }}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">{placeholder}</span>
                  )}

                  <div className="ml-auto flex items-center gap-2 text-gray-400">
                    {loading && (
                      <svg
                        className="animate-spin h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          d="M4 12a8 8 0 018-8"
                          strokeWidth="4"
                          strokeLinecap="round"
                        ></path>
                      </svg>
                    )}
                    <svg
                      className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>

                {/* Dropdown */}
                {open && !disabled && (
                  <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-700 bg-gray-800 shadow-lg max-h-80 overflow-hidden">
                    <div className="p-2 border-b border-gray-700">
                      <input
                        autoFocus
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search..."
                        className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="max-h-64 overflow-y-auto custom-scrollbar">
                      {error && (
                        <div className="px-3 py-2 text-xs text-red-400">
                          {error}
                        </div>
                      )}
                      {emptyMessage && !error && (
                        <div className="px-3 py-2 text-xs text-amber-400 whitespace-pre-line">
                          {emptyMessage}
                        </div>
                      )}
                      {!error &&
                        !emptyMessage &&
                        filtered.length === 0 &&
                        !loading && (
                          <div className="px-3 py-2 text-xs text-gray-400">
                            No results
                          </div>
                        )}
                      {!error &&
                        !emptyMessage &&
                        filtered.map((item) => {
                          const slug = item.slug;
                          const selected = selectedSlugs.includes(slug);
                          return (
                            <button
                              type="button"
                              key={slug}
                              className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-gray-700 focus:bg-gray-700 transition-colors ${selected ? 'bg-gray-700' : ''}`}
                              onClick={() => {
                                if (multiple) {
                                  const newArray = toggleSlug(
                                    selectedSlugs,
                                    slug
                                  );
                                  field.onChange(newArray);
                                } else {
                                  field.onChange(slug);
                                  setOpen(false);
                                }
                              }}
                            >
                              {multiple && (
                                <span
                                  className={`h-3 w-3 rounded-sm border flex items-center justify-center text-[10px] ${selected ? 'bg-blue-600 border-blue-500' : 'border-gray-500'}`}
                                >
                                  {selected && '✓'}
                                </span>
                              )}
                              <span className="truncate flex-1 text-white">
                                {labelFor(slug)}
                              </span>
                              <span className="text-xs text-gray-500">
                                {slug}
                              </span>
                            </button>
                          );
                        })}
                    </div>
                    {multiple && !error && !emptyMessage && (
                      <div className="p-2 border-t border-gray-700 flex justify-between text-xs text-gray-400">
                        <span>
                          {selectedSlugs.length} selected
                          {maxSelections && ` / ${maxSelections}`}
                        </span>
                        <button
                          type="button"
                          className="hover:text-white"
                          onClick={() => field.onChange([])}
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </FormControl>
            {helperText && (
              <p className="text-xs text-gray-400 leading-relaxed">
                {helperText}
              </p>
            )}
            <FormMessage className="text-red-400 text-xs" />
          </FormItem>
        );
      }}
    />
  );
}
