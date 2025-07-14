import { EditorContent } from '@tiptap/react';
import React, { useEffect, useRef, useState } from 'react';

import { useBlockEditor } from '../../hooks/useBlockEditor';

import '@/tip-tap/styles/index.css';

import ImageBlockMenu from '../../extensions/ImageBlock/components/ImageBlockMenu';
import { ColumnsMenu } from '../../extensions/MultiColumn/menus';
import { TableColumnMenu, TableRowMenu } from '../../extensions/Table/menus';

import { TextMenu } from '../menus/TextMenu';
import { ContentItemMenu } from '../menus/ContentItemMenu';
import { useSidebar } from '../../hooks/useSidebar';
import * as Y from 'yjs';
import { TiptapCollabProvider } from '@hocuspocus/provider';
import { LinkMenu } from '../menus';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
type Programme = {
  id: string;
  name: string;
};
export const BlockEditorV2 = ({
  aiToken,
  ydoc,
  provider,
  dataChunkId // ✅ New: Pass `dataChunkId` to update an existing entry
}: {
  aiToken?: string;
  ydoc: Y.Doc | null;
  provider?: TiptapCollabProvider | null | undefined;
  dataChunkId?: string | null;
}) => {
  const [isEditable, setIsEditable] = useState(true);
  const [loading, setLoading] = useState(false);
  const menuContainerRef = useRef(null);

  const [name, setName] = useState('');
  const [editorName, setEditorName] = useState('');
  const [keywords, setKeywords] = useState('');
  const [programmeId, setProgrammeId] = useState('');
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [datePublished, setDatePublished] = useState<string | null>(null);
  const [website, setWebsite] = useState<string | null>(null);

  const leftSidebar = useSidebar();
  const { editor, users, collabState } = useBlockEditor({
    aiToken,
    ydoc,
    provider,
    onTransaction({ editor: currentEditor }) {
      setIsEditable(currentEditor.isEditable);
    }
  });

  // ✅ Load existing data chunk content if updating
  useEffect(() => {
    if (!dataChunkId || !editor) return;

    const fetchContent = async () => {
      try {
        const res = await fetch(`/api/data-chunk/${dataChunkId}`);
        if (!res.ok) throw new Error('Failed to fetch data chunk.');
        const {
          data,
          name,
          editor: existingEditor,
          keywords,
          programmeId
        } = await res.json();

        editor.commands.setContent(data);
        setName(name);
        setEditorName(existingEditor);
        setKeywords(keywords ? keywords.join(', ') : '');
        setProgrammeId(programmeId || '');
      } catch (error) {
        console.error('Error loading content:', error);
      }
    };

    fetchContent();
  }, [dataChunkId, editor]);
  useEffect(() => {
    const fetchProgrammes = async () => {
      try {
        const res = await fetch(
          'https://mnemo-app-e4f6j5kdsq-ew.a.run.app/api/collection-items?type=programme'
        );
        if (!res.ok) throw new Error('Failed to fetch programmes.');
        const json = await res.json();
        // Transform collection items to match expected programme format
        const programmes =
          json.collectionItems?.map((item: any) => ({
            id: item.id,
            title: item.title,
            slug: item.slug,
            status: item.status,
            ...item.data
          })) || [];
        setProgrammes(programmes);
      } catch (error) {
        console.error('Error fetching programmes:', error);
      }
    };

    fetchProgrammes();
  }, []);

  console.log('BlockEditor', editor?.getJSON());

  // ✅ Save or Update content
  const saveContent = async () => {
    if (!editor) return;
    setLoading(true);

    const contentHTML = editor.getHTML(); // Get editor content as HTML

    try {
      const url = dataChunkId
        ? `/api/data-chunk/${dataChunkId}`
        : '/api/data-chunk';
      const method = dataChunkId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'rich_text',
          data: contentHTML, // HTML content from TipTap editor
          name, // Title or name of the entry
          programmeId: programmeId || null, // Programme association (optional)
          metaData: {
            // Move metadata inside `metaData`
            editor: editorName,
            keywords: keywords.split(',').map((k) => k.trim()), // Ensure keywords are an array
            datePublished: datePublished || null, // Keep null if not provided
            website: website ? website.trim() : null // Optional website field
          }
        })
      });

      const result = await response.json();
      console.log('Server response:', result);

      if (!response.ok) {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Failed to save content:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!editor || !users) {
    return null;
  }

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      {/* ✅ Metadata Fields */}
      <Input
        type="text"
        placeholder="Enter Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Input
        type="text"
        placeholder="Editor Name"
        value={editorName}
        onChange={(e) => setEditorName(e.target.value)}
      />
      <Input
        type="date"
        value={datePublished || ''}
        onChange={(e) => setDatePublished(e.target.value)}
      />
      <Input
        type="text"
        placeholder="Website"
        value={website || ''}
        onChange={(e) => setWebsite(e.target.value)}
      />
      <Input
        type="text"
        placeholder="Keywords (comma-separated)"
        value={keywords}
        onChange={(e) => setKeywords(e.target.value)}
      />

      {/* ✅ Programme Dropdown */}
      <Select onValueChange={setProgrammeId} value={programmeId}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select Programme" />
        </SelectTrigger>
        <SelectContent>
          {programmes.map((programme) => (
            <SelectItem key={programme.id} value={programme.id}>
              {programme.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* ✅ Save/Update Button */}
      <button
        onClick={saveContent}
        disabled={loading}
        className="p-2 bg-blue-500 text-white rounded"
      >
        {loading ? 'Saving...' : dataChunkId ? 'Update' : 'Save'}
      </button>

      <div className="relative flex flex-col flex-1 h-full overflow-hidden">
        <EditorContent editor={editor} className="flex-1 overflow-y-auto" />
        <ContentItemMenu editor={editor} isEditable={isEditable} />
        <LinkMenu editor={editor} appendTo={menuContainerRef} />
        <TextMenu editor={editor} />
        <ColumnsMenu editor={editor} appendTo={menuContainerRef} />
        <TableRowMenu editor={editor} appendTo={menuContainerRef} />
        <TableColumnMenu editor={editor} appendTo={menuContainerRef} />
        <ImageBlockMenu editor={editor} appendTo={menuContainerRef} />
      </div>
    </div>
  );
};

export default BlockEditorV2;
