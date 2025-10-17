'use client';

import { useState, useEffect, useMemo } from 'react';
import type { ColumnConfig } from '../components/column-visibility-selector';

const STORAGE_KEY_PREFIX = 'collection_columns_';

export function useColumnVisibility(
  collectionId: string,
  columns: ColumnConfig[]
) {
  // Get default visible columns
  const defaultVisibleColumns = useMemo(() => {
    return new Set(
      columns.filter((col) => col.defaultVisible).map((col) => col.id)
    );
  }, [columns]);

  // Initialize state from localStorage or defaults
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return defaultVisibleColumns;

    try {
      const stored = localStorage.getItem(
        `${STORAGE_KEY_PREFIX}${collectionId}`
      );
      if (stored) {
        const parsed = JSON.parse(stored);
        // Validate that stored columns still exist in current column config
        const validColumns = parsed.filter((id: string) =>
          columns.some((col) => col.id === id)
        );
        return new Set(validColumns);
      }
    } catch (error) {
      console.error('Failed to load column preferences:', error);
    }

    return defaultVisibleColumns;
  });

  // Save to localStorage whenever visibleColumns changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(
        `${STORAGE_KEY_PREFIX}${collectionId}`,
        JSON.stringify(Array.from(visibleColumns))
      );
    } catch (error) {
      console.error('Failed to save column preferences:', error);
    }
  }, [collectionId, visibleColumns]);

  const toggleColumn = (columnId: string) => {
    setVisibleColumns((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(columnId)) {
        newSet.delete(columnId);
      } else {
        newSet.add(columnId);
      }
      return newSet;
    });
  };

  const resetColumns = () => {
    setVisibleColumns(defaultVisibleColumns);
  };

  // Get only visible columns in their original order
  const activeColumns = useMemo(() => {
    return columns.filter((col) => visibleColumns.has(col.id));
  }, [columns, visibleColumns]);

  return {
    visibleColumns,
    activeColumns,
    toggleColumn,
    resetColumns
  };
}
