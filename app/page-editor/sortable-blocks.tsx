import { useSortable } from '@dnd-kit/sortable';
import { BlockType, DroppedItem } from './type';
import { CSS } from '@dnd-kit/utilities';
import { BLOCKS_CONFIG } from './block-config';
import { ParagraphControls } from './paragraph-controls';
import { ButtonEditor } from './button-editor';
import { LinkEditor } from './link-editor';
import { EmbedEditor } from './embed-editor';
import { ListTypeSelector } from './list-type-selector';
import { BlockTypeSelector } from './block-type-selector';
import { GripVertical } from 'lucide-react';
import { ContainerTypeSelector } from './container-type-selector';
export function SortableBlock({
  item,
  updateType,
  removeItem,
  updateFormat,
  updateText,
  updateButton,
  updateListType,
  updateContainerType
}: {
  item: DroppedItem;
  updateType: (id: string, type: BlockType) => void;
  updateContainerType: (
    id: string,
    type: string
  ) => void;
  removeItem: (id: string) => void;
  updateText: (id: string, content: string) => void;
  updateButton: (
    id: string,
    button: { url: string; isExternal: boolean }
  ) => void;
  updateListType: (id: string, type: 'bullet' | 'numbered') => void;
  updateFormat: (
    id: string,
    formatUpdate: Partial<DroppedItem['format']>
  ) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="flex items-center justify-between gap-2 bg-white p-2 rounded border shadow"
    >
      <div
        {...listeners}
        className="cursor-move pr-2  text-gray-400"
        title="Drag"
      >
        <GripVertical size={16} />
      </div>
      <div className="flex-1">
        {BLOCKS_CONFIG[item.type].render(item, 'edit')}
      </div>
      <div className="flex gap-2 items-center">
        {item.type === 'link' && (
          <LinkEditor
            value={{
              label: item.content,
              url: item.button?.url,
              isExternal: item.button?.isExternal
            }}
            onLabelChange={(text) => updateText(item.id, text)}
            onUrlChange={(url) =>
              updateButton(item.id, {
                url,
                isExternal: item.button?.isExternal ?? false
              })
            }
            onToggleExternal={(val) =>
              updateButton(item.id, {
                url: item.button?.url ?? '',
                isExternal: val
              })
            }
          />
        )}{' '}
        {item.type === 'embed' && (
          <EmbedEditor
            value={item.content}
            onChange={(html) => updateText(item.id, html)}
          />
        )}
        {item.type === 'video' && (
          <input
            type="text"
            placeholder="Video URL"
            value={item.content}
            onChange={(e) => updateText(item.id, e.target.value)}
            className="border px-2 py-1 rounded text-sm mt-2 w-full"
          />
        )}
        {item.type === 'ul' && (
          <ListTypeSelector
            value={item.listType ?? 'bullet'}
            onChange={(val) => updateListType(item.id, val)}
          />
        )}
        {item.type === 'postAccordion' && (
          <ContainerTypeSelector
            value={item.containerType ?? 'block'}
            onChange={(val) => updateContainerType(item.id, val)}
          />
        )}
        {item.type === 'button' && (
          <ButtonEditor
            value={{
              content: item.content,
              url: item.button?.url,
              isExternal: item.button?.isExternal
            }}
            onContentChange={(text) => updateText(item.id, text)}
            onUrlChange={(url) =>
              updateButton(item.id, {
                url,
                isExternal: item.button?.isExternal ?? false
              })
            }
            onToggleExternal={(val) =>
              updateButton(item.id, {
                url: item.button?.url ?? '',
                isExternal: val
              })
            }
          />
        )}
        {item.type === 'p' && (
          <ParagraphControls
            format={item.format}
            onChange={(update) => updateFormat(item.id, update)}
          />
        )}
        {!['img', 'video', 'link', 'rich-text', 'embed', 'button','postAccordion'].includes(
          item.type
        ) && (
          <BlockTypeSelector
            value={item.type}
            onChange={(val) => updateType(item.id, val)}
          />
        )}
        <button
          className="text-red-500 text-sm"
          onClick={() => removeItem(item.id)}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
