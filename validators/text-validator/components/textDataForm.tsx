'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '../../../components/ui/button';

import { Input } from '@/components/ui/input';

import { useEffect, useRef, useState } from 'react';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { BlockType } from 'app/page-editor/type';
import { getSemanticLabel } from 'app/page-editor/utils/getSemanticLabel';
import Editor from 'app/page-editor/editor-page';
import BlockEditorV2 from '@/tip-tap/components/BlockEditor/BlockEditorV2';
import { useCollaboration } from '@/tip-tap/hooks/useCollaboration';
import { useSearchParams } from 'next/navigation';
import { useBlockEditor } from '@/tip-tap/hooks/useBlockEditor';
import { EditorContent } from '@tiptap/react';
import { ContentItemMenu } from '@/tip-tap/components/menus/ContentItemMenu';
import { LinkMenu, TextMenu } from '@/tip-tap/components/menus';
import { ColumnsMenu } from '@/tip-tap/extensions/MultiColumn/menus';
import {
  TableColumnMenu,
  TableRowMenu
} from '@/tip-tap/extensions/Table/menus';
import { ImageBlockMenu } from '@/tip-tap/extensions/ImageBlock/components/ImageBlockMenu';
import API from '@/tip-tap/lib/api';
import { SimpleEditor } from 'app/page-editor/@/components/tiptap-templates/simple/simple-editor';

// ✅ Define the schema for text data
const formSchema = z.object({
  name: z.string().min(2, { message: 'Name is required.' }),
  data: z.string().min(1, { message: 'Text content is required.' }).trim(),
  editor: z.string().min(2, { message: 'Editor name is required.' }),
  keywords: z.string().optional(), // Will be converted into an array
  datePublished: z.string().optional(), // Optional but should be a valid date if provided
  programmeId: z.string().min(1, { message: 'Please select a programme.' }),
  type: z.enum([
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'p',
    'img',
    'ul',
    'youtube',
    'button',
    'link',
    'video',
    'rich-text',
    'embed'
  ] as [BlockType, ...BlockType[]])
});

