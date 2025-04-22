'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { BlockType, DroppedItem, ImageType } from './type';
import { GripVertical } from 'lucide-react'; // or your icon of choice

export function Draggable({
  id,
  content,
  from,
  type,
  image,
  button,
  link,
  children
}: {
  id: string;
  content: string;
  from: 'library';
  image?: ImageType;
  button?: DroppedItem['button'];
  link?: DroppedItem['link'];
  type: BlockType;
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging
  } = useDraggable({
    id,
    data: { from, content, type, image, button, link }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative p-2 bg-white border rounded shadow prose text-sm"
    >
      {/* Drag handle (only this is draggable) */}
      <button
        {...listeners}
        {...attributes}
        className="absolute top-2 right-2 p-2 rounded-full bg-white border border-gray-300 hover:bg-gray-200 text-gray-600 hover:text-black cursor-grab shadow-md"

        style={{ touchAction: 'none' }}
      >
        <GripVertical size={20} />
      </button>

      {/* Rest of the content is fully interactive */}
      {children}
    </div>
  );
}
