"use client";

import { useState, useEffect } from "react";
import { EditorContent, useEditor, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";

const MenuBar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="control-group">
      <div className="button-group">
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={editor.isActive("heading", { level: 1 }) ? "is-active" : ""}>
          H1
        </button>
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive("heading", { level: 2 }) ? "is-active" : ""}>
          H2
        </button>
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={editor.isActive("heading", { level: 3 }) ? "is-active" : ""}>
          H3
        </button>
        <button onClick={() => editor.chain().focus().setParagraph().run()} className={editor.isActive("paragraph") ? "is-active" : ""}>
          Paragraph
        </button>
        <button onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive("bold") ? "is-active" : ""}>
          Bold
        </button>
        <button onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive("italic") ? "is-active" : ""}>
          Italic
        </button>
        <button onClick={() => editor.chain().focus().toggleStrike().run()} className={editor.isActive("strike") ? "is-active" : ""}>
          Strike
        </button>
        <button onClick={() => editor.chain().focus().toggleHighlight().run()} className={editor.isActive("highlight") ? "is-active" : ""}>
          Highlight
        </button>
        <button onClick={() => editor.chain().focus().setTextAlign("left").run()} className={editor.isActive({ textAlign: "left" }) ? "is-active" : ""}>
          Left
        </button>
        <button onClick={() => editor.chain().focus().setTextAlign("center").run()} className={editor.isActive({ textAlign: "center" }) ? "is-active" : ""}>
          Center
        </button>
        <button onClick={() => editor.chain().focus().setTextAlign("right").run()} className={editor.isActive({ textAlign: "right" }) ? "is-active" : ""}>
          Right
        </button>
        <button onClick={() => editor.chain().focus().setTextAlign("justify").run()} className={editor.isActive({ textAlign: "justify" }) ? "is-active" : ""}>
          Justify
        </button>
      </div>
    </div>
  );
};

export default function RichTextEditor() {
  // Store the editor content in state
  const [content, setContent] = useState(`
    <h3 style="text-align:center">
      Devs Just Want to Have Fun by Cyndi Lauper
    </h3>
    <p style="text-align:center">
      I come home in the morning light<br>
      My mother says, <mark>“When you gonna live your life right?”</mark><br>
      Oh mother dear we’re not the fortunate ones<br>
      And devs, they wanna have fun<br>
      Oh devs just want to have fun</p>
    <p style="text-align:center">
      The phone rings in the middle of the night<br>
      My father yells, "What you gonna do with your life?"<br>
      Oh daddy dear, you know you’re still number one<br>
      But <s>girls</s> devs, they wanna have fun<br>
      Oh devs just want to have
    </p>
    <p style="text-align:center">
      That’s all they really want<br>
      Some fun<br>
      When the working day is done<br>
      Oh devs, they wanna have fun<br>
      Oh devs just wanna have fun<br>
      (devs, they wanna, wanna have fun, devs wanna have)
    </p>
  `);

  // Initialize the editor with the stored content
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight,
    ],
    content,
    editorProps: {
      attributes: {
        class: "prose focus:outline-none border border-gray-300 p-3 min-h-[200px]",
      },
    },
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML()); // Store content in state
    },
  });

  // Ensure editor updates when `content` changes externally
  useEffect(() => {
    if (editor && editor.getHTML() !== content) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  return (
    <div>
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />

      {/* Show the stored content */}
      <div className="mt-4">
        <h2>Stored Content (Preview)</h2>
        <div className="border p-3" dangerouslySetInnerHTML={{ __html: content }} />
      </div>

      {/* Simulated Save Button */}
      <button
        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
        onClick={() => console.log("Saving Content:", content)}
      >
        Save Content
      </button>
    </div>
  );
}
