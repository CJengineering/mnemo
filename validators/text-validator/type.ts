export type TextData = string;

export type MetaData = {
  version: string;
  editor: string;
  datePublished?: string | null;
  website?: string | null;
  keywords?: string[];
};

export type MappedTextObject = {
  data: TextData;
  metaData: MetaData;
};
