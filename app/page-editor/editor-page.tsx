'use client';
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation'
import { BlockType, DroppedItem } from './type';
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverlay
} from '@dnd-kit/core';
import { nanoid } from 'nanoid';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup
} from '@/components/ui/resizable';
import { BLOCKS_CONFIG } from './block-config';
import { DroppableArea } from './droppable';
import { SortableBlock } from './sortable-blocks';
import { TEXT_LIBRARY } from './fake-data';

import { useHasMounted } from './hooks/useHasMounted';
import { useEditorItems } from './hooks/useEditorItems';
import { DraggableLibraryItem } from './draggable-library-item';
import { generateHtml } from './utils/generateHtml';
import { mapData } from '@/validators/page-validator/mapData';

import {
  Bot,
  Edit,
  Eye,
  LayoutTemplate,
  ListCollapse,
  Move,
  Plus,
  PuzzleIcon,
  Save
} from 'lucide-react';
import ContentSearchSelectors from './content-search-selectors';
import { PageForm } from './form/page-form';
import BlockEditorV2 from '@/tip-tap/components/BlockEditor/BlockEditorV2';
import { useCollaboration } from '@/tip-tap/hooks/useCollaboration';

import { ImageDataForm } from '@/components/image/image-data-form';
import { TextDataForm } from '@/validators/text-validator/components/textDataForm';
import TestOnlySidebar from '@/components/sidebar/sitemap-sidebar/sitemap-sidebar';
import TestOnlySidebarV2 from '@/components/sidebar/sitemap-sidebar/sidebar-V2';
import { Example } from '@/components/mnemo-context/testComponent';
import { useMnemo } from '@/components/mnemo-context/mnemo-context';

import { mapAllChunksToDroppedItems } from '@/lib/mappers/mapAllChunksToDroppedItems';
import { DataChunk } from '@/components/mnemo-context/type';

