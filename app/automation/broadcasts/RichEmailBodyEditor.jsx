'use client';

/**
 * Rich WYSIWYG editor for the broadcast email BODY.
 *
 * Contract:
 *   - `value`  → HTML string of the current body
 *   - `onChange({ html, text })` → fired on every edit. `html` is what we send;
 *     `text` is the plain-text fallback (multipart text/plain + legacy `body`).
 *   - `disabled` → read-only.
 *
 * Built on the same TipTap stack as RichSignatureEditor (MIT, client-side).
 * Adds an "Insert variable" menu so campaigns can drop {{name}} / {{email}} /
 * {{phone}} tokens that the engine personalises per recipient. Images route
 * through the existing Cloudinary signed-upload flow.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { Link } from '@tiptap/extension-link';
import { Image } from '@tiptap/extension-image';
import { TextAlign } from '@tiptap/extension-text-align';
import { Placeholder } from '@tiptap/extension-placeholder';
import {
  Bold as BoldIcon,
  Italic as ItalicIcon,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Eraser,
  Loader2,
  Braces,
  ChevronDown,
} from 'lucide-react';
import { authFetch } from '@/lib/apiClient';
import toast from 'react-hot-toast';
import { useConfirm } from '@/app/components/ConfirmProvider';

const COLOR_SWATCHES = [
  '#111827', '#374151', '#6B7280', '#DC2626',
  '#EA580C', '#CA8A04', '#16A34A', '#0891B2',
  '#059669', '#7C3AED', '#DB2777', '#2563EB',
];

const VARIABLES = [
  { token: '{{name}}', label: 'Recipient name' },
  { token: '{{email}}', label: 'Recipient email' },
  { token: '{{phone}}', label: 'Recipient phone' },
];

function ToolbarButton({ active, disabled, title, onClick, children }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-600 dark:text-slate-300 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent ${
        active ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300' : ''
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="mx-1 h-6 w-px bg-slate-200 dark:bg-slate-700" />;
}

async function uploadImageToCloudinary(file) {
  const signRes = await authFetch('/api/cloudinary-sign', { method: 'POST' });
  const sign = await signRes.json();
  if (!signRes.ok || !sign.success) {
    throw new Error(
      sign.error?.includes('CLOUDINARY')
        ? 'Cloudinary credentials missing on the server. Ask an admin to add them.'
        : sign.error || 'Could not sign upload'
    );
  }
  const fd = new FormData();
  fd.append('file', file);
  fd.append('api_key', sign.apiKey);
  fd.append('timestamp', sign.timestamp);
  fd.append('signature', sign.signature);
  if (sign.folder) fd.append('folder', sign.folder);
  const cdnRes = await fetch(
    `https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`,
    { method: 'POST', body: fd }
  );
  const cdnData = await cdnRes.json();
  if (!cdnRes.ok || !cdnData.secure_url) {
    throw new Error(cdnData.error?.message || 'Cloudinary upload failed');
  }
  return cdnData.secure_url;
}

export default function RichEmailBodyEditor({
  value = '',
  onChange,
  disabled = false,
  placeholder = 'Hi {{name}},\n\nWrite your announcement here…',
}) {
  const confirm = useConfirm();
  const [uploading, setUploading] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [varMenuOpen, setVarMenuOpen] = useState(false);
  const [, forceUpdate] = useState(0);
  const fileInputRef = useRef(null);

  const emit = useCallback((ed) => {
    const html = ed.getHTML();
    const normalized = html === '<p></p>' ? '' : html;
    onChange?.({ html: normalized, text: ed.getText() });
  }, [onChange]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false, codeBlock: false, blockquote: false, horizontalRule: false }),
      TextStyle,
      Color,
      TextAlign.configure({ types: ['paragraph'] }),
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' } }),
      Image.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            width: {
              default: null,
              parseHTML: (el) => el.getAttribute('width'),
              renderHTML: (attrs) => (attrs.width ? { width: attrs.width } : {}),
            },
            style: {
              default: null,
              parseHTML: (el) => el.getAttribute('style'),
              renderHTML: (attrs) => (attrs.style ? { style: attrs.style } : {}),
            },
          };
        },
      }).configure({ inline: false, allowBase64: true, HTMLAttributes: { class: 'email-body-image' } }),
      Placeholder.configure({
        placeholder: ({ node }) => (node.type.name === 'paragraph' ? placeholder : ''),
        showOnlyWhenEditable: true,
      }),
    ],
    content: value || '',
    editable: !disabled,
    editorProps: {
      attributes: {
        class: 'email-body-content prose prose-sm max-w-none min-h-[180px] px-4 py-3 focus:outline-none dark:prose-invert',
      },
    },
    onUpdate: ({ editor: ed }) => {
      emit(ed);
      forceUpdate((n) => (n + 1) % 1000);
    },
    onSelectionUpdate: () => forceUpdate((n) => (n + 1) % 1000),
    immediatelyRender: false,
  });

  // Sync external value → editor only when the editor is still empty (e.g. a
  // saved template just loaded). Avoids clobbering what the user is typing.
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (current === '<p></p>' && value) editor.commands.setContent(value, false);
  }, [value, editor]);

  useEffect(() => { editor?.setEditable(!disabled); }, [disabled, editor]);

  const handleImagePick = useCallback(() => {
    if (!editor || disabled) return;
    fileInputRef.current?.click();
  }, [editor, disabled]);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    e.target.value = '';
    if (!file.type.startsWith('image/')) { toast.error('Please pick an image file (PNG, JPG, WebP).'); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error('Image too large — keep it under 2 MB.'); return; }
    setUploading(true);
    try {
      const url = await uploadImageToCloudinary(file);
      editor.chain().focus().setImage({ src: url, alt: '' }).run();
      toast.success('Image inserted');
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleLinkPrompt = async () => {
    if (!editor) return;
    const prev = editor.getAttributes('link').href || '';
    const url = await confirm({ mode: 'prompt', title: 'Insert link', message: 'Enter URL (leave empty to remove link)', placeholder: 'https://…', defaultValue: prev });
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`;
      editor.chain().focus().extendMarkRange('link').setLink({ href: normalized }).run();
    }
  };

  const insertVariable = (token) => {
    editor?.chain().focus().insertContent(token).run();
    setVarMenuOpen(false);
  };

  const applyColor = (hex) => {
    editor?.chain().focus().setColor(hex).run();
    setColorPickerOpen(false);
  };

  if (!editor) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 text-center text-sm text-slate-500">
        Loading editor…
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 px-2 py-1.5">
        {/* Insert variable */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setVarMenuOpen((v) => !v)}
            disabled={disabled}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40"
            title="Insert a personalization variable"
          >
            <Braces className="h-3.5 w-3.5" />
            Insert
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>
          {varMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setVarMenuOpen(false)} />
              <div className="absolute left-0 top-full z-20 mt-1 w-56 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1 shadow-lg">
                <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Personalization</p>
                {VARIABLES.map((v) => (
                  <button
                    key={v.token}
                    type="button"
                    onClick={() => insertVariable(v.token)}
                    className="flex w-full items-center justify-between rounded-md px-3 py-1.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <span className="text-xs font-medium text-slate-800 dark:text-slate-100">{v.label}</span>
                    <code className="text-[10px] text-violet-600 dark:text-violet-400">{v.token}</code>
                  </button>
                ))}
                <p className="mt-1 border-t border-slate-100 dark:border-slate-800 px-3 py-1.5 text-[10px] text-slate-400">
                  Each token is replaced per recipient at send time.
                </p>
              </div>
            </>
          )}
        </div>

        <Divider />

        <ToolbarButton title="Bold (⌘B)" active={editor.isActive('bold')} disabled={disabled} onClick={() => editor.chain().focus().toggleBold().run()}>
          <BoldIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Italic (⌘I)" active={editor.isActive('italic')} disabled={disabled} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <ItalicIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Underline" active={editor.isActive('underline')} disabled={disabled} onClick={() => editor.chain().focus().toggleMark('underline').run()}>
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Strikethrough" active={editor.isActive('strike')} disabled={disabled} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>

        <Divider />

        <div className="relative">
          <ToolbarButton title="Text color" active={colorPickerOpen} disabled={disabled} onClick={() => setColorPickerOpen((v) => !v)}>
            <span className="flex h-4 w-4 items-center justify-center text-[10px] font-bold">A</span>
          </ToolbarButton>
          {colorPickerOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setColorPickerOpen(false)} />
              <div className="absolute left-0 top-full z-20 mt-1 grid grid-cols-6 gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 shadow-lg">
                {COLOR_SWATCHES.map((hex) => (
                  <button key={hex} type="button" onClick={() => applyColor(hex)} className="h-5 w-5 rounded border border-slate-200 dark:border-slate-600" style={{ backgroundColor: hex }} title={hex} />
                ))}
              </div>
            </>
          )}
        </div>

        <Divider />

        <ToolbarButton title="Align left" active={editor.isActive({ textAlign: 'left' })} disabled={disabled} onClick={() => editor.chain().focus().setTextAlign('left').run()}>
          <AlignLeft className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Align center" active={editor.isActive({ textAlign: 'center' })} disabled={disabled} onClick={() => editor.chain().focus().setTextAlign('center').run()}>
          <AlignCenter className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Align right" active={editor.isActive({ textAlign: 'right' })} disabled={disabled} onClick={() => editor.chain().focus().setTextAlign('right').run()}>
          <AlignRight className="h-4 w-4" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton title="Bulleted list" active={editor.isActive('bulletList')} disabled={disabled} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Numbered list" active={editor.isActive('orderedList')} disabled={disabled} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton title="Insert / remove link" active={editor.isActive('link')} disabled={disabled} onClick={handleLinkPrompt}>
          <LinkIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Insert image / banner" disabled={disabled || uploading} onClick={handleImagePick}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
        </ToolbarButton>

        <Divider />

        <ToolbarButton title="Clear formatting" disabled={disabled} onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}>
          <Eraser className="h-4 w-4" />
        </ToolbarButton>
      </div>

      <EditorContent editor={editor} className="bg-white dark:bg-slate-900" data-placeholder={placeholder} />

      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

      <style jsx global>{`
        .email-body-content p { margin: 0.25rem 0; }
        .email-body-content p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: #94a3b8;
          pointer-events: none;
          float: left;
          height: 0;
          white-space: pre-line;
        }
        .email-body-content a { color: #7c3aed; text-decoration: underline; }
        .email-body-content img { max-width: 100%; height: auto; display: block; margin: 0.5rem 0; border-radius: 6px; }
        .email-body-content ul, .email-body-content ol { padding-left: 1.25rem; margin: 0.25rem 0; }
      `}</style>
    </div>
  );
}
