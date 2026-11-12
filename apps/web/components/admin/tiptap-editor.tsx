'use client';

import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TiptapLink from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { apiUpload } from '@/lib/api-client';
import { resolveMediaUrl, rewriteMediaUrlsInHtml } from '@/lib/media-url';
import {
  Bold,
  Heading1,
  Heading2,
  Heading3,
  ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
} from 'lucide-react';

interface TiptapEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function TiptapEditor({
  value,
  onChange,
  placeholder = 'Nhập nội dung...',
}: TiptapEditorProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [imageError, setImageError] = useState('');
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      TiptapLink.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-[#D4A574] underline' },
      }),
      Image.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({ placeholder }),
    ],
    content: rewriteMediaUrlsInHtml(value),
    onUpdate: ({ editor: activeEditor }) => onChange(activeEditor.getHTML()),
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none min-h-[220px] px-4 py-3 focus:outline-none text-[#1C1917]',
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(rewriteMediaUrlsInHtml(value) || '<p></p>', { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) return null;

  async function handleImageFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageError('');
    try {
      const { url } = await apiUpload(file);
      editor?.chain().focus().setImage({ src: resolveMediaUrl(url) }).run();
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'Tải ảnh thất bại');
      window.setTimeout(() => setImageError(''), 5000);
    } finally {
      e.target.value = '';
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[#E5DDD5] bg-[#FAF7F2]">
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageFileChange}
      />
      <div className="flex flex-wrap gap-0.5 border-b border-[#E5DDD5] bg-[#f5ede8] px-2 py-1.5">
        <ToolbarButton active={editor.isActive('bold')} title="In đậm" onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold size={15} />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive('italic')} title="In nghiêng" onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic size={15} />
        </ToolbarButton>
        <Separator />
        <ToolbarButton active={editor.isActive('heading', { level: 1 })} title="Tiêu đề 1" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
          <Heading1 size={15} />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive('heading', { level: 2 })} title="Tiêu đề 2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 size={15} />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive('heading', { level: 3 })} title="Tiêu đề 3" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          <Heading3 size={15} />
        </ToolbarButton>
        <Separator />
        <ToolbarButton active={editor.isActive('bulletList')} title="Danh sách" onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List size={15} />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive('orderedList')} title="Danh sách số" onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered size={15} />
        </ToolbarButton>
        <Separator />
        <ToolbarButton
          active={editor.isActive('link')}
          title="Liên kết"
          onClick={() => {
            const url = window.prompt('URL:');
            if (!url) return;
            editor.chain().focus().setLink({ href: url }).run();
          }}
        >
          <LinkIcon size={15} />
        </ToolbarButton>
        <ToolbarButton
          active={false}
          title="Hình ảnh"
          onClick={() => imageInputRef.current?.click()}
        >
          <ImageIcon size={15} />
        </ToolbarButton>
      </div>
      {imageError && (
        <div className="border-b border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">
          {imageError}
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}

function ToolbarButton({
  active,
  title,
  onClick,
  children,
}: {
  active: boolean;
  title: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`rounded p-1.5 transition-colors ${
        active ? 'bg-[#D4A574]/20 text-[#D4A574]' : 'text-[#57534E] hover:bg-[#E5DDD5]'
      }`}
    >
      {children}
    </button>
  );
}

function Separator() {
  return <div className="mx-1 h-5 w-px self-center bg-[#E5DDD5]" />;
}
