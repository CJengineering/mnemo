'use client';
import { Edit3, Trash2 } from 'lucide-react';
import { DroppedItem } from '../type';
import { getSemanticLabel } from './getSemanticLabel';

export function renderLibraryPreview(block: DroppedItem) {
  const controls = (
    <div className="flex justify-between">
      <div className="w-16 text-xs border bg-slate-200 border-gray-300 p-2 text-center font-bold">
        J-PAL
      </div>

      <div className="flex gap-2">
        <button className="border border-gray-300 p-2 inline-flex items-center justify-center">
          <Edit3 size={16} />
        </button>
        <button className="border border-gray-300 p-2 inline-flex items-center justify-center">
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );

  // IMAGE
  if (block.image) {
    return (
      <div className="border border-gray-300 p-4 mb-4 font-sans bg-white">
        <div className="font-bold capitalize">{getSemanticLabel(block.type)}</div>
        <img
          src={block.image.src}
          alt={block.image.alt}
          width={block.image.width}
          height={block.image.height}
          className="border border-gray-300"
        />
        {controls}
      </div>
    );
  }

  // RICH TEXT
  if (block.type === 'rich-text') {
    return (
      <div className="border border-gray-300 p-4 mb-4 font-sans bg-white">
        <div className="font-bold capitalize">{getSemanticLabel(block.type)}</div>
        <div className="p-2"></div>
        <div
          dangerouslySetInnerHTML={{ __html: block.content }}
          className="prose text-sm"
        />
        <div className="p-2"></div>
        {controls}
      </div>
    );
  }

  // BUTTON / LINK
  if (block.button?.url) {
    return (
      <div className="border border-gray-300 p-4 mb-4 font-sans bg-white">
        <div className="font-bold capitalize">{getSemanticLabel(block.type)}</div>
        <div className="p-2"></div>
        <a
          href={block.button.url}
          className="text-xs underline break-all"
          target="_blank"
          rel="noopener noreferrer"
        >
          {block.content} → {block.button.url}
        </a>
        <div className="p-2"></div>
        {controls}
      </div>
    );
  }

  // DEFAULT CONTENT
  return (
    <div className="border border-gray-300 p-4 mb-4 font-sans bg-white">
      <div className="font-bold capitalize">{getSemanticLabel(block.type)}</div>
      <div className="p-2"></div>
      <div className="text-sm">{block.content}</div>
      <div className="p-2"></div>
      {controls}
    </div>
  );
}
