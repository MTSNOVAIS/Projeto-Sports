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

  return (
    <div className="space-y-3">
      <div className="bg-card border border-border rounded-lg p-3 flex flex-wrap gap-1">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded transition-colors ${
            editor.isActive("bold") 
              ? "bg-primary text-white" 
              : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-white"
          }`}
          title="Negrito"
        >
          <Bold className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded transition-colors ${
            editor.isActive("italic") 
              ? "bg-primary text-white" 
              : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-white"
          }`}
          title="Itálico"
        >
          <Italic className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`p-2 rounded transition-colors ${
            editor.isActive("codeBlock") 
              ? "bg-primary text-white" 
              : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-white"
          }`}
          title="Bloco de Código"
        >
          <Code className="w-4 h-4" />
        </button>
        
        <div className="w-px bg-border mx-1" />
        
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-2 rounded transition-colors ${
            editor.isActive("heading", { level: 1 }) 
              ? "bg-primary text-white" 
              : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-white"
          }`}
          title="Título 1"
        >
          <Heading1 className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-2 rounded transition-colors ${
            editor.isActive("heading", { level: 2 }) 
              ? "bg-primary text-white" 
              : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-white"
          }`}
          title="Título 2"
        >
          <Heading2 className="w-4 h-4" />
        </button>
        
        <div className="w-px bg-border mx-1" />
        
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded transition-colors ${
            editor.isActive("bulletList") 
              ? "bg-primary text-white" 
              : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-white"
          }`}
          title="Lista"
        >
          <List className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded transition-colors ${
            editor.isActive("orderedList") 
              ? "bg-primary text-white" 
              : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-white"
          }`}
          title="Lista Numerada"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-2 rounded transition-colors ${
            editor.isActive("blockquote") 
              ? "bg-primary text-white" 
              : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-white"
          }`}
          title="Citação"
        >
          <Quote className="w-4 h-4" />
        </button>
        
        <div className="w-px bg-border mx-1" />
        
        <button
          onClick={() => {
            const url = prompt("URL:");
            if (url) editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
          }}
          className={`p-2 rounded transition-colors ${
            editor.isActive("link") 
              ? "bg-primary text-white" 
              : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-white"
          }`}
          title="Link"
        >
          <LinkIcon className="w-4 h-4" />
        </button>
        
        <div className="w-px bg-border mx-1" />
        
        <button
          onClick={() => editor.chain().focus().undo().run()}
          className="p-2 rounded transition-colors bg-muted hover:bg-muted/80 text-muted-foreground hover:text-white"
          title="Desfazer"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => editor.chain().focus().redo().run()}
          className="p-2 rounded transition-colors bg-muted hover:bg-muted/80 text-muted-foreground hover:text-white"
          title="Refazer"
        >
          <Redo2 className="w-4 h-4" />
        </button>
      </div>
      
      <EditorContent editor={editor} />
    </div>
  );
}
