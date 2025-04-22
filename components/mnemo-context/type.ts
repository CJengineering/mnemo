// types.ts

export interface DataChunk {
    id: number;
    programme_id: string;
    name: string;
    type: string;
    metaData: Record<string, any>;
    data: Record<string, any>;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface Page {
    id: number;
    slug: string;
    data: Record<string, any>;
    data_html: Record<string, any>;
    data_seo: Record<string, any>;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface Programme {
    id: string;
    name: string;
  }
  