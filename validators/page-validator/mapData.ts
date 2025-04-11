
import { droppedItemArraySchema, DroppedItem } from './droppedItemSchema';

export function mapData(input: any): DroppedItem[] {
  const result = droppedItemArraySchema.safeParse(input);
  if (!result.success) {
    throw new Error(`mapData validation failed: ${result.error.issues.map(i => i.message).join(', ')}`);
  }
  return result.data;
}
