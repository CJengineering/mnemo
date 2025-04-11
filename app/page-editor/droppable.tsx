import { useDroppable } from '@dnd-kit/core';
import { PanelsTopLeft } from 'lucide-react';

export function DroppableArea({
  id,
  children
}: {
  id: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id,  });

  return (
    <div
      ref={setNodeRef}
      className={`w-full min-h-screen p-4 border-2 border-dashed rounded transition ${
        isOver ? 'border-purple-500 bg-purple-50' : 'border-purple-300'
      }`}
    >
      <div className="flex items-center mb-2 space-x-2 ">
        <PanelsTopLeft className="text-purple-800" />
        <div className=" text-purple-800 text-xl ">BUILD</div>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
