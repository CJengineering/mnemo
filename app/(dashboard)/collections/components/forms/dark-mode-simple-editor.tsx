'use client';

import React from 'react';
import { SimpleEditor } from 'app/page-editor/@/components/tiptap-templates/simple/simple-editor';

interface DarkModeSimpleEditorProps {
  initialContent?: string;
  onChange?: (content: string) => void;
}

/**
 * A wrapper around SimpleEditor that forces dark mode for collections forms.
 * This ensures the rich text editor always uses dark theme regardless of system preference.
 */
export function DarkModeSimpleEditor({
  initialContent,
  onChange
}: DarkModeSimpleEditorProps) {
  // Remove the global document manipulation that was causing the black screen issue
  // Instead, we'll rely on the local dark class wrapper

  return (
    <div className="dark-mode-editor-wrapper bg-gray-900">
      {/* Force dark mode context for this editor instance only */}
      <div className="dark bg-gray-900 rounded-lg border border-gray-700">
        <div className="bg-gray-900 text-white">
          <SimpleEditor initialContent={initialContent} onChange={onChange} />
        </div>
      </div>
    </div>
  );
}
