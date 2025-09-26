'use client';

import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue
} from '@/components/ui/select';

import { useEffect } from 'react';
import API from '@/tip-tap/lib/api';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name is required.' }),
  alt: z.string().min(2, { message: 'Alt text is required.' }),
  file: z.instanceof(File).optional(), // Optional file field
  editor: z.string().min(2, { message: 'Editor name is required.' }),
  keywords: z.string().optional(), // Comma-separated keywords
  datePublished: z.string().optional(),
  website: z.string().url().optional(),
  programmeId: z.string().optional() // Programme selection
});

export function ImageDataForm({ existingData }: { existingData?: any }) {
  const [imageURL, setImageURL] = useState<string | null>(
    existingData?.data?.url || null
  );
  const [preview, setPreview] = useState<string | null>(
    existingData?.data?.url || null
  );
  const [programmes, setProgrammes] = useState<{ id: string; name: string }[]>(
    []
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isEdit = Boolean(existingData);
  useEffect(() => {
    async function fetchProgrammes() {
      try {
        const res = await fetch('/api/programmes');
        const data = await res.json();
        if (data.success) {
          setProgrammes(data.programmes);
        }
      } catch (error) {
        console.error('Error fetching programmes:', error);
      }
    }
    fetchProgrammes();
  }, []);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: existingData?.name || '',
      alt: existingData?.data?.alt || '',
      editor: existingData?.metaData?.editor || '',
      keywords: existingData?.metaData?.keywords?.join(', ') || '',
      datePublished: existingData?.metaData?.datePublished || '',
      website: existingData?.metaData?.website || '',
      programmeId: existingData?.programmeId || ''
    }
  });

  async function onSubmit(values: any) {
    try {
      let uploadedURL = imageURL;
      if (values.file) {
        console.log('🟡 File detected:', values.file);

        if (!(values.file instanceof File)) {
          console.error('❌ values.file is NOT a File object:', values.file);
          alert('Invalid file selection. Please re-upload.');
          return;
        }

        console.log('🟡 Uploading image...');
        uploadedURL = await API.uploadImage(values.file);

        console.log('🟢 Uploaded image URL:', uploadedURL);

        if (!uploadedURL) {
          console.error('❌ Image upload failed. URL is null.');
          alert('Image upload failed. Please try again.');
          return;
        }

        setImageURL(uploadedURL);
      } else {
        console.warn('⚠️ No file selected for upload.');
      }

      console.log('🟡 Proceeding with form submission...');

      const payload = {
        type: 'image',
        name: values.name,
        data: { url: uploadedURL, alt: values.alt },
        metaData: {
          editor: values.editor,
          keywords: values.keywords.split(',').map((k: string) => k.trim()),
          datePublished: values.datePublished || null,
          website: values.website || null
        },
        programmeId: values.programmeId || null
      };

      const response = await fetch(
        isEdit ? `/api/data-chunk/${existingData.id}` : '/api/data-chunk',
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save data chunk.');
      }
      setSuccessMessage('Image saved successfully!');
      console.log('Image saved successfully!');
      console.log('Image saved successfully!', payload);
      form.reset();
      setPreview(null);
      setImageURL(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error saving image:', error);
    }
  }
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      console.log('🟢 File selected:', file);

      setPreview(URL.createObjectURL(file)); // Show preview
      form.setValue('file', file); // ✅ Store file in form state
      form.trigger('file'); // ✅ Trigger validation update
    } else {
      console.warn('⚠️ No file selected.');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* ✅ Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ✅ Image Upload */}
        <FormField
          control={form.control}
          name="file"
          render={({ field: { onChange } }) => (
            <FormItem>
              <FormLabel>Upload Image</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                />
              </FormControl>
              {preview && (
                <img
                  src={preview}
                  alt="Preview"
                  className="mt-2 h-[50px] max-h-[50px] w-auto object-contain rounded-md"
                />
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ✅ Image Alt Text */}
        <FormField
          control={form.control}
          name="alt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Alt Text</FormLabel>
              <FormControl>
                <Input placeholder="Enter image description" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ✅ Editor */}
        <FormField
          control={form.control}
          name="editor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Editor</FormLabel>
              <FormControl>
                <Input placeholder="Editor name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ✅ Keywords */}
        <FormField
          control={form.control}
          name="keywords"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Keywords (comma-separated)</FormLabel>
              <FormControl>
                <Input placeholder="AI, Research, Science" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ✅ Date Published */}
        <FormField
          control={form.control}
          name="datePublished"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date Published</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ✅ Website */}
        <FormField
          control={form.control}
          name="website"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Website</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ✅ Programme Selection */}
        <FormField
          control={form.control}
          name="programmeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Programme</FormLabel>
              <FormControl>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a programme" />
                  </SelectTrigger>
                  <SelectContent>
                    {programmes.map((programme) => (
                      <SelectItem key={programme.id} value={programme.id}>
                        {programme.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ✅ Submit Button */}
        <Button type="submit">Save Image</Button>
      </form>
      {successMessage && (
        <div className="text-green-600 font-medium">{successMessage}</div>
      )}
    </Form>
  );
}
