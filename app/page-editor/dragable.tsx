import { useDraggable } from "@dnd-kit/core";
import { BlockType, DroppedItem, ImageType } from "./type";
import { CSS } from '@dnd-kit/utilities';

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
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id,
      data: { from, content, type, image, button, link }
    });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}