'use client';

import type { Collection } from '../lib/types';
import { Database } from 'lucide-react';

interface CollectionsListProps {
  collections: Collection[];
  selectedCollection: Collection | null;
  onSelectCollection: (collection: Collection) => void;
}

const getCollectionIcon = (type: string) => {
  // All collections use Database icon as requested
  return Database;
};

export default function CollectionsList({
  collections,
  selectedCollection,
  onSelectCollection
}: CollectionsListProps) {
  return (
    <div className="h-full bg-gray-900 border-r border-gray-800">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-800">
        <h2 className="text-lg font-semibold text-white">Collections</h2>
        <p className="text-sm text-gray-400 mt-1">Manage your content</p>
      </div>

      {/* Collections List */}
      <div className="p-3">
        <nav className="space-y-1">
          {collections.map((collection) => {
            const Icon = getCollectionIcon(collection.id);
            const isSelected = selectedCollection?.id === collection.id;

            return (
              <button
                key={collection.id}
                className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  isSelected
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
                onClick={() => onSelectCollection(collection)}
              >
                <Icon className="h-5 w-5 mr-3 flex-shrink-0" />
                <span className="flex-1 text-left">{collection.name}</span>
                <span
                  className={`ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    isSelected
                      ? 'bg-blue-500 text-blue-100'
                      : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  {collection.items.length}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-800">
        <div className="text-xs text-gray-500">
          {collections.reduce(
            (total, collection) => total + collection.items.length,
            0
          )}{' '}
          total items
        </div>
      </div>
    </div>
  );
}
