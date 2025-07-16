'use client';

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect
} from 'react';
import { Collection, CollectionItem } from '../lib/types';

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
  fetchCollections: () => Promise<void>;
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
    data: Partial<APICollectionItem>
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
      const newCollections = action.payload;
      // If there was a previously selected collection, find the updated version
      const updatedSelectedCollection = state.selectedCollection
        ? newCollections.find((c) => c.id === state.selectedCollection?.id) ||
          null
        : null;

      return {
        ...state,
        collections: newCollections,
        selectedCollection: updatedSelectedCollection,
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

      // Update selectedCollection if it matches the collection being updated
      const updatedSelectedCollection =
        state.selectedCollection?.id === collectionType
          ? collections.find((c) => c.id === collectionType) ||
            state.selectedCollection
          : state.selectedCollection;

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

      // Update selectedCollection to point to the fresh collection object
      const updatedSelectedCollection = state.selectedCollection
        ? collections.find((c) => c.id === state.selectedCollection?.id) ||
          state.selectedCollection
        : state.selectedCollection;

      return {
        ...state,
        collections,
        selectedCollection: updatedSelectedCollection,
        selectedItem: updatedItem
      };
    }

    case 'DELETE_ITEM': {
      const itemId = action.payload;
      const collections = state.collections.map((collection) => ({
        ...collection,
        items: collection.items.filter((item) => item.id !== itemId)
      }));

      // Update selectedCollection to point to the fresh collection object
      const updatedSelectedCollection = state.selectedCollection
        ? collections.find((c) => c.id === state.selectedCollection?.id) ||
          state.selectedCollection
        : state.selectedCollection;

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
  'https://mnemo-app-e4f6j5kdsq-ew.a.run.app/api/collection-items';

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
  const fetchCollections = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const response = await fetch(API_URL);
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
      dispatch({ type: 'SET_ERROR', payload: error.message });
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
        const payload = {
          type: formData.type || collectionType,
          status: apiStatus,
          slug: formData.slug.trim(),
          title: formData.title.trim(),
          data: formData.data
        };

        const response = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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

        // Refresh collections to ensure UI is in sync with server
        await fetchCollections();

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
      formData: Partial<APICollectionItem>
    ): Promise<APICollectionItem> => {
      dispatch({ type: 'SET_SUBMITTING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      // Optimistic update
      if (state.selectedItem && state.selectedItem.id === id) {
        const optimisticItem = { ...state.selectedItem, ...formData };
        dispatch({ type: 'OPTIMISTIC_UPDATE', payload: optimisticItem });
      }

      try {
        const apiStatus = transformStatusToAPI(formData.status || 'draft');
        const payload = {
          type: formData.type || state.selectedItem?.type,
          status: apiStatus,
          slug: formData.slug?.trim(),
          title: formData.title?.trim(),
          data: formData.data
        };

        const response = await fetch(`${API_URL}/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
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
        // The API returns the updated item nested under 'collectionItem'
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

        // Refresh collections to ensure UI is in sync with server
        await fetchCollections();

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
      dispatch({ type: 'SET_SUBMITTING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      try {
        const response = await fetch(`${API_URL}/${id}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          throw new Error(`Failed to delete item: ${response.status}`);
        }

        dispatch({ type: 'DELETE_ITEM', payload: id });

        // Refresh collections to ensure UI is in sync with server
        await fetchCollections();
      } catch (error: any) {
        console.error('Delete item error:', error);
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
        const response = await fetch(`${API_URL}/${id}`);

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
    await fetchCollections();
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
        fetchCollections();
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
  if (context === undefined) {
    throw new Error('useCollections must be used within a CollectionsProvider');
  }
  return context;
}
