'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

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
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

import { mapData } from '@/validators/page-validator/mapData';
import { DroppedItem } from '../type';
import { generateHtml } from '../utils/generateHtml';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useMnemo } from '@/components/mnemo-context/mnemo-context';

const formSchema = z.object({
  section: z.enum(['discover', 'programme']),
  slug: z.string().min(2, { message: 'Slug must be at least 2 characters.' }),
  title: z.string().min(2, { message: 'Title is required.' }),
  description: z.string().min(5, { message: 'Description must be at least 5 characters.' }),
  keywords: z.string().optional()
});

export function PageForm({ items }: { items: DroppedItem[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { pages } = useMnemo();
  const [matchedPage, setMatchedPage] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      section: 'discover',
      slug: '',
      title: '',
      description: '',
      keywords: ''
    }
  });

  const editingSlug = searchParams.get('page');

  useEffect(() => {
    // Reset loading state when the component mounts or when params change
    setIsLoading(true);
    
    // No need to load if we're not editing
    if (!editingSlug) {
      setIsLoading(false);
      return;
    }
    
    // Debug logs
    console.log('Pages from context:', pages);
    console.log('Editing slug from URL param:', editingSlug);
    
    if (pages.length > 0) {
      // Decode the URL parameter first
      const decodedSlug = decodeURIComponent(editingSlug);
      console.log('Decoded editing slug:', decodedSlug);
      
      // Try multiple formats
      const normalizedSlug = decodedSlug.startsWith('/') ? decodedSlug : `/${decodedSlug}`;

      // Find the page
      const found = pages.find((p) => p.slug === normalizedSlug);
      
      console.log('Found page:', found);
      
      if (found) {
        setMatchedPage(found);
        
        // Parse the slug to get section and page slug
        const segments = found.slug.replace(/^\//, '').split('/');
        const section = segments[0];
        const pageSlug = segments.slice(1).join('/');
        
        // Debug logs for SEO data
        console.log('Found page data:', found);
        console.log('dataSeo object:', found.data_seo);
        
        // Need to check if dataSeo exists first to avoid potential errors
        const seoData = found.data_seo || {};
        
        // Reset the form with the found data - ensure we use empty strings as fallbacks
        form.reset({
          section: section as 'discover' | 'programme',
          slug: pageSlug,
          title: seoData.title || '',
          description: seoData.description || '',
          keywords: Array.isArray(seoData.keywords) ? seoData.keywords.join(', ') : ''
        });
      } else {
        console.warn(`Page with slug "${normalizedSlug}" not found in pages array`);
        console.log('Available slugs:', pages.map(p => p.slug));
      }
    } else {
      console.warn('Pages array is empty');
    }
    
    // End loading regardless of result
    setIsLoading(false);
  }, [editingSlug, pages, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const parsedItems = mapData(items);
      const html = generateHtml(parsedItems);
      const fullSlug = `/${values.section}/${values.slug}`;

      const payload = {
        slug: fullSlug,
        data: parsedItems,
        dataHtml: { rawHtml: html },
        dataSeo: {
          title: values.title,
          description: values.description,
          keywords: values.keywords
            ? values.keywords.split(',').map((k) => k.trim().toLowerCase())
            : []
        }
      };

      // If editing an existing page, make sure to preserve the original ID
    

      const res = await fetch(`https://mnemo-app-100166227581.europe-west1.run.app/pages`, {
        method: editingSlug ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await res.json();

      if (!res.ok) throw new Error(result.error);
      alert('✅ Page saved successfully!');
      console.log(result.page);
    } catch (err: any) {
      console.error(err);
      alert('❌ Failed to save page: ' + err.message);
    }
  };

  const handleDelete = async () => {
    if (!editingSlug) return;
    const confirmed = confirm('Are you sure you want to delete this page?');
    if (!confirmed) return;
  
    try {
      // Use exactly what we have in the URL parameter
      // This would match if your routes are set up to use the same parameter
      const slugToDelete = editingSlug;
      console.log('Using slug directly from URL:', slugToDelete);
      
      const res = await fetch(`https://mnemo-app-100166227581.europe-west1.run.app/pages/${encodeURIComponent(slugToDelete)}`, {
        method: 'DELETE'
      });
  
      if (!res.ok) {
        const error = await res.text();
        throw new Error(`Failed to delete: ${error}`);
      }
  
      alert('🗑️ Page deleted successfully');
      window.location.href = '/page-editor-test';
    } catch (err: any) {
      console.error(err);
      alert('❌ Failed to delete page: ' + err.message);
    }
  };
  // Add better loading and error states
  if (editingSlug && isLoading) {
    return <div className="p-6 text-gray-600">Loading form data...</div>;
  }

  if (editingSlug && !isLoading && !matchedPage) {
    return (
      <div className="p-6 text-red-600">
        <div>Could not find page with slug: {editingSlug}</div>
        <div className="mt-2">Possible issues:</div>
        <ul className="list-disc ml-6 mt-1 mb-4">
          <li>The slug format in the URL may not match the database format</li>
          <li>The page may not exist in the database</li>
          <li>The pages data may not be loaded yet</li>
        </ul>
        <Button 
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => router.push('/page-editor-test')}
        >
          Return to Editor
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-md border mb-8">
      <Form key={searchParams.toString()} {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="flex space-x-3">
            <FormField
              control={form.control}
              name="section"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Section</FormLabel>
                  <Select
                    key={searchParams.toString()}
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Choose section" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="discover">/discover</SelectItem>
                      <SelectItem value="programme">/programme</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Page Slug</FormLabel>
                  <FormControl>
                    <Input key={searchParams.toString()} placeholder="my-page-slug" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SEO Title</FormLabel>
                  <FormControl>
                    <Input key={searchParams.toString()} placeholder="Page title..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>SEO Description</FormLabel>
                  <FormControl>
                    <Input key={searchParams.toString()} placeholder="Describe this page..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="keywords"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>SEO Keywords</FormLabel>
                  <FormControl>
                    <Input key={searchParams.toString()} placeholder="comma, separated, keywords" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="py-4 flex gap-4">
            <Button
              type="submit"
              className="md:col-span-2 w-fit bg-green-600 hover:bg-green-700"
            >
              {editingSlug ? 'Update Page' : 'Save Page'}
            </Button>

            {editingSlug && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
              >
                Delete Page
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}