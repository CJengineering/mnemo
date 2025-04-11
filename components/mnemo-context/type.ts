// types.ts

export interface DataChunk {
    id: number;
    programmeId: string;
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
    dataHtml: Record<string, any>;
    dataSeo: Record<string, any>;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface Programme {
    id: string;
    name: string;
  }
  