'use client';

import { useEffect, useState } from 'react';
import { Edit3, Trash2 } from 'lucide-react';
import { BlockType, DroppedItem } from '../type';
import { getSemanticLabel } from './getSemanticLabel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { TextDataForm } from '@/validators/text-validator/components/textDataForm';

export function renderLibraryPreview(
  block: DroppedItem,
  onDelete?: (id: string) => void
) {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editedContent, setEditedContent] = useState(block.content || '');
  const [isDeleting, setIsDeleting] = useState(false);
  // useEffect(() => {
  //   const shouldLock = isEditing || showDeleteConfirm;
  
  //   if (shouldLock) {
  //     document.body.style.overflow = 'hidden';
  //   } else {
  //     document.body.style.overflow = '';
  //   }
  
  //   return () => {
  //     document.body.style.overflow = '';
  //   };
  // }, [isEditing, showDeleteConfirm]);
  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    try {
      const fakeEditEndpoint = async (data: {
        id: any;
        content?: string;
        type?: BlockType;
      }) => {
        await new Promise((resolve) => setTimeout(resolve, 800));
        return {
          success: true,
          message: `Item ${data.id} updated successfully`,
          updatedItem: { ...data }
        };
      };

      const updateData = {
        id: block.id,
        content: editedContent,
        type: block.type
      };

      const response = await fakeEditEndpoint(updateData);
      console.log('Edit response from server:', response);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save edit to database:', error);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);

      const fakeDeleteEndpoint = async (id: string) => {
        await new Promise((resolve) => setTimeout(resolve, 800));
        return { success: true, message: `Item ${id} deleted successfully` };
      };

      const response = await fakeDeleteEndpoint(block.id);
      console.log('Delete response from server:', response);

      if (response.success && onDelete && block.id) {
        onDelete(block.id);
      }

      setIsDeleting(false);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Failed to delete item from database:', error);
      setIsDeleting(false);
    }
  };

  const renderEditForm = () => {
    if (block.type === 'rich-text') {
      return (
        <Textarea
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
          className="min-h-32"
        />
      );
    } else if (block.button?.url) {
      return (
        <>
          <label className="text-sm font-medium">Text</label>
          <Input
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
          />
          <label className="text-sm font-medium mt-4">URL</label>
          <Input value={block.button.url} disabled />
        </>
      );
    } else {
      return (
        <Input
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
        />
      );
    }
  };

  const controls = (
    <div className="flex justify-between">
      <div className="w-48 text-xs border bg-slate-200 border-gray-300 p-2 text-center font-bold">
        {block.programme}
      </div>

      <div className="flex gap-2">
        <button
          className="drag-cancel p-2 border"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleEdit();
          }}
        >
          <Edit3 size={16} />
        </button>

        <button
          className="border border-gray-300 p-2 inline-flex items-center justify-center"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowDeleteConfirm(true);
          }}
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
         <div className="bg-white p-6 rounded-md w-full w-xl max-h-[90vh] overflow-y-auto relative cursor-default">


            <button
              onClick={() => setIsEditing(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-black"
            >
              ✕
            </button>
            <div className="text-lg font-semibold mb-4">Edit Content</div>
            <div className="space-y-4"><TextDataForm id={block.id}/></div>
       
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-md w-full max-w-md">
            <h2 className="text-lg font-semibold mb-2">Confirm deletion</h2>
            <p className="mb-2">
              Are you sure you want to delete this {getSemanticLabel(block.type)}?
            </p>
            <p className="text-sm text-gray-500 mb-4">
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Render per type
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <div className="border border-gray-300 p-4 mb-4 font-sans bg-white">
      <div className="font-bold capitalize">{getSemanticLabel(block.type)}</div>
      <div className="p-2" />
      {children}
      <div className="p-2" />
      {controls}
    </div>
  );

  if (block.image) {
    return (
      <Wrapper>
        <img
          src={block.image.src}
          alt={block.image.alt}
          width={block.image.width}
          height={block.image.height}
          className="border border-gray-300"
        />
      </Wrapper>
    );
  }

  if (block.type === 'rich-text') {
    return (
      <Wrapper>
        <div dangerouslySetInnerHTML={{ __html: block.content }} className=" text-sm" />
      </Wrapper>
    );
  }

  if (block.button?.url) {
    return (
      <Wrapper>
        <a
          href={block.button.url}
          className="text-xs underline break-all"
          target="_blank"
          rel="noopener noreferrer"
        >
          {block.content} → {block.button.url}
        </a>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <div className="text-sm">{block.content}</div>
    </Wrapper>
  );
}
