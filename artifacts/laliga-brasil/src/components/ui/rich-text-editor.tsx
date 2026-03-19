import React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import {
  Bold, Italic, List, ListOrdered, Heading1, Heading2, Link as LinkIcon, Quote, Code,
  Undo2, Redo2
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ value, onChange, placeholder = "Escreva o conteúdo aqui..." }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-invert max-w-none bg-background border border-border rounded-lg px-4 py-3 text-gray-300 focus:border-primary focus:outline-none transition-all min-h-[400px]",
      },
    },
  });

  if (!editor) {
    return <div>Carregando editor...</div>;
  }

  const ToolButton = ({ 
    onClick, 
    isActive, 
    icon: Icon, 
    title 
  }: { 
    onClick: () => void; 
    isActive: boolean; 
    icon: React.ComponentType<{ className?: string }>; 
    title: string 
  }) => (
    <button
      onClick={onClick}
      title={title}
      className={`p-2 rounded transition-colors ${
        isActive 
          ? "bg-primary text-white" 
          : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-white"
      }`}
    >
      <Icon className="w-4 h-4" />
    </button>
  );

  return (
    <div className="space-y-3">
      <div className="bg-card border border-border rounded-lg p-3 flex flex-wrap gap-1">
        <ToolButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive("bold")}
          icon={<Bold className="w-4 h-4" />}
          title="Negrito"
        />
        <ToolButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive("italic")}
          icon={<Italic className="w-4 h-4" />}
          title="Itálico"
        />
        <ToolButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          isActive={editor.isActive("codeBlock")}
          icon={<Code className="w-4 h-4" />}
          title="Bloco de Código"
        />
        
        <div className="w-px bg-border mx-1" />
        
        <ToolButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive("heading", { level: 1 })}
          icon={<Heading1 className="w-4 h-4" />}
          title="Título 1"
        />
        <ToolButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive("heading", { level: 2 })}
          icon={<Heading2 className="w-4 h-4" />}
          title="Título 2"
        />
        
        <div className="w-px bg-border mx-1" />
        
        <ToolButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive("bulletList")}
          icon={<List className="w-4 h-4" />}
          title="Lista"
        />
        <ToolButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive("orderedList")}
          icon={<ListOrdered className="w-4 h-4" />}
          title="Lista Numerada"
        />
        <ToolButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive("blockquote")}
          icon={<Quote className="w-4 h-4" />}
          title="Citação"
        />
        
        <div className="w-px bg-border mx-1" />
        
        <ToolButton
          onClick={() => {
            const url = prompt("URL:");
            if (url) editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
          }}
          isActive={editor.isActive("link")}
          icon={<LinkIcon className="w-4 h-4" />}
          title="Link"
        />
        
        <div className="w-px bg-border mx-1" />
        
        <ToolButton
          onClick={() => editor.chain().focus().undo().run()}
          isActive={false}
          icon={<Undo2 className="w-4 h-4" />}
          title="Desfazer"
        />
        <ToolButton
          onClick={() => editor.chain().focus().redo().run()}
          isActive={false}
          icon={<Redo2 className="w-4 h-4" />}
          title="Refazer"
        />
      </div>
      
      <EditorContent editor={editor} />
    </div>
  );
}
