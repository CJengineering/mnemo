import { useDroppable } from '@dnd-kit/core';
import { DroppedItem } from './type';

export function AccordionDroppable({
  id,
  children,
  onDrop
}: {
  id: string;
  children: React.ReactNode;
  onDrop?: (id: string, dropped: DroppedItem) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`border-2 mt-2 p-2 rounded ${
        isOver ? 'border-green-500 bg-green-50' : 'border-gray-200'
      }`}
    >
      {children}
      {isOver && <div className="text-xs text-green-600">Drop here</div>}
    </div>
  );
}
