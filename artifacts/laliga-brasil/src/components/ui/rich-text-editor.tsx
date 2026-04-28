import React, { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import {
  Bold, Italic, List, ListOrdered, Heading1, Heading2,
  Link as LinkIcon, Quote, Code, Undo2, Redo2,
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

function ToolbarButton({
  onClick, active, title, children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded transition-colors ${
        active
          ? "bg-primary text-white"
          : "text-muted-foreground hover:text-white hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Escreva o conteúdo aqui...",
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "min-h-[520px] text-gray-200 text-[17px] leading-[1.8] focus:outline-none prose prose-invert max-w-none prose-p:text-gray-200 prose-headings:text-white prose-strong:text-white prose-a:text-primary",
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value, false);
    }
  }, [value, editor]);

  if (!editor) {
    return (
      <div className="text-muted-foreground text-sm py-8 text-center">
        Carregando editor...
      </div>
    );
  }

  return (
    <div>
      {/* Formatting toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 mb-5 pb-3 border-b border-white/8">
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Negrito">
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Itálico">
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} title="Código inline">
          <Code className="w-4 h-4" />
        </ToolbarButton>

        <span className="w-px h-4 bg-white/10 mx-1" />

        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} title="Título 1">
          <Heading1 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Título 2">
          <Heading2 className="w-4 h-4" />
        </ToolbarButton>

        <span className="w-px h-4 bg-white/10 mx-1" />

        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Lista">
          <List className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Lista numerada">
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Citação">
          <Quote className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => {
            const url = prompt("URL do link:");
            if (url) editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
          }}
          active={editor.isActive("link")}
          title="Inserir link"
        >
          <LinkIcon className="w-4 h-4" />
        </ToolbarButton>

        <span className="w-px h-4 bg-white/10 mx-1" />

        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Desfazer">
          <Undo2 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Refazer">
          <Redo2 className="w-4 h-4" />
        </ToolbarButton>
      </div>

      <div className="relative">
        <EditorContent editor={editor} />
        {(!value || value === "<p></p>") && (
          <p className="absolute top-0 left-0 text-[17px] text-white/20 pointer-events-none select-none">
            {placeholder}
          </p>
        )}
      </div>
    </div>
  );
}