export default function Editor() {
  const searchParams = useSearchParams();
  const params = { room: searchParams.get('room') };
  const [activeEditorTab, setActiveEditorTab] = useState<
    'text' | 'ai' | 'image'
  >('text');

  const providerState = useCollaboration({
    docId: params.room || 'default',
    enabled: parseInt(searchParams?.get('noCollab') as string) !== 1
  });
  const aiToken = 'nbul';
  const [previewMode, setPreviewMode] = useState(false);
  const [viewMode, setViewMode] = useState<
    'preview' | 'draggable' | 'editorV2'
  >('draggable');

  const [activeItem, setActiveItem] = useState<DroppedItem | null>(null);
  // useEffect(() => {
  //   const saved = localStorage.getItem('contentPage');
  //   if (saved) {
  //     const parsed = JSON.parse(saved);
  //     setItems(parsed.data); // rebuilds editor
  //   }
  // }, []);

   const pageParam = searchParams.get('page');
  

  const {
    items,
    setItems,
    updateText,
    updateType,
    updateButton,
    updateFormat,
    updateListType,
    removeItem,
    reorderItems
  } = useEditorItems();

  const { pages } = useMnemo();
  useEffect(() => {
    console.log('⚙️ pages in context:', pages.map(p => p.slug));
    console.log('⚙️ pageParam:', pageParam);
  
    if (!pageParam) {
      setItems([]);
      return;
    }
  
    // build slug exactly as it lives in your DB
    const fullSlug = pageParam.startsWith('/') ? pageParam : `/${pageParam}`;
    console.log('⚙️ looking for slug:', fullSlug);
  
    const matched = pages.find(p => p.slug === fullSlug);
    console.log('⚙️ matched page:', matched);
  
    if (matched) {
      setItems(matched.data as DroppedItem[]);

    } else {
      setItems([]);
    }
  }, [pageParam, pages, setItems]);


  const handleDragEnd = (event: DragEndEvent) => {
    const { over, active } = event;
    if (!over) return;

    const isFromLibrary = active.data?.current?.from === 'library';
    const parentId = over.data?.current?.parentId; // 👈 Detect if dropped inside another block

    const newItem: DroppedItem = {
      id: nanoid(),
      programme: 'J-PAL',
      type:
        active.data?.current?.type ??
        (active.data?.current?.image ? 'img' : 'p'),
      content: active.data?.current?.content ?? '',
      image: active.data?.current?.image,
      button:
        active.data?.current?.type === 'button' ||
        active.data?.current?.type === 'link'
          ? {
              url: active.data?.current?.button?.url ?? '',
              isExternal: active.data?.current?.button?.isExternal ?? false
            }
          : undefined
    };
    if (isFromLibrary && String(over.id).startsWith('accordion-')) {
      handleAccordionDrop({
        overId: String(over.id),
        activeData: active.data?.current,
        setItems
      });
      setActiveItem(null);
      return;
    }
  
    if (isFromLibrary) {
      if (parentId) {
        // Dropped as a child inside something (e.g., accordion)
        setItems((prev) =>
          prev.map((item) =>
            item.id === parentId
              ? {
                  ...item,
                  children: [...(item.children || []), newItem]
                }
              : item
          )
        );
      } else if (over.id === 'left-panel') {
        // Normal top-level drop
        setItems((prev) => [...prev, newItem]);
      }
    } else {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        reorderItems(oldIndex, newIndex);
      }
    }

    setActiveItem(null);
  };
  function handleAccordionDrop({
    overId,
    activeData,
    setItems
  }: {
    overId: string;
    activeData: any;
    setItems: React.Dispatch<React.SetStateAction<DroppedItem[]>>;
  }) {
    const accordionId = overId.replace('accordion-', '');
    const newItem: DroppedItem = {
      id: crypto.randomUUID(),
      programme: 'J-PAL',
      type:
        activeData?.type ?? (activeData?.image ? 'img' : 'p'),
      content: activeData?.content ?? '',
      image: activeData?.image,
      button:
        activeData?.type === 'button' || activeData?.type === 'link'
          ? {
              url: activeData?.button?.url ?? '',
              isExternal: activeData?.button?.isExternal ?? false
            }
          : undefined
    };
  
    setItems(prev =>
      prev.map(item =>
        item.id === accordionId
          ? {
              ...item,
              children: [...(item.children ?? []), newItem]
            }
          : item
      )
    );
  }
  
  const handleSaveDB = async () => {
    try {
      const parsedItems = mapData(items);
      const html = generateHtml(parsedItems);

      const payload = {
        slug: 'tim/test/test',
        data: parsedItems,
        dataHtml: { rawHtml: html },
        dataSeo: {
          title: 'Test Page',
          description: 'A simple test page created from the editor.',
          keywords: ['cms', 'page', 'test']
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
    } catch (err) {
      alert('❌ Failed to save: ' + err);
      console.error(err);
    }
  };
  const updateContainerType = (id: string, containerType: DroppedItem['containerType']) => {
    setItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, containerType } : item
      )
    );
  };

  const hasMounted = useHasMounted();
  const handleSave = () => {
    const html = generateHtml(items);

    const contentPage = {
      data: items,
      dataHtml: html
    };

    localStorage.setItem('contentPage', JSON.stringify(contentPage));
    alert('Page saved to localStorage!');
  };
 
  const { dataChunks } = useMnemo();

  const droppedItems = mapAllChunksToDroppedItems(dataChunks);
  const additionalItems = [
    {
      name: 'J-PAL News',
      href: '/programmes/j-pal/j-pal-news'
    },
    {
      name: 'Ankur Archive',
      href: '/programmes/ankur/archive'
    }
  ];
  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      onDragStart={({ active }) => {
        const fromLibrary = active.data?.current?.from === 'library';
        if (fromLibrary && active.data?.current) {
          const previewItem: DroppedItem = {
            id: 'preview',
            programme: 'J-PAL',
            type: active.data.current.image ? 'img' : 'p',
            content: active.data.current.content,
            image: active.data.current.image
          };
          setActiveItem(previewItem);
        }
      }}
    >
      <PageForm items={items} />
      <div className="flex">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('draggable')}
            className="mb-4 p-2.5 border bg-white text-blue-400 hover:text-blue-700 flex items-center justify-center"
            aria-label="Edit with Drag & Drop"
          >
            <LayoutTemplate size={20} />
          </button>

          <button
            onClick={() => setViewMode('preview')}
            className="mb-4 p-2.5 border bg-white text-blue-400 hover:text-blue-700 flex items-center justify-center"
            aria-label="Preview Mode"
          >
            <Eye size={20} />
          </button>

          <button
            onClick={() => setViewMode('editorV2')}
            className="mb-4 p-2.5 border bg-white text-blue-400 hover:text-blue-700 flex items-center justify-center"
            aria-label="AI Editor"
          >
            <Plus size={20} />
          </button>
          <button
            onClick={handleSave}
            className="mb-4 p-2.5 border bg-white text-green-500  hover:text-green-700 flex items-center justify-center"
            aria-label="Save"
          >
            <Save size={20} />
         
          </button>
          <button
            onClick={() =>
              setItems((prev) => [
                ...prev,
                {
                  id: nanoid(),
                  programme: 'J-PAL',
                  type: 'postAccordion',
                  content: 'Accordion Title',
                  children: [] // 👈 empty children array
                }
              ])
            }
            className="mb-4 p-2.5 border bg-white text-green-500  hover:text-green-700 flex items-center justify-center"
          >
               <ListCollapse size={20} />
          </button>
  
        </div>
      </div>

      <div className="flex gap-4 ">
        <div className="min-w-[250px] border border-gray-700 ">
          <TestOnlySidebarV2 />
        </div>
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={70}>
            {viewMode === 'preview' && (
              <div className="prose space-y-4 p-4 bg-white border rounded min-h-[400px]">
               
                {items.map((item) => (
                  <div key={item.id}>
                    {BLOCKS_CONFIG[item.type].render(item, 'preview')}
                  </div>
                ))}
              </div>
            )}

            {viewMode === 'draggable' && (
              <DroppableArea id="left-panel">
                <SortableContext
                  items={items.map((i) => i.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {items.map((item) => (
                    <SortableBlock
                      key={item.id}
                      item={item}
                      updateType={updateType}
                      removeItem={removeItem}
                      updateFormat={updateFormat}
                      updateText={updateText}
                      updateButton={updateButton}
                      updateListType={updateListType}
                      updateContainerType={updateContainerType}
                    />
                  ))}
                </SortableContext>
              </DroppableArea>
            )}

            {viewMode === 'editorV2' && (
              <div>
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setActiveEditorTab('text')}
                    className={`p-2.5 border bg-white ${
                      activeEditorTab === 'text'
                        ? 'text-blue-700'
                        : 'text-blue-400 hover:text-blue-700'
                    }`}
                  >
                    Text
                  </button>
                </div>

                <div className="border p-4 rounded  bg-white">
                  {activeEditorTab === 'text' && <TextDataForm />}

                  {activeEditorTab === 'ai' && (
                    <div className="hidden">
                      <BlockEditorV2
                        aiToken={aiToken ?? undefined}
                        ydoc={providerState.yDoc}
                        provider={providerState.provider}
                      />
                    </div>
                  )}

                  {activeEditorTab === 'image' && <ImageDataForm />}
                </div>
              </div>
            )}
          </ResizablePanel>

          <ResizableHandle withHandle className="p-2" />

          <ResizablePanel defaultSize={30}>
            <div className="border p-4 bg-orange-50 border-orange-500 rounded space-y-2">
              <div className="flex space-x-2 items-center ">
                <PuzzleIcon className="h-6 w-6 text-orange-500" />
                <h2 className="text-xl  text-orange-500">CONTENT</h2>
              </div>
              <ContentSearchSelectors />
              <div className="h-[60vh] overflow-y-auto">
                {' '}
                {hasMounted &&
                  droppedItems.map((block) => (
                    <DraggableLibraryItem
                      key={block.id}
                      block={block as DroppedItem}
                    />
                  ))}
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <DragOverlay>
        {activeItem
          ? BLOCKS_CONFIG[activeItem.type]?.overlay?.(activeItem)
          : null}
      </DragOverlay>
    </DndContext>
  );
}
