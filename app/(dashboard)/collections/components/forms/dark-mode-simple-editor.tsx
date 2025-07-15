'use client';

import React, { useEffect } from 'react';
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
  useEffect(() => {
    // Force dark mode on the document element when this editor mounts
    const originalClassList =
      document.documentElement.classList.contains('dark');

    // Add dark class if not already present
    if (!originalClassList) {
      document.documentElement.classList.add('dark');
    }

    // Cleanup function to restore original state when component unmounts
    return () => {
      // Only remove dark class if it wasn't there originally
      if (!originalClassList) {
        document.documentElement.classList.remove('dark');
      }
    };
  }, []);

  return (
    <div className="dark-mode-editor-wrapper">
      {/* Force dark mode context for this editor instance */}
      <div className="dark">
        <SimpleEditor initialContent={initialContent} onChange={onChange} />
      </div>
    </div>
  );
}
