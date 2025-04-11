'use client';
import { useState } from 'react';

import { arrayMove } from '@dnd-kit/sortable';
import { BlockType, DroppedItem } from 'app/page-editor/type';

export function useEditorItems() {
  const [items, setItems] = useState<DroppedItem[]>([]);

  const updateText = (id: string, content: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, content } : i)));
  };

  const updateButton = (
    id: string,
    button: { url: string; isExternal: boolean }
  ) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, button } : i)));
  };

  const updateFormat = (
    id: string,
    formatUpdate: Partial<DroppedItem['format']>
  ) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, format: { ...i.format, ...formatUpdate } } : i
      )
    );
  };

  const updateListType = (id: string, listType: 'bullet' | 'numbered') => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, listType } : i)));
  };

  const updateType = (id: string, type: BlockType) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, type } : i)));
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const reorderItems = (fromIndex: number, toIndex: number) => {
    setItems((prev) => arrayMove(prev, fromIndex, toIndex));
  };

  return {
    items,
    setItems,
    updateText,
    updateButton,
    updateFormat,
    updateListType,
    updateType,
    removeItem,
    reorderItems
  };
}
