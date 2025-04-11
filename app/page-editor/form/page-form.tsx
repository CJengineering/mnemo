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
import { mapData } from '@/validators/page-validator/mapData';
import { DroppedItem } from '../type';
import { generateHtml } from '../utils/generateHtml';

// 👇 Accept items from your editor
export function PageForm({ items }: { items: DroppedItem[] }) {
  const formSchema = z.object({
    slug: z.string().min(2, { message: 'Slug must be at least 2 characters.' }),
    title: z.string().min(2, { message: 'Title is required.' }),
    description: z
      .string()
      .min(5, { message: 'Description must be at least 5 characters.' }),
    keywords: z.string().optional()
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      slug: '',
      title: '',
      description: '',
      keywords: ''
    }
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const parsedItems = mapData(items); // ✅ Validate dropped items
      const html = generateHtml(parsedItems); // ✅ Generate HTML

      const payload = {
        slug: values.slug,
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

      const res = await fetch('/api/page', {
        method: 'POST',
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

  return (
    <div className="bg-white p-6 rounded-md border mb-8 ">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="">
          <div className="flex  space-x-3">
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. tim/test/test" {...field} />
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
                    <Input placeholder="Page title..." {...field} />
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
                    <Input placeholder="Describe this page..." {...field} />
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
                    <Input
                      placeholder="comma, separated, keywords"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className='py-4'></div>
          <Button
            type="submit"
            className="md:col-span-2 w-fit bg-green-600 hover:bg-green-700"
          >
            Save Page
          </Button>
        </form>
      </Form>
    </div>
  );
}
