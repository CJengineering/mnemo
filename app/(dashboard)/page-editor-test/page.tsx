import Editor from 'app/page-editor/editor-page';
import { Suspense } from 'react';

// Text/Image Library

// Central Block Config

export default function EditorPage() {
  return (
    <Suspense fallback={<div>Loading ...</div>}>
      <Editor />
    </Suspense>
  );
}
