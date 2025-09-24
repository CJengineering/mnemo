'use client';

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect
} from 'react';
import { Collection, CollectionItem } from '../lib/types';
import { buildUpdatePayload, normalizeApiType } from './update-payload';

// API Collection Item interface (matching your existing structure)
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

// Context state interface
interface CollectionsState {
  // Data
  collections: Collection[];
  selectedCollection: Collection | null;
  selectedItem: APICollectionItem | null;
  isCreatingNew: boolean;

  // Loading states
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;

  // Cache
  lastFetch: number | null;
  optimisticUpdates: Map<string, APICollectionItem>;
}

// Action types
type CollectionsAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SUBMITTING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_COLLECTIONS'; payload: Collection[] }
  | { type: 'SELECT_COLLECTION'; payload: Collection | null }
  | { type: 'SELECT_ITEM'; payload: APICollectionItem | null }
  | { type: 'SET_CREATING_NEW'; payload: boolean }
  | {
      type: 'ADD_ITEM';
      payload: { collectionType: string; item: APICollectionItem };
    }
  | { type: 'UPDATE_ITEM'; payload: APICollectionItem }
  | { type: 'DELETE_ITEM'; payload: string }
  | { type: 'OPTIMISTIC_UPDATE'; payload: APICollectionItem }
  | { type: 'REVERT_OPTIMISTIC'; payload: string }
  | { type: 'CLEAR_OPTIMISTIC' };

// Context interface
interface CollectionsContextType {
  // State
  state: CollectionsState;

  // Actions
  fetchCollections: (opts?: { silent?: boolean }) => Promise<void>;
  selectCollection: (collection: Collection | null) => void;
  selectItem: (item: APICollectionItem | null) => void;
  setCreatingNew: (creating: boolean) => void;

  // CRUD operations
  createItem: (
    collectionType: string,
    data: Partial<APICollectionItem>
  ) => Promise<APICollectionItem>;
  updateItem: (
    id: string,
    data: Partial<APICollectionItem>,
    options?: { statusOnly?: boolean; minimalUpdate?: boolean }
  ) => Promise<APICollectionItem>;
  deleteItem: (id: string) => Promise<void>;
  fetchItemById: (id: string) => Promise<APICollectionItem>;

  // Utility
  refreshData: () => Promise<void>;
  clearError: () => void;
}

// Initial state
const initialState: CollectionsState = {
  collections: [],
  selectedCollection: null,
  selectedItem: null,
  isCreatingNew: false,
  isLoading: true,
  isSubmitting: false,
  error: null,
  lastFetch: null,
  optimisticUpdates: new Map()
};

