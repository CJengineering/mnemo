import { DroppedItem } from 'app/page-editor/type';
import { v4 as uuidv4 } from 'uuid';
type Programme = {
  id: string;
  title: string;
  description?: string;
  shortTitle?: string;
  acronym?: string;
  data?: any;
  createdAt: Date;
  updatedAt: Date;
};
type PageBlock = DroppedItem & { createdAt: Date };
type Page = {
  id: string;
  slug: string;
  data?: DroppedItem[];
  dataHtml?: { rawHtml: string };
  dataSeo?: {
    title: string;
    description: string;
    keywords: string[];
  };
  createdAt: Date;
  updatedAt: Date;
};
type Content = {
  id: string;
  programmeId: string;
  title: string;
  description?: string;
  status: 'draft' | 'published' | 'archived';
  createdAt: Date;
  updatedAt: Date;
};

type DataChunk = {
  id: string;
  programmeId: string;
  name: string;
  type: 'text' | 'rich_text' | 'image' | 'video' | 'link'|'embed';
  metaData?: any;
  data: any;
  createdAt: Date;
  updatedAt: Date;
};

export class FakeDatabase {
  private programmes: Programme[] = [];
  private content: Content[] = [];
  private dataChunks: DataChunk[] = [];
  private pages: Page[] = [];
  private droppedItems: PageBlock[] = [];

  /** Reset Fake Database (Used Before Each Test) */
  reset() {
    this.programmes = [];
    this.content = [];
    this.dataChunks = [];
    this.pages = [];
  }

  /** Simulate Auto-ID Generation */
  private generateId(): string {
    return uuidv4();
  }
  createPage(
    slug: string,
    droppedItems: DroppedItem[] = [],
    dataHtml: { rawHtml: string } = { rawHtml: '' },
    dataSeo: { title: string; description: string; keywords: string[] } = {
      title: '',
      description: '',
      keywords: []
    }
  ): Page {
    const baseSlug = slug;
    let uniqueSlug = baseSlug;
    let suffix = 1;

    while (this.pages.some((p) => p.slug === uniqueSlug)) {
      uniqueSlug = `${baseSlug}-${suffix}`;
      suffix++;
    }

    const newPage: Page = {
      id: this.generateId(),
      slug: uniqueSlug,
      data: droppedItems,
      dataHtml,
      dataSeo,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.pages.push(newPage);
    return newPage;
  }
  insertBlocksToPage(slug: string, blocks: DroppedItem[]): Page | undefined {
    const page = this.pages.find((p) => p.slug === slug);
    if (!page) return undefined;

    if (!page.data) {
      page.data = [];
    }
    page.data.push(...blocks);
    page.updatedAt = new Date();
    return page;
  }

  insertDroppedItems(items: DroppedItem[]): PageBlock[] {
    const saved = items.map((item) => ({
      ...item,
      createdAt: new Date()
    }));
    this.droppedItems.push(...saved);
    return saved;
  }

  getDroppedItems(): PageBlock[] {
    return this.droppedItems;
  }

  getPageBySlug(slug: string): Page | undefined {
    return this.pages.find((page) => page.slug === slug);
  }

  /** Create Programme */
  createProgramme(
    title: string,
    description?: string,
    shortTitle?: string,
    acronym?: string
  ): Programme {
    const newProgramme: Programme = {
      id: this.generateId(),
      title,
      description,
      shortTitle,
      acronym,
      data: {},
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.programmes.push(newProgramme);
    return newProgramme;
  }

  /** Get All Programmes */
  getProgrammes(): Programme[] {
    return this.programmes;
  }

  /** Create Content */
  createContent(
    programmeId: string,
    title: string,
    description?: string,
    status: 'draft' | 'published' | 'archived' = 'draft'
  ): Content {
    const newContent: Content = {
      id: this.generateId(),
      programmeId,
      title,
      description,
      status,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.content.push(newContent);
    return newContent;
  }

  /** Get Content by Programme */
  getContentByProgramme(programmeId: string): Content[] {
    return this.content.filter((c) => c.programmeId === programmeId);
  }

  /** Create Data Chunk */
  createDataChunk(
    programmeId: string,
    name: string,
    type: 'text' | 'rich_text' | 'image' | 'video' | 'link'|'embed',
    data: any,
    metaData = {}
  ): DataChunk {
    const newDataChunk: DataChunk = {
      id: this.generateId(),
      programmeId,
      name,
      type,
      data,
      metaData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.dataChunks.push(newDataChunk);
    return newDataChunk; // ✅ Fix: Returns the created object
  }

  deleteDataChunk(chunkId: string): void {
    this.dataChunks = this.dataChunks.filter((chunk) => chunk.id !== chunkId);
  }
  /** Get Data Chunks by Programme */
  getDataChunksByProgramme(programmeId: string): DataChunk[] {
    return this.dataChunks.filter((d) => d.programmeId === programmeId);
  }
}
