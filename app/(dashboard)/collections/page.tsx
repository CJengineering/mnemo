'use client';

import { useState, useEffect } from 'react';

import CollectionsList from './components/collection-list';
import { Collection, CollectionItem } from './lib/types';
import ItemsList from './components/items-list';
import DynamicCollectionForm from './components/dynamic-collection-form';

// Updated types to match API response
export interface APICollectionItem {
  id: string;
  title: string;
  type:
    | 'event'
    | 'news'
    | 'programme'
    | 'post'
    | 'source'
    | 'team'
    | 'innovation'
    | 'award'
    | 'publication'
    | 'prize'
    | 'partner';
  slug: string;
  status: 'published' | 'draft';
  data: any;
  created_at: string;
  updated_at: string;
}

export default function Home() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] =
    useState<Collection | null>(null);
  const [selectedItem, setSelectedItem] = useState<APICollectionItem | null>(
    null
  );
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL =
    'https://mnemo-app-e4f6j5kdsq-ew.a.run.app/api/collection-items';

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const items: APICollectionItem[] = data.collectionItems;

      // Group items by type into collections
      const groupedCollections = items.reduce(
        (acc: { [key: string]: Collection }, item) => {
          const { type } = item;
          if (!acc[type]) {
            acc[type] = {
              id: type,
              name: type.charAt(0).toUpperCase() + type.slice(1) + 's',
              items: []
            };
          }
          acc[type].items.push({
            id: item.id,
            title: item.title,
            description: item.data?.description || '',
            date: item.data?.eventDate || item.data?.datePublished || '',
            status: item.status
          });
          return acc;
        },
        {}
      );

      setCollections(Object.values(groupedCollections));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCollectionSelect = (collection: Collection) => {
    setSelectedCollection(collection);
    setSelectedItem(null);
    setIsCreatingNew(false);
  };

  const handleBackToCollections = () => {
    setSelectedCollection(null);
    setSelectedItem(null);
    setIsCreatingNew(false);
  };

  const handleItemSelect = (item: CollectionItem) => {
    // Fetch the full item data from API
    const fetchFullItem = async () => {
      try {
        const response = await fetch(`${API_URL}/${item.id}`);
        if (response.ok) {
          const data = await response.json();
          setSelectedItem(data.collectionItem);
          setIsCreatingNew(false); // Ensure we're in edit mode
        }
      } catch (error) {
        console.error('Error fetching item:', error);
      }
    };
    fetchFullItem();
  };

  const handleCreateNew = () => {
    setSelectedItem(null);
    setIsCreatingNew(true);
  };

  const handleSubmitItem = async (formData: Partial<APICollectionItem>) => {
    if (!selectedCollection) return;

    const method = isCreatingNew ? 'POST' : 'PUT';
    const endpoint = isCreatingNew ? API_URL : `${API_URL}/${selectedItem?.id}`;

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedCollection.id,
          status: formData.status || 'draft',
          slug: formData.slug,
          title: formData.title,
          data: formData.data
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to save item.');
      }

      // Refresh data from server
      await fetchData();

      // Return success - the form will handle the success message and redirection
      return Promise.resolve();
    } catch (error: any) {
      // Re-throw the error so the form can handle it
      throw error;
    }
  };

  const handleCancelForm = () => {
    setIsCreatingNew(false);
    setSelectedItem(null);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-lg">Loading collections...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center text-red-500">
        <div className="text-lg">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-gray-900">
      {/* Left sidebar with collections */}
      <div className="w-64 border-r border-gray-800 h-full">
        <CollectionsList
          collections={collections}
          selectedCollection={selectedCollection}
          onSelectCollection={handleCollectionSelect}
        />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col bg-gray-900">
        {selectedCollection ? (
          <>
            {/* Always show full table view first */}
            <div className="flex-1">
              <ItemsList
                collection={selectedCollection}
                selectedItem={selectedItem}
                onSelectItem={handleItemSelect}
                onCreateNew={handleCreateNew}
              />
            </div>

            {/* Modal overlay when editing/creating specific item */}
            {(selectedItem || isCreatingNew) && (
              <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex">
                {/* Modal content with items list + form */}
                <div className="bg-gray-900 w-full h-full flex">
                  {/* Narrow items list on the left */}
                  <div className="w-80 border-r border-gray-800 h-full overflow-hidden">
                    <div className="h-full flex flex-col bg-gray-800">
                      {/* Header */}
                      <div className="px-4 py-3 border-b border-gray-700">
                        <h3 className="text-sm font-medium text-white">
                          {selectedCollection.name}
                        </h3>
                        <p className="text-xs text-gray-400">
                          {selectedCollection.items.length} items
                        </p>
                      </div>

                      {/* Items list */}
                      <div className="flex-1 overflow-auto">
                        <div className="space-y-1 p-2">
                          {selectedCollection.items.map((item) => (
                            <button
                              key={item.id}
                              className={`w-full text-left p-3 rounded-lg transition-colors ${
                                selectedItem?.id === item.id
                                  ? 'bg-blue-600 text-white'
                                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                              }`}
                              onClick={() => handleItemSelect(item)}
                            >
                              <div className="font-medium text-sm truncate">
                                {item.title}
                              </div>
                              <div className="text-xs text-gray-400 truncate mt-1">
                                {item.description || 'No description'}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Form area on the right */}
                  <div className="flex-1 flex flex-col">
                    <DynamicCollectionForm
                      collection={selectedCollection}
                      item={selectedItem}
                      isEditing={!isCreatingNew}
                      onSubmit={handleSubmitItem}
                      onCancel={handleCancelForm}
                      onBackToCollections={handleBackToCollections}
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 bg-gray-900">
            Select a collection to view its items
          </div>
        )}
      </div>
    </div>
  );
}