// Reducer
function collectionsReducer(
  state: CollectionsState,
  action: CollectionsAction
): CollectionsState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_SUBMITTING':
      return { ...state, isSubmitting: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'SET_COLLECTIONS':
      return {
        ...state,
        collections: action.payload,
        lastFetch: Date.now(),
        isLoading: false,
        error: null
      };

    case 'SELECT_COLLECTION':
      return {
        ...state,
        selectedCollection: action.payload,
        selectedItem: null,
        isCreatingNew: false
      };

    case 'SELECT_ITEM':
      return {
        ...state,
        selectedItem: action.payload,
        isCreatingNew: false
      };

    case 'SET_CREATING_NEW':
      return {
        ...state,
        isCreatingNew: action.payload,
        selectedItem: action.payload ? null : state.selectedItem
      };

    case 'ADD_ITEM': {
      const { collectionType, item } = action.payload;
      const collections = state.collections.map((collection) => {
        if (collection.id === collectionType) {
          return {
            ...collection,
            items: [
              ...collection.items,
              {
                id: item.id,
                title: item.title,
                description: item.data?.description || '',
                status: item.status,
                created_at: item.created_at,
                updated_at: item.updated_at
              }
            ]
          };
        }
        return collection;
      });

      // Also update selectedCollection if it's the one that got the new item
      const updatedSelectedCollection = state.selectedCollection
        ? collections.find((c) => c.id === state.selectedCollection!.id) || null
        : null;

      return {
        ...state,
        collections,
        selectedCollection: updatedSelectedCollection,
        selectedItem: item,
        isCreatingNew: false
      };
    }

    case 'UPDATE_ITEM': {
      const updatedItem = action.payload;
      const collections = state.collections.map((collection) => ({
        ...collection,
        items: collection.items.map((item) =>
          item.id === updatedItem.id
            ? {
                ...item,
                title: updatedItem.title,
                description: updatedItem.data?.description || '',
                status: updatedItem.status,
                updated_at: updatedItem.updated_at
              }
            : item
        )
      }));

      // Also update selectedCollection if it contains the updated item
      const updatedSelectedCollection = state.selectedCollection
        ? collections.find((c) => c.id === state.selectedCollection!.id) || null
        : null;

      return {
        ...state,
        collections,
        selectedCollection: updatedSelectedCollection,
        selectedItem: updatedItem
      };
    }

    case 'DELETE_ITEM': {
      const itemId = action.payload;
      console.log('🔥 DELETE_ITEM reducer: removing item', itemId);
      console.log(
        '📊 Current collections before delete:',
        state.collections.map((c) => ({
          name: c.name,
          itemCount: c.items.length,
          items: c.items.map((i) => ({ id: i.id, title: i.title }))
        }))
      );

      const collections = state.collections.map((collection) => ({
        ...collection,
        items: collection.items.filter((item) => item.id !== itemId)
      }));

      console.log(
        '📊 Collections after delete:',
        collections.map((c) => ({
          name: c.name,
          itemCount: c.items.length,
          items: c.items.map((i) => ({ id: i.id, title: i.title }))
        }))
      );

      // Also update selectedCollection if it's the one containing the deleted item
      const updatedSelectedCollection = state.selectedCollection
        ? collections.find((c) => c.id === state.selectedCollection!.id) || null
        : null;

      console.log(
        '🔄 Updated selectedCollection:',
        updatedSelectedCollection
          ? {
              name: updatedSelectedCollection.name,
              itemCount: updatedSelectedCollection.items.length
            }
          : 'null'
      );

      return {
        ...state,
        collections,
        selectedCollection: updatedSelectedCollection,
        selectedItem:
          state.selectedItem?.id === itemId ? null : state.selectedItem
      };
    }

    case 'OPTIMISTIC_UPDATE':
      return {
        ...state,
        optimisticUpdates: new Map(state.optimisticUpdates).set(
          action.payload.id,
          action.payload
        )
      };

    case 'REVERT_OPTIMISTIC': {
      const newMap = new Map(state.optimisticUpdates);
      newMap.delete(action.payload);
      return {
        ...state,
        optimisticUpdates: newMap
      };
    }

    case 'CLEAR_OPTIMISTIC':
      return {
        ...state,
        optimisticUpdates: new Map()
      };

    default:
      return state;
  }
}

// Create context
const CollectionsContext = createContext<CollectionsContextType | undefined>(
  undefined
);

// API utilities
const API_URL =
  process.env.NEXT_PUBLIC_COLLECTIONS_API_URL ||
  'https://mnemo-app-100166227581.europe-west1.run.app/api/collection-items';

console.log('🔧 Collections API URL:', API_URL);

// Webhook helper (client-side) to mirror server-side webhooks when using external API directly
// DISABLED: These internal webhook endpoints don't exist in this Next.js app
// The external API handles its own webhooks, so we don't need to call local ones
async function fireCollectionWebhook(
  action: 'create' | 'update' | 'delete',
  collectionItem: any
) {
  console.log(
    `🔗 Webhook ${action} would be called for:`,
    collectionItem.id,
    '(disabled)'
  );
  // Webhooks disabled - external API handles this
  return;
}

// Status transformation utilities
const transformStatusToAPI = (uiStatus: 'published' | 'draft'): string => {
  return uiStatus;
};

const transformStatusFromAPI = (apiStatus: string): 'published' | 'draft' => {
  return apiStatus === 'published' ? 'published' : 'draft';
};

// Pluralization function
const pluralizeCollectionName = (type: string): string => {
  const capitalizedType = type.charAt(0).toUpperCase() + type.slice(1);
  const specialCases: { [key: string]: string } = {
    news: 'News',
    team: 'Team',
    innovation: 'Innovations',
    publication: 'Publications',
    programme: 'Programmes'
  };

  if (specialCases[type.toLowerCase()]) {
    return specialCases[type.toLowerCase()];
  }

  if (
    type.endsWith('s') ||
    type.endsWith('x') ||
    type.endsWith('sh') ||
    type.endsWith('ch')
  ) {
    return capitalizedType + 'es';
  } else if (type.endsWith('y')) {
    return capitalizedType.slice(0, -1) + 'ies';
  } else {
    return capitalizedType + 's';
  }
};

