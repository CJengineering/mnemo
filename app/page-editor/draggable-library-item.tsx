'use client';

import { Draggable } from './dragable';
import { DroppedItem, BlockType } from './type';
import { renderLibraryPreview } from './utils/renderLibraryPreview';


export function DraggableLibraryItem({ block }: { block: DroppedItem }) {
  return (
    <Draggable
      key={block.id}
      id={block.id}
      content={block.content}
      from="library"
      type={block.type as BlockType}
      image={block.image}
      button={block.button}
   
      link={block.button}
    >
      <div className="p-2 bg-white border rounded shadow cursor-move prose text-sm">
        {renderLibraryPreview(block)}
      </div>
    </Draggable>
  );
}
