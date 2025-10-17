'use client';

import type { Collection, CollectionItem } from '../lib/types';
import {
  PlusIcon,
  Search,
  Filter,
  MoreHorizontal,
  Database
} from 'lucide-react';
import { useState } from 'react';
import { ColumnVisibilitySelector } from './column-visibility-selector';
import { useColumnVisibility } from '../hooks/use-column-visibility';
import { getColumnConfigForCollection } from '../config/dynamic-column-configs';

interface ItemsListProps {
  collection: Collection;
  selectedItem: CollectionItem | null;
  onSelectItem: (item: CollectionItem) => void;
  onCreateNew: () => void;
}

export default function ItemsList({
  collection,
  selectedItem,
  onSelectItem,
  onCreateNew
}: ItemsListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Get column configuration for this collection type
  const columns = getColumnConfigForCollection(collection.id, collection.items);

  // Use column visibility hook
  const { visibleColumns, activeColumns, toggleColumn, resetColumns } =
    useColumnVisibility(collection.id, columns);

  const filteredItems = collection.items.filter(
    (item) =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-semibold text-white">
              {collection.name}
            </h1>
            <span className="text-sm text-gray-400">
              {collection.items.length}{' '}
              {collection.items.length === 1 ? 'item' : 'items'}
            </span>
          </div>
          <button
            onClick={onCreateNew}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add {collection.name.slice(0, -1)}
          </button>
        </div>

        {/* Search and filters */}
        <div className="mt-4 flex items-center space-x-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder={`Search ${collection.name.toLowerCase()}...`}
              className="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-md leading-5 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:placeholder-gray-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="inline-flex items-center px-3 py-2 border border-gray-600 rounded-md text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </button>
          {/* Column Visibility Selector */}
          <ColumnVisibilitySelector
            columns={columns}
            visibleColumns={visibleColumns}
            onToggleColumn={toggleColumn}
            onResetColumns={resetColumns}
          />
        </div>
      </div>

      {/* Items Table */}
      <div className="flex-1 overflow-auto">
        {filteredItems.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <div className="text-gray-400">
              <Database className="mx-auto h-12 w-12 text-gray-600 mb-4" />
              <h3 className="mt-2 text-sm font-medium text-white">
                No {collection.name.toLowerCase()}
              </h3>
              <p className="mt-1 text-sm text-gray-400">
                Get started by creating a new{' '}
                {collection.name.slice(0, -1).toLowerCase()}.
              </p>
              <div className="mt-6">
                <button
                  onClick={onCreateNew}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  New {collection.name.slice(0, -1)}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              {/* Table Header */}
              <thead className="bg-gray-800/50">
                <tr>
                  {activeColumns.map((column) => (
                    <th
                      key={column.id}
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                    >
                      {column.label}
                    </th>
                  ))}
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="bg-gray-900 divide-y divide-gray-700">
                {filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    className={`cursor-pointer transition-colors duration-200 ${
                      selectedItem?.id === item.id
                        ? 'bg-blue-900/30 border-l-4 border-blue-500'
                        : 'hover:bg-gray-800/50'
                    }`}
                    onClick={() => onSelectItem(item)}
                  >
                    {/* Dynamic Columns */}
                    {activeColumns.map((column) => (
                      <td key={column.id} className="px-6 py-4">
                        {column.render(item)}
                      </td>
                    ))}

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-700/50"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Add menu logic here
                        }}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
