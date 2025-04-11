import { DataChunk } from "@/components/mnemo-context/type";
import { DroppedItem } from "app/page-editor/type";
import { mapDataChunkToDroppedItem } from "./mapDataChunkToDroppedItem";

export function mapAllChunksToDroppedItems(chunks: DataChunk[]): DroppedItem[] {
    return chunks.map(mapDataChunkToDroppedItem);
  }