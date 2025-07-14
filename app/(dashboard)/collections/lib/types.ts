export interface CollectionItem {
  id: string;
  title: string;
  description?: string;
  date?: string;
  status?: string;
  [key: string]: any; // For additional custom fields
}

export interface Collection {
  id: string;
  name: string;
  items: CollectionItem[];
}
