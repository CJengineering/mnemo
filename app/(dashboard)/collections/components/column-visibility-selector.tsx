'use client';

import { useState, useRef, useEffect } from 'react';
import { Columns, Check } from 'lucide-react';

export interface ColumnConfig {
  id: string;
  label: string;
  defaultVisible: boolean;
  render: (item: any) => React.ReactNode;
}

interface ColumnVisibilitySelectorProps {
  columns: ColumnConfig[];
  visibleColumns: Set<string>;
  onToggleColumn: (columnId: string) => void;
  onResetColumns: () => void;
}

export function ColumnVisibilitySelector({
  columns,
  visibleColumns,
  onToggleColumn,
  onResetColumns
}: ColumnVisibilitySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  const visibleCount = visibleColumns.size;
  const totalCount = columns.length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center px-3 py-2 border border-gray-600 rounded-md text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 transition-colors"
      >
        <Columns className="h-4 w-4 mr-2" />
        Columns
        <span className="ml-2 text-xs text-gray-400">
          ({visibleCount}/{totalCount})
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-lg shadow-lg bg-gray-800 border border-gray-700 z-50">
          <div className="p-3 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white">
                Visible Columns
              </span>
              <button
                onClick={() => {
                  onResetColumns();
                  setIsOpen(false);
                }}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto p-2">
            {columns.map((column) => {
              const isVisible = visibleColumns.has(column.id);
              return (
                <button
                  key={column.id}
                  onClick={() => onToggleColumn(column.id)}
                  className="w-full flex items-center px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded-md transition-colors"
                >
                  <div
                    className={`w-4 h-4 mr-3 flex items-center justify-center rounded border ${
                      isVisible
                        ? 'bg-blue-600 border-blue-600'
                        : 'border-gray-600'
                    }`}
                  >
                    {isVisible && <Check className="h-3 w-3 text-white" />}
                  </div>
                  <span className={isVisible ? 'text-white' : ''}>
                    {column.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="p-3 border-t border-gray-700">
            <button
              onClick={() => setIsOpen(false)}
              className="w-full px-3 py-2 text-xs text-gray-400 hover:text-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
