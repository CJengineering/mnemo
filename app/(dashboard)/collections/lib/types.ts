export interface CollectionItem {
  id: string;
  title: string;
  description?: string;
  date?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  // Additional fields for dynamic columns
  type?: string;
  slug?: string;
  data?: any; // The rich nested data from the API
  [key: string]: any; // For additional custom fields
}

export interface Collection {
  id: string;
  name: string;
  items: CollectionItem[];
}
