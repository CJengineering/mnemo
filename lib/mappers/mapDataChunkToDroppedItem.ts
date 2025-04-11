import { DataChunk } from "@/components/mnemo-context/type";
import { BlockType, DroppedItem } from "app/page-editor/type";


export function mapDataChunkToDroppedItem(chunk: DataChunk): DroppedItem {
  let parsedData: any = chunk.data;

  // Parse stringified JSON if needed
  if (typeof chunk.data === 'string') {
    try {
      parsedData = JSON.parse(chunk.data);
    } catch {
      parsedData = { content: chunk.data }; // fallback
    }
  }

  return {
    id: String(chunk.id),
    type: chunk.type as BlockType,
    content: parsedData?.content ?? '',
    image: parsedData?.image || parsedData?.url
      ? {
          src: parsedData.url ?? '',
          alt: parsedData.alt ?? '',
          width: parsedData.width ?? 800,
          height: parsedData.height ?? 600,
        }
      : undefined,
    button: parsedData?.button
      ? {
          url: parsedData.button.url,
          isExternal: parsedData.button.isExternal ?? false,
        }
      : undefined,
    format: parsedData?.format,
    containerType: parsedData?.containerType,
    listType: parsedData?.listType,
    link: parsedData?.link,
    children: parsedData?.children as DroppedItem[] | undefined,
  };
}
