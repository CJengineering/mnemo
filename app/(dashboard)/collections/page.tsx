'use client';

import {
  CollectionsProvider,
  useCollections
} from './context/collections-context';
import { CollectionItem } from './lib/types';
import CollectionsList from './components/collection-list';
import ItemsList from './components/items-list';
import DynamicCollectionForm from './components/dynamic-collection-form';

function CollectionsContent() {
  const {
    state: {
      collections,
      selectedCollection,
      selectedItem,
      isCreatingNew,
      isLoading,
      error,
      isSubmitting
    },
    selectCollection,
    selectItem,
    setCreatingNew,
    createItem,
    updateItem,
    clearError,
    fetchItemById
  } = useCollections();

  // Debug: Log the current state
  console.log('🔍 Collections Debug:', {
    collections,
    selectedCollection,
    selectedItem,
    isCreatingNew,
    isLoading,
    error,
    collectionsLength: collections?.length || 0
  });

  const handleCollectionSelect = (collection: any) => {
    selectCollection(collection);
  };

  const handleItemSelect = async (item: CollectionItem) => {
    try {
      // Fetch the complete API data for this item
      const fullItem = await fetchItemById(item.id);
      selectItem(fullItem);
    } catch (error) {
      console.error('Failed to fetch item details:', error);
      // Fallback to basic data conversion if fetch fails
      const apiItem = {
        id: item.id,
        title: item.title,
        type: selectedCollection?.id as any,
        slug: item.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, ''),
        status: item.status as 'published' | 'draft',
        data: {
          title: item.title,
          slug: item.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, ''),
          description: item.description,
          datePublished: item.date || new Date().toISOString().split('T')[0],
          summary: '',
          excerpt: '',
          thumbnail: { url: '', alt: '' },
          heroImage: { url: '', alt: '' },
          tags: [],
          richTextContent: ''
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      selectItem(apiItem);
    }
  };

  const handleCreateNew = () => {
    setCreatingNew(true);
  };

  const handleSubmitItem = async (formData: any) => {
    console.log('🎯 handleSubmitItem called with:', {
      formData,
      selectedCollection,
      isCreatingNew,
      selectedItem
    });

    if (!selectedCollection) {
      console.error('❌ No selected collection');
      return;
    }

    try {
      if (isCreatingNew) {
        console.log('🆕 Creating new item...');
        const result = await createItem(selectedCollection.id, formData);
        console.log('✅ Create item result:', result);
      } else if (selectedItem) {
        console.log('✏️ Updating existing item...');
        const result = await updateItem(selectedItem.id, formData);
        console.log('✅ Update item result:', result);
      }

      console.log(
        '🔄 Context automatically handles UI updates - no manual refresh needed!'
      );
    } catch (error) {
      console.error('❌ handleSubmitItem error:', error);
      // Error is handled by context, just re-throw for form error handling
      throw error;
    }
  };

  const handleCancelForm = () => {
    setCreatingNew(false);
    selectItem(null);
  };

  const handleBackToCollections = () => {
    selectCollection(null);
    selectItem(null);
    setCreatingNew(false);
  };

  const handleBackToItems = () => {
    console.log('🔙 handleBackToItems called - going back to items list');
    // Go back to items list but keep collection selected
    selectItem(null);
    setCreatingNew(false);
    // Collection remains selected so user sees the items list
    console.log('🔙 handleBackToItems completed - should now show items list');
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-900">
        <div className="text-white text-xl">Loading collections...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center text-red-500 bg-gray-900">
        <div className="text-center">
          <div className="text-xl mb-4">Error: {error}</div>
          <button
            onClick={clearError}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-gray-900 overflow-hidden">
      {/* Left sidebar with collections - Fixed */}
      <div className="w-64 border-r border-gray-800 h-full overflow-hidden flex-shrink-0">
        <CollectionsList
          collections={collections}
          selectedCollection={selectedCollection}
          onSelectCollection={handleCollectionSelect}
        />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex h-full overflow-hidden bg-gray-900">
        {selectedCollection ? (
          <div className="flex-1 flex h-full overflow-hidden">
            {/* Show items list or form based on selection */}
            {selectedItem || isCreatingNew ? (
              <>
                {/* Narrow items list on the left when editing/creating - Fixed */}
                <div className="w-80 border-r border-gray-800 h-full overflow-hidden flex-shrink-0">
                  <div className="h-full flex flex-col bg-gray-800">
                    {/* Header - Fixed */}
                    <div className="px-4 py-3 border-b border-gray-700 flex-shrink-0">
                      <h3 className="text-sm font-medium text-white">
                        {selectedCollection.name}
                      </h3>
                      <p className="text-xs text-gray-400">
                        {selectedCollection.items.length} items
                      </p>
                    </div>

                    {/* Items list - Scrollable only */}
                    <div className="flex-1 overflow-y-auto">
                      <div className="space-y-1 p-2">
                        {selectedCollection.items.map((item: any) => (
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

                {/* Form area on the right - Fixed header, scrollable content */}
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                  <DynamicCollectionForm
                    collection={selectedCollection}
                    item={selectedItem}
                    isEditing={!isCreatingNew}
                    onSubmit={handleSubmitItem}
                    onCancel={handleCancelForm}
                    onBackToCollections={handleBackToItems}
                  />
                </div>
              </>
            ) : (
              /* Show full table view when no item is selected */
              <div className="flex-1 h-full overflow-auto">
                <ItemsList
                  collection={selectedCollection}
                  selectedItem={selectedItem}
                  onSelectItem={handleItemSelect}
                  onCreateNew={handleCreateNew}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 bg-gray-900">
            Select a collection to view its items
          </div>
        )}
      </div>
    </div>
  );
}

export default function CollectionsPage() {
  return (
    <CollectionsProvider>
      <CollectionsContent />
    </CollectionsProvider>
  );
}
