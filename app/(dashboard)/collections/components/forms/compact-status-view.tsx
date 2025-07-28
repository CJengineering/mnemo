'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Edit, Eye, Trash2 } from 'lucide-react';

interface CompactStatusViewProps {
  title: string;
  slug: string;
  status: 'published' | 'draft';
  itemId?: string;
  publishDate?: string;
  onEdit: () => void;
  onPreview?: () => void;
  onDelete?: () => void;
}

export function CompactStatusView({
  title,
  slug,
  status,
  itemId,
  publishDate,
  onEdit,
  onPreview,
  onDelete
}: CompactStatusViewProps) {
  return (
    <Card className="w-full">
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            {/* Title */}
            <h3 className="text-xs font-medium truncate text-white">
              {title || 'Untitled'}
            </h3>

            {/* Status and Metadata */}
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant={status === 'published' ? 'default' : 'secondary'}
                className="text-[8px] px-1 py-0 h-4"
              >
                {status === 'published' ? 'Published' : 'Draft'}
              </Badge>

              {itemId && (
                <span className="text-[8px] text-gray-500">ID: {itemId}</span>
              )}

              {publishDate && (
                <span className="text-[8px] text-gray-500">
                  {new Date(publishDate).toLocaleDateString()}
                </span>
              )}
            </div>

            {/* Slug */}
            <div className="mt-1">
              <span className="text-[8px] text-gray-400">Slug:</span>
              <span className="text-[8px] text-gray-600 ml-1 font-mono">
                /{slug || 'no-slug'}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 ml-2">
            {onPreview && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onPreview}
                className="h-6 w-6 p-0"
              >
                <Eye className="h-3 w-3" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="h-6 w-6 p-0"
            >
              <Edit className="h-3 w-3" />
            </Button>
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