export function TextDataForm({ id }: { id?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataChunk, setDataChunk] = useState<any | null>(null);
  const [initialContent, setInitialContent] = useState<any | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [programmes, setProgrammes] = useState<{ id: string; title: string }[]>(
    []
  );
  const menuContainerRef = useRef(null);
  const searchParams = useSearchParams();
  const [isEditable, setIsEditable] = useState(true);
  const params = { room: searchParams.get('room') };
  const providerState = useCollaboration({
    docId: params.room || 'default',
    enabled: parseInt(searchParams?.get('noCollab') as string) !== 1
  });
  const aiToken = 'nbul';
  const { editor, users, collabState } = useBlockEditor({
    aiToken,

    ydoc: providerState.yDoc,
    provider: providerState.provider,

    onTransaction({ editor: currentEditor }) {
      setIsEditable(currentEditor.isEditable);
    }
  });

  const isEditMode = !!dataChunk;
  useEffect(() => {
    async function fetchProgrammes() {
      try {
        const res = await fetch(
          'https://mnemo-app-100166227581.europe-west1.run.app/programmes'
        );
        const data = await res.json();
        if (data.success) {
          // Extract only the id and title from each programme
          const programmes = data.programmes.map(
            (programme: { id: any; title: any }) => ({
              id: programme.id,
              title: programme.title
            })
          );
          setProgrammes(programmes);
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
      name: '',
      data: '',
      editor: '',
      keywords: '',
      datePublished: '',
      programmeId: '',
      type: 'p'
    }
  });

  const forceEditorReinitialization = (editor: any) => {
    if (!editor) return;

    console.log('Forcing editor reinitialization...');

    // Force editor to be editable
    editor.setEditable(true);

    // Focus the editor
    editor.commands.focus('end');

    // Get the current content and reset it to force a full re-render
    const currentContent = editor.getHTML();

    // Setting content with a slight delay helps with initialization issues
    setTimeout(() => {
      // First clear the content
      editor.commands.clearContent();

      // Then set it back
      editor.commands.setContent(currentContent);

      // Focus again after content is reset
      editor.commands.focus('end');

      console.log('Editor reinitialized with content:', currentContent);
    }, 50);
  };

  // Modify your fetchDataChunk function inside the useEffect
  useEffect(() => {
    if (!id) return;

    async function fetchDataChunk() {
      try {
        const res = await fetch(
          `https://mnemo-app-100166227581.europe-west1.run.app/data-chunks/${id}`
        );
        const data = await res.json();
        if (data.success && data.dataChunk) {
          setDataChunk(data.dataChunk);
          if (data.dataChunk.type === 'rich-text') {
            // Store the content but don't set initialContent yet
            // We'll do this after resetting the form
            const richTextContent = data.dataChunk.data;

            // Reset the form first
            form.reset({
              name: data.dataChunk.name || '',
              data: data.dataChunk.data || '',
              editor: data.dataChunk.metaData?.editor || '',
              keywords: (data.dataChunk.metaData?.keywords || []).join(', '),
              datePublished: data.dataChunk.metaData?.datePublished || '',
              programmeId: data.dataChunk.programmeId || '',
              type: data.dataChunk.type || 'p'
            });

            // Then set initialContent with a slight delay
            // This helps avoid race conditions with form resets
            setTimeout(() => {
              setInitialContent(richTextContent);
            }, 50);
          } else {
            // For non-rich-text types, just reset the form
            form.reset({
              name: data.dataChunk.name || '',
              data: data.dataChunk.data || '',
              editor: data.dataChunk.metaData?.editor || '',
              keywords: (data.dataChunk.metaData?.keywords || []).join(', '),
              datePublished: data.dataChunk.metaData?.datePublished || '',
              programmeId: data.dataChunk.programmeId || '',
              type: data.dataChunk.type || 'p'
            });
          }
        }
      } catch (err) {
        console.error('❌ Failed to fetch data chunk:', err);
      }
    }

    fetchDataChunk();
  }, [id, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    const contentHTML = editor.getHTML();
    console.log('Editor content:', contentHTML);
    const payload = {
      data: values.data,
      name: values.name,
      type: values.type,
      metaData: {
        editor: values.editor,
        keywords: (values.keywords || '').split(',').map((k) => k.trim()),
        datePublished: values.datePublished
      },
      programmeId: values.programmeId
    };
    const baseUrl = 'https://mnemo-app-100166227581.europe-west1.run.app';

    const endpoint = isEditMode
      ? `${baseUrl}/data-chunks/${dataChunk.id}` // PUT endpoint
      : `${baseUrl}/data-chunks`; // POST endpoint

    const method = isEditMode ? 'PUT' : 'POST';
    try {
      const response = await fetch(endpoint, {
        method: method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to save text data.');
      }

      isEditMode
        ? setSuccess('Text data successfully updated!')
        : setSuccess('Text data successfully saved!');
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 z-50">
        <input type="hidden" {...form.register('type')} value="text" />
        {/* ✅ Text Content */}
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
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content Type</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select content type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {(
                    [
                      'h1',
                      'h2',
                      'h3',
                      'h4',
                      'h5',
                      'h6',
                      'p',
                      'ul',
                      'youtube',
                      'button',
                      'link',
                      'video',
                      'rich-text',
                      'img',
                      'embed'
                    ] as BlockType[]
                  ).map((type) => (
                    <SelectItem key={type} value={type}>
                      {getSemanticLabel(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="data"
          render={({ field }) => {
            const currentType = form.watch('type');

            // Parse existing JSON if available for button/link
            let parsed: any = {};
            try {
              parsed = JSON.parse(field.value);
            } catch {}

            return (
              <FormItem>
                <FormLabel>Content</FormLabel>
                <FormControl>
                  <>
                    {['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p'].includes(
                      currentType
                    ) && (
                      <Textarea placeholder="Write your text..." {...field} />
                    )}

                    {currentType === 'ul' && (
                      <Textarea
                        placeholder="List items separated by commas"
                        {...field}
                      />
                    )}

                    {currentType === 'youtube' && (
                      <Textarea
                        placeholder="Paste YouTube video ID"
                        {...field}
                      />
                    )}
                    {currentType === 'embed' && (
                      <Textarea
                        placeholder="Paste embed HTML or iframe code"
                        {...field}
                      />
                    )}
                    {currentType === 'img' && (
                      <div className="space-y-4">
                        {/* Image Upload */}
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;

                            // Optional: show preview (up to you)
                            const uploadedURL = await API.uploadImage(file);
                            if (!uploadedURL) {
                              alert('Upload failed. Try again.');
                              return;
                            }

                            const updated = {
                              ...parsed,
                              url: uploadedURL,
                              alt: parsed.alt || ''
                            };
                            field.onChange(JSON.stringify(updated));
                          }}
                        />

                        {/* Alt Text */}
                        <Input
                          placeholder="Image description (alt text)"
                          value={parsed.alt || ''}
                          onChange={(e) => {
                            const updated = {
                              ...parsed,
                              alt: e.target.value
                            };
                            field.onChange(JSON.stringify(updated));
                          }}
                        />

                        {/* Optional image preview */}
                        {parsed.url && (
                          <img
                            src={parsed.url}
                            alt="Uploaded preview"
                            className="mt-2 h-[50px] max-h-[50px] w-auto object-contain rounded-md"
                          />
                        )}
                      </div>
                    )}
                    {currentType === 'rich-text' && (
                      <SimpleEditor
                        initialContent={initialContent || field.value}
                        onChange={(content) => {
                          field.onChange(content);
                        }}
                      />
                    )}

                    {/* {currentType === 'rich-text' && (
                      <div className="relative flex flex-col flex-1 h-[300px] overflow-hidden" ref={menuContainerRef}>
                        
             
                        <EditorContent
                          editor={editor}
                          className="flex-1 overflow-y-auto"
                        />
                        <ContentItemMenu
                          editor={editor}
                          isEditable={isEditable}
                        />
                        <LinkMenu editor={editor} appendTo={menuContainerRef} />
                        <TextMenu editor={editor}  />
                        <ColumnsMenu
                          editor={editor}
                          appendTo={menuContainerRef}
                        />
                        <TableRowMenu
                          editor={editor}
                          appendTo={menuContainerRef}
                        />
                        <TableColumnMenu
                          editor={editor}
                          appendTo={menuContainerRef}
                        />
                        <ImageBlockMenu
                          editor={editor}
                          appendTo={menuContainerRef}
                        />
                      </div>
                    )} */}
                    {['button', 'link'].includes(currentType) && (
                      <div className="space-y-2">
                        <Input
                          placeholder="Label"
                          value={parsed.label || ''}
                          onChange={(e) => {
                            const updated = {
                              ...parsed,
                              label: e.target.value
                            };
                            field.onChange(JSON.stringify(updated));
                          }}
                        />
                        <Input
                          placeholder="URL"
                          value={parsed.url || ''}
                          onChange={(e) => {
                            const updated = {
                              ...parsed,
                              url: e.target.value
                            };
                            field.onChange(JSON.stringify(updated));
                          }}
                        />
                        <Select
                          value={parsed.target || '_self'}
                          onValueChange={(value) => {
                            const updated = {
                              ...parsed,
                              target: value
                            };
                            field.onChange(JSON.stringify(updated));
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Open in..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="_self">Same Tab</SelectItem>
                            <SelectItem value="_blank">New Tab</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </>
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />

        {/* ✅ Editor Name */}
        <FormField
          control={form.control}
          name="editor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Editor Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ✅ Keywords (comma-separated) */}
        <FormField
          control={form.control}
          name="keywords"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Keywords (comma-separated)</FormLabel>
              <FormControl>
                <Input placeholder="example, text, data" {...field} />
              </FormControl>
              <FormDescription>Separate keywords with commas.</FormDescription>
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
        <FormField
          control={form.control}
          name="programmeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Programme</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a programme" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {programmes.map((programme) => (
                    <SelectItem key={programme.id} value={programme.id}>
                      {programme.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ✅ Submit Button */}
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Submit'}
        </Button>

        {/* ✅ Display Success or Error Messages */}
        {error && <p className="text-red-500">{error}</p>}
        {success && <p className="text-green-500">{success}</p>}
      </form>
    </Form>
  );
}
