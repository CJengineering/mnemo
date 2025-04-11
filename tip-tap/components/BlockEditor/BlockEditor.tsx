import { EditorContent } from '@tiptap/react'
import React, { useRef, useState } from 'react'



import { useBlockEditor } from '../../hooks/useBlockEditor'

import '@/tip-tap/styles/index.css'

import { Sidebar } from '../Sidebar'
import ImageBlockMenu from '../../extensions/ImageBlock/components/ImageBlockMenu'
import { ColumnsMenu } from '../../extensions/MultiColumn/menus'
import { TableColumnMenu, TableRowMenu } from '../../extensions/Table/menus'
import { EditorHeader } from './components/EditorHeader'
import { TextMenu } from '../menus/TextMenu'
import { ContentItemMenu } from '../menus/ContentItemMenu'
import { useSidebar } from '../../hooks/useSidebar'
import * as Y from 'yjs'
import { TiptapCollabProvider } from '@hocuspocus/provider'
import { LinkMenu } from '../menus'

export const BlockEditor = ({
  aiToken,
  ydoc,
  provider,
}: {
  aiToken?: string
  ydoc: Y.Doc | null
  provider?: TiptapCollabProvider | null | undefined
}) => {
  const [isEditable, setIsEditable] = useState(true)
  const menuContainerRef = useRef(null)

  const leftSidebar = useSidebar()
  const { editor, users, collabState } = useBlockEditor({
    aiToken,
    ydoc,
    provider,
    onTransaction({ editor: currentEditor }) {
      setIsEditable(currentEditor.isEditable)
    },
  })
 console.log('BlockEditor', editor.getJSON())
 const saveContent = async () => {
  if (!editor) return;

  const contentHTML = editor.getHTML(); // Get editor content as HTML

  try {
    const response = await fetch("/api/rich-text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: contentHTML, // Send HTML content
      }),
    });

    const result = await response.json();
    console.log("Server response:", result);

    if (!response.ok) {
      throw new Error(result.error || "Unknown error");
    }
  } catch (error) {
    console.error("Failed to save content:", error);
  }
};


  if (!editor || !users) {
    return null
  }

  return (
    <div className="flex  h-full" ref={menuContainerRef}>
      {/* <Sidebar isOpen={leftSidebar.isOpen} onClose={leftSidebar.close} editor={editor} /> */}
      <button onClick={saveContent} className="p-2 bg-blue-500 text-white rounded">
          Save
        </button>
      <div className="relative flex flex-col flex-1 h-full overflow-hidden ">
        {/* <EditorHeader
          editor={editor}
          collabState={collabState}
          users={users}
          isSidebarOpen={leftSidebar.isOpen}
          toggleSidebar={leftSidebar.toggle}
        /> */}
        <EditorContent editor={editor} className="flex-1 overflow-y-auto " />
        <ContentItemMenu editor={editor} isEditable={isEditable} />
        <LinkMenu editor={editor} appendTo={menuContainerRef} />
        <TextMenu editor={editor} />
        <ColumnsMenu editor={editor} appendTo={menuContainerRef} />
        <TableRowMenu editor={editor} appendTo={menuContainerRef} />
        <TableColumnMenu editor={editor} appendTo={menuContainerRef} />
        <ImageBlockMenu editor={editor} appendTo={menuContainerRef} />
      </div>
    </div>
  )
}

export default BlockEditor