// Provider component
export function CollectionsProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const [state, dispatch] = useReducer(collectionsReducer, initialState);

  // Fetch collections data
  const fetchCollections = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = !!opts?.silent;

    // Only show global loading and clear error for non-silent (initial/explicit) loads
    if (!silent) {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
    }

    try {
      const response = await fetch(API_URL, {
        headers: { Accept: 'application/json' }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const items: APICollectionItem[] = data.collectionItems;

      // Group items by type into collections (same logic as original)
      const groupedCollections = items.reduce(
        (acc: { [key: string]: Collection }, item) => {
          if (!acc[item.type]) {
            acc[item.type] = {
              id: item.type,
              name: pluralizeCollectionName(item.type),
              items: []
            };
          }

          acc[item.type].items.push({
            id: item.id,
            title: item.title,
            description: item.data?.description || '',
            status: transformStatusFromAPI(item.status),
            created_at: item.created_at,
            updated_at: item.updated_at
          });

          return acc;
        },
        {}
      );

      // Sort items by updated_at descending
      Object.values(groupedCollections).forEach((collection) => {
        collection.items.sort(
          (a, b) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
      });

      const collectionsArray = Object.values(groupedCollections);
      dispatch({ type: 'SET_COLLECTIONS', payload: collectionsArray });
    } catch (error: any) {
      console.error('Failed to fetch collections:', error);
      // For silent refreshes, avoid pushing an error that would render the full-screen error UI
      if (!silent) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
      }
    }
  }, []);

  // Select collection
  const selectCollection = useCallback((collection: Collection | null) => {
    dispatch({ type: 'SELECT_COLLECTION', payload: collection });
  }, []);

  // Select item
  const selectItem = useCallback((item: APICollectionItem | null) => {
    dispatch({ type: 'SELECT_ITEM', payload: item });
  }, []);

  // Set creating new
  const setCreatingNew = useCallback((creating: boolean) => {
    dispatch({ type: 'SET_CREATING_NEW', payload: creating });
  }, []);

  // Create item
  const createItem = useCallback(
    async (
      collectionType: string,
      formData: Partial<APICollectionItem>
    ): Promise<APICollectionItem> => {
      dispatch({ type: 'SET_SUBMITTING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      try {
        // Validate required fields
        if (!formData.title?.trim()) {
          throw new Error('Title is required');
        }
        if (!formData.slug?.trim()) {
          throw new Error('Slug is required');
        }

        const apiStatus = transformStatusToAPI(formData.status || 'draft');
        const normalizedType =
          normalizeApiType(formData.type || collectionType) || collectionType;
        const payload: any = {
          status: apiStatus,
          slug: formData.slug.trim(),
          title: formData.title.trim(),
          data: formData.data
        };
        if (normalizeApiType(normalizedType)) {
          payload.type = normalizeApiType(normalizedType);
        }
        console.log('🧭 Create normalized type:', payload.type);

        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message ||
              `API Error: ${response.status} ${response.statusText}`
          );
        }

        const responseData = await response.json();
        // The API returns the created item nested under 'collectionItem'
        const createdItemData = responseData.collectionItem;
        const newItem: APICollectionItem = {
          id: createdItemData.id,
          title: createdItemData.title,
          type: createdItemData.type,
          slug: createdItemData.slug,
          status: transformStatusFromAPI(createdItemData.status),
          data: createdItemData.data,
          created_at: createdItemData.created_at,
          updated_at: createdItemData.updated_at
        };

        dispatch({
          type: 'ADD_ITEM',
          payload: { collectionType, item: newItem }
        });

        // Fire create webhook client-side (since using external API)
        fireCollectionWebhook('create', createdItemData);

        // Refresh collections to ensure UI is in sync with server (silent)
        await fetchCollections({ silent: true });

        return newItem;
      } catch (error: any) {
        console.error('Create item error:', error);
        dispatch({ type: 'SET_ERROR', payload: error.message });
        throw error;
      } finally {
        dispatch({ type: 'SET_SUBMITTING', payload: false });
      }
    },
    [fetchCollections]
  );

  // Update item
  const updateItem = useCallback(
    async (
      id: string,
      formData: Partial<APICollectionItem>,
      options?: { statusOnly?: boolean; minimalUpdate?: boolean }
    ): Promise<APICollectionItem> => {
      dispatch({ type: 'SET_SUBMITTING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      // Optimistic update
      if (state.selectedItem && state.selectedItem.id === id) {
        const optimisticItem = { ...state.selectedItem, ...formData };
        dispatch({ type: 'OPTIMISTIC_UPDATE', payload: optimisticItem });
      }

      try {
        const payload = buildUpdatePayload(
          formData as any,
          options,
          state.selectedItem?.type
        );
        console.log('📤 Computed update payload:', payload);

        const url = `${API_URL}/${id}`;
        console.log('📡 PUT', url);
        const response = await fetch(url, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => '');
          let errorData: any = {};
          try {
            errorData = JSON.parse(errorText);
          } catch {}
          throw new Error(
            (errorData && errorData.message) ||
              `API Error: ${response.status} ${response.statusText} ${errorText ? '- ' + errorText : ''}`
          );
        }

        const responseData = await response.json();
        const updatedItemData = responseData.collectionItem;
        const updatedItem: APICollectionItem = {
          id,
          title: updatedItemData.title,
          type: updatedItemData.type,
          slug: updatedItemData.slug,
          status: transformStatusFromAPI(updatedItemData.status),
          data: updatedItemData.data,
          created_at: updatedItemData.created_at,
          updated_at: updatedItemData.updated_at
        };

        dispatch({ type: 'UPDATE_ITEM', payload: updatedItem });
        dispatch({ type: 'REVERT_OPTIMISTIC', payload: id });
        fireCollectionWebhook('update', updatedItemData);
        await fetchCollections({ silent: true });

        return updatedItem;
      } catch (error: any) {
        console.error('Update item error:', error);
        dispatch({ type: 'REVERT_OPTIMISTIC', payload: id });
        dispatch({ type: 'SET_ERROR', payload: error.message });
        throw error;
      } finally {
        dispatch({ type: 'SET_SUBMITTING', payload: false });
      }
    },
    [state.selectedItem, fetchCollections]
  );

  // Delete item
  const deleteItem = useCallback(
    async (id: string): Promise<void> => {
      console.log('🗑️ Starting delete for item:', id);
      dispatch({ type: 'SET_SUBMITTING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      try {
        console.log('📡 Sending DELETE request to:', `${API_URL}/${id}`);
        const response = await fetch(`${API_URL}/${id}`, {
          method: 'DELETE',
          headers: { Accept: 'application/json' }
        });

        if (!response.ok) {
          throw new Error(`Failed to delete item: ${response.status}`);
        }

        console.log('✅ DELETE request successful, updating local state...');
        dispatch({ type: 'DELETE_ITEM', payload: id });

        // Fire delete webhook client-side (include minimal data)
        fireCollectionWebhook('delete', { id });

        console.log('🔄 Refreshing collections from server...');
        // Refresh collections to ensure UI is in sync with server (silent)
        await fetchCollections({ silent: true });
        console.log('✅ Collections refreshed after delete');
      } catch (error: any) {
        console.error('❌ Delete item error:', error);
        dispatch({ type: 'SET_ERROR', payload: error.message });
        throw error;
      } finally {
        dispatch({ type: 'SET_SUBMITTING', payload: false });
      }
    },
    [fetchCollections]
  );

  // Fetch item by ID
  const fetchItemById = useCallback(
    async (id: string): Promise<APICollectionItem> => {
      dispatch({ type: 'SET_ERROR', payload: null });

      try {
        const response = await fetch(`${API_URL}/${id}`, {
          headers: { Accept: 'application/json' }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch item: ${response.status}`);
        }

        const data = await response.json();

        // The API returns the item nested under 'collectionItem'
        const itemData = data.collectionItem;
        const item: APICollectionItem = {
          id: itemData.id,
          title: itemData.title,
          type: itemData.type,
          slug: itemData.slug,
          status: transformStatusFromAPI(itemData.status),
          data: itemData.data,
          created_at: itemData.created_at,
          updated_at: itemData.updated_at
        };

        return item;
      } catch (error: any) {
        console.error('Fetch item error:', error);
        dispatch({ type: 'SET_ERROR', payload: error.message });
        throw error;
      }
    },
    []
  );

  // Refresh data
  const refreshData = useCallback(async () => {
    await fetchCollections({ silent: true });
  }, [fetchCollections]);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  // Auto-refresh every 5 minutes - FIXED: Remove dependency on state.lastFetch to prevent recreation
  useEffect(() => {
    const interval = setInterval(
      () => {
        fetchCollections({ silent: true });
      },
      5 * 60 * 1000
    ); // Check and refresh every 5 minutes

    return () => clearInterval(interval);
  }, [fetchCollections]); // Only depend on fetchCollections, not state.lastFetch

  const contextValue: CollectionsContextType = {
    state,
    fetchCollections,
    selectCollection,
    selectItem,
    setCreatingNew,
    createItem,
    updateItem,
    deleteItem,
    fetchItemById,
    refreshData,
    clearError
  };

  return (
    <CollectionsContext.Provider value={contextValue}>
      {children}
    </CollectionsContext.Provider>
  );
}

// Hook to use the context
export function useCollections() {
  const context = useContext(CollectionsContext);
  if (!context) {
    throw new Error('useCollections must be used within a CollectionsProvider');
  }
  return context;
}
