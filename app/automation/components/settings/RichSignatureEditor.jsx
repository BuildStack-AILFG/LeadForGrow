'use client';

/**
 * Rich signature editor built on TipTap.
 *
 * Contract:
 *   - `value`  → HTML string of the current signature
 *   - `onChange(html)` → called with the new HTML on every edit
 *   - `displayName` / `email` → used to render a realistic email preview
 *   - `disabled` → toggles read-only + dims the UI
 *   - `placeholder` → shown when the editor is empty
 *
 * Design intent: match Hostinger-quality UX (toolbar + live preview) without
 * pulling in a WYSIWYG SaaS. TipTap is MIT-licensed and runs entirely
 * client-side. Logo/image insertion routes through the existing Cloudinary
 * signed-upload flow so images live on the CDN, not our origin.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { Link } from '@tiptap/extension-link';
import { Image } from '@tiptap/extension-image';
import { TextAlign } from '@tiptap/extension-text-align';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';

/**
 * Custom attribute preserver — TipTap's default Table/Row/Cell schemas
 * only recognise a small set of HTML attributes (colspan, rowspan,
 * colwidth). Everything else, including `style`, `align`, `valign`,
 * `width`, `bgcolor`, and `cellpadding`, is silently stripped on parse
 * and lost on render. That kills our signature templates because the
 * vertical divider (border-right), cell padding (gap), and column widths
 * all live in those attributes.
 *
 * These wrappers add back a whitelist of HTML/style attrs so template
 * HTML round-trips cleanly through the editor.
 */
const preserveAttrs = (attrList) => () => {
  const out = {};
  for (const attr of attrList) {
    out[attr] = {
      default: null,
      parseHTML: (el) => el.getAttribute(attr),
      renderHTML: (attrs) => (attrs[attr] ? { [attr]: attrs[attr] } : {}),
    };
  }
  return out;
};

const CustomTable = Table.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      ...preserveAttrs(['style', 'align', 'cellpadding', 'cellspacing', 'border', 'width', 'bgcolor'])(),
    };
  },
});

const CustomTableRow = TableRow.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      ...preserveAttrs(['style', 'align', 'valign', 'bgcolor'])(),
    };
  },
});

const CustomTableCell = TableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      ...preserveAttrs(['style', 'align', 'valign', 'width', 'height', 'bgcolor'])(),
    };
  },
});
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
  Eye,
  EyeOff,
  Loader2,
  LayoutTemplate,
  ChevronDown,
  Maximize2,
} from 'lucide-react';
import { authFetch } from '@/lib/apiClient';
import toast from 'react-hot-toast';
import { SIGNATURE_TEMPLATES, renderTemplate } from './signatureTemplates';
import { useConfirm } from '@/app/components/ConfirmProvider';

const COLOR_SWATCHES = [
  '#111827', '#374151', '#6B7280', '#DC2626',
  '#EA580C', '#CA8A04', '#16A34A', '#0891B2',
  '#059669', '#7C3AED', '#DB2777', '#FFFFFF',
];

function ToolbarButton({ active, disabled, title, onClick, children }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent ${
        active ? 'bg-indigo-100 text-indigo-700' : ''
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="mx-1 h-6 w-px bg-slate-200" />;
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

export default function RichSignatureEditor({
  value = '',
  onChange,
  displayName = '',
  email = '',
  disabled = false,
  placeholder = 'Best regards,\nAlice\nSales Manager · Acme Inc.',
}) {
  const confirm = useConfirm();
  const [showPreview, setShowPreview] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  // TipTap's isActive checks don't automatically cause React re-renders on
  // selection change. Bumping this on every selection/transaction makes
  // active-state buttons (bold/italic/image-selected/etc.) reflect reality.
  const [, forceUpdate] = useState(0);
  const fileInputRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
      }),
      TextStyle,
      Color,
      TextAlign.configure({ types: ['paragraph'] }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      Image.extend({
        // Add width/height attributes so we can resize inserted images
        // via toolbar S/M/L buttons. Preserved on parse+render like the
        // table extensions above.
        addAttributes() {
          return {
            ...this.parent?.(),
            width: {
              default: null,
              parseHTML: (el) => el.getAttribute('width'),
              renderHTML: (attrs) => (attrs.width ? { width: attrs.width } : {}),
            },
            height: {
              default: null,
              parseHTML: (el) => el.getAttribute('height'),
              renderHTML: (attrs) => (attrs.height ? { height: attrs.height } : {}),
            },
            style: {
              default: null,
              parseHTML: (el) => el.getAttribute('style'),
              renderHTML: (attrs) => (attrs.style ? { style: attrs.style } : {}),
            },
          };
        },
      }).configure({
        // inline:true lets images live inside table cells / paragraphs
        // without being pulled up to their own block, which breaks
        // two-column signature templates.
        inline: true,
        allowBase64: true,
        HTMLAttributes: { class: 'signature-image' },
      }),
      Placeholder.configure({
        placeholder: ({ node }) => (node.type.name === 'paragraph' ? placeholder : ''),
        showOnlyWhenEditable: true,
      }),
      // Table extensions needed so template HTML (which uses <table> for
      // Gmail/Outlook safety) round-trips through the editor instead of
      // being flattened to paragraphs. Using the custom variants above
      // so `style`, `align`, `width` etc. survive parse+render.
      CustomTable.configure({ resizable: false, allowTableNodeSelection: true }),
      CustomTableRow,
      TableHeader,
      CustomTableCell,
    ],
    content: value || '',
    editable: !disabled,
    editorProps: {
      attributes: {
        class:
          'signature-editor-content prose prose-sm max-w-none min-h-[220px] px-4 py-3 focus:outline-none',
      },
    },
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      // TipTap emits <p></p> for empty state; normalize to '' so save-detection works.
      const normalized = html === '<p></p>' ? '' : html;
      onChange?.(normalized);
      forceUpdate((n) => (n + 1) % 1000);
    },
    onSelectionUpdate: () => {
      forceUpdate((n) => (n + 1) % 1000);
    },
    // Re-render on selection change so active-state buttons update.
    immediatelyRender: false,
  });

  // Sync external value → editor (e.g. loading a saved signature).
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const incoming = value || '';
    if (current !== incoming && current !== '<p></p>') return;
    if (current === '<p></p>' && incoming) editor.commands.setContent(incoming, false);
  }, [value, editor]);

  // Read-only toggle.
  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [disabled, editor]);

  const handleImagePick = useCallback(() => {
    if (!editor || disabled) return;
    fileInputRef.current?.click();
  }, [editor, disabled]);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    e.target.value = ''; // allow re-picking the same file
    if (!file.type.startsWith('image/')) {
      toast.error('Please pick an image file (PNG, JPG, WebP).');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image too large — keep it under 2 MB.');
      return;
    }
    setUploading(true);
    try {
      const url = await uploadImageToCloudinary(file);

      // Priority for where the uploaded image ends up:
      //   1. Any existing placehold.co image → replace it (LOGO placeholder
      //      from a template — the common case).
      //   2. Any image currently selected → replace its src.
      //   3. Neither → insert at cursor.
      //
      // This avoids the "two logos side by side" problem where users hit
      // Insert without first clicking the placeholder to select it.
      let placeholderPos = null;
      editor.state.doc.descendants((node, pos) => {
        if (
          node.type.name === 'image' &&
          typeof node.attrs.src === 'string' &&
          node.attrs.src.includes('placehold.co')
        ) {
          placeholderPos = pos;
          return false; // stop walking
        }
        return true;
      });

      if (placeholderPos !== null) {
        editor
          .chain()
          .focus()
          .setNodeSelection(placeholderPos)
          .updateAttributes('image', { src: url, alt: 'Logo' })
          .run();
        toast.success('Logo replaced');
      } else if (editor.isActive('image')) {
        editor
          .chain()
          .focus()
          .updateAttributes('image', { src: url, alt: 'Logo' })
          .run();
        toast.success('Image replaced');
      } else {
        editor
          .chain()
          .focus()
          .setImage({ src: url, alt: 'Logo' })
          .run();
        toast.success('Image inserted');
      }
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

  const applyColor = (hex) => {
    editor?.chain().focus().setColor(hex).run();
    setColorPickerOpen(false);
  };

  // Resize the currently-selected image. Falls back gracefully if the
  // selection isn't an image — the buttons only enable in that case.
  const resizeSelectedImage = (widthPx) => {
    if (!editor) return;
    if (!editor.isActive('image')) {
      toast.error('Click on the logo/image first, then pick a size.');
      return;
    }
    editor
      .chain()
      .focus()
      .updateAttributes('image', {
        width: String(widthPx),
        // Explicit style so email clients honor the size even without CSS.
        style: `display:block;max-width:${widthPx}px;height:auto;width:${widthPx}px;`,
      })
      .run();
  };

  const imageSelected = editor?.isActive?.('image') || false;

  const applyTemplate = async (templateId) => {
    if (!editor) return;
    // Warn if there's non-trivial existing content — a template REPLACES the
    // current signature; users shouldn't lose real work to a stray click.
    const currentText = editor.getText().trim();
    if (currentText.length > 10) {
      const ok = await confirm({
        title: 'Load template',
        message: 'Loading a template will replace your current signature. Continue?',
        confirmLabel: 'Load template',
        danger: true,
      });
      if (!ok) return;
    }
    const html = renderTemplate(templateId, {
      name: displayName || (email ? email.split('@')[0] : ''),
      email,
      company: '',
      title: '',
    });
    editor.commands.setContent(html, false);
    // getHTML doesn't fire onUpdate on setContent(..., false), so push manually.
    onChange?.(editor.getHTML());
    setTemplatePickerOpen(false);
  };

  const previewFromName = displayName || email?.split('@')[0] || 'You';
  const previewFromEmail = email || 'you@example.com';

  const previewHtml = useMemo(() => value || '<p style="color:#94a3b8">Your signature will appear here.</p>', [value]);

  if (!editor) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
        Loading editor…
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-100 bg-slate-50 px-2 py-1.5">
          <div className="relative">
            <button
              type="button"
              onClick={() => setTemplatePickerOpen((v) => !v)}
              disabled={disabled}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              title="Start from a template"
            >
              <LayoutTemplate className="h-3.5 w-3.5" />
              Templates
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>
            {templatePickerOpen && (
              <>
                {/* Backdrop to close on outside click */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setTemplatePickerOpen(false)}
                />
                <div className="absolute left-0 top-full z-20 mt-1 w-64 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                  <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Start from a template
                  </p>
                  {SIGNATURE_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => applyTemplate(tmpl.id)}
                      className="w-full rounded-md px-3 py-2 text-left hover:bg-slate-50"
                    >
                      <p className="text-xs font-semibold text-slate-800">{tmpl.label}</p>
                      <p className="mt-0.5 text-[11px] text-slate-500">{tmpl.description}</p>
                    </button>
                  ))}
                  <p className="mt-1 border-t border-slate-100 px-3 py-2 text-[10px] text-slate-400">
                    Tip: click the placeholder logo in the editor, delete it, then use the image button to upload your own.
                  </p>
                </div>
              </>
            )}
          </div>

          <Divider />

          <ToolbarButton
            title="Bold (⌘B)"
            active={editor.isActive('bold')}
            disabled={disabled}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <BoldIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            title="Italic (⌘I)"
            active={editor.isActive('italic')}
            disabled={disabled}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <ItalicIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            title="Underline"
            active={editor.isActive('underline')}
            disabled={disabled}
            onClick={() => editor.chain().focus().toggleMark('underline').run()}
          >
            <UnderlineIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            title="Strikethrough"
            active={editor.isActive('strike')}
            disabled={disabled}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            <Strikethrough className="h-4 w-4" />
          </ToolbarButton>

          <Divider />

          <div className="relative">
            <ToolbarButton
              title="Text color"
              active={colorPickerOpen}
              disabled={disabled}
              onClick={() => setColorPickerOpen((v) => !v)}
            >
              <span className="flex h-4 w-4 items-center justify-center text-[10px] font-bold">A</span>
            </ToolbarButton>
            {colorPickerOpen && (
              <div className="absolute left-0 top-full z-10 mt-1 grid grid-cols-6 gap-1 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
                {COLOR_SWATCHES.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => applyColor(hex)}
                    className="h-5 w-5 rounded border border-slate-200"
                    style={{ backgroundColor: hex }}
                    title={hex}
                  />
                ))}
              </div>
            )}
          </div>

          <Divider />

          <ToolbarButton
            title="Align left"
            active={editor.isActive({ textAlign: 'left' })}
            disabled={disabled}
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
          >
            <AlignLeft className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            title="Align center"
            active={editor.isActive({ textAlign: 'center' })}
            disabled={disabled}
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
          >
            <AlignCenter className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            title="Align right"
            active={editor.isActive({ textAlign: 'right' })}
            disabled={disabled}
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
          >
            <AlignRight className="h-4 w-4" />
          </ToolbarButton>

          <Divider />

          <ToolbarButton
            title="Bulleted list"
            active={editor.isActive('bulletList')}
            disabled={disabled}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            title="Numbered list"
            active={editor.isActive('orderedList')}
            disabled={disabled}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>

          <Divider />

          <ToolbarButton
            title="Insert / remove link"
            active={editor.isActive('link')}
            disabled={disabled}
            onClick={handleLinkPrompt}
          >
            <LinkIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            title="Insert image / logo"
            disabled={disabled || uploading}
            onClick={handleImagePick}
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
          </ToolbarButton>

          {/* Logo resize — only enable when an image is selected. */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => resizeSelectedImage(60)}
            disabled={disabled || !imageSelected}
            title="Small logo (60px)"
            className="inline-flex h-8 items-center rounded-md px-1.5 text-[10px] font-semibold text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            S
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => resizeSelectedImage(100)}
            disabled={disabled || !imageSelected}
            title="Medium logo (100px)"
            className="inline-flex h-8 items-center rounded-md px-1.5 text-[10px] font-semibold text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            M
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => resizeSelectedImage(150)}
            disabled={disabled || !imageSelected}
            title="Large logo (150px)"
            className="inline-flex h-8 items-center rounded-md px-1.5 text-[10px] font-semibold text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            L
          </button>

          <Divider />

          <ToolbarButton
            title="Clear formatting"
            disabled={disabled}
            onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
          >
            <Eraser className="h-4 w-4" />
          </ToolbarButton>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPreview((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
            >
              {showPreview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {showPreview ? 'Hide preview' : 'Show preview'}
            </button>
          </div>
        </div>

        {/* Editor */}
        <EditorContent
          editor={editor}
          className="bg-white"
          // Data attribute for placeholder styling via CSS below.
          data-placeholder={placeholder}
        />

        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Live email preview */}
      {showPreview && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          <div className="border-b border-slate-200 bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Preview — how recipients will see it
          </div>
          <div className="p-4">
            <div className="mx-auto max-w-2xl rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{previewFromName}</p>
                    <p className="truncate text-xs text-slate-500">
                      {previewFromName} &lt;{previewFromEmail}&gt; · to Customer
                    </p>
                  </div>
                  <p className="shrink-0 text-xs text-slate-400">just now</p>
                </div>
                <p className="mt-1 text-sm text-slate-700">Re: Your enquiry</p>
              </div>
              <div className="px-5 py-4 text-sm text-slate-800">
                <p>Hi Customer,</p>
                <p className="mt-2">Thanks for reaching out. …</p>
                <div className="my-4 h-px bg-slate-100" />
                <div
                  className="signature-preview prose prose-sm max-w-none"
                  style={{ overflow: 'hidden' }}
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .signature-editor-content p {
          margin: 0.15rem 0;
        }
        /* Placeholder rendered by @tiptap/extension-placeholder */
        .signature-editor-content p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: #94a3b8;
          pointer-events: none;
          float: left;
          height: 0;
          white-space: pre-line;
        }
        .signature-editor-content a {
          color: #059669;
          text-decoration: underline;
        }
        .signature-editor-content img,
        .signature-preview img {
          max-width: 200px;
          height: auto;
          display: inline-block;
          margin: 0.25rem 0;
        }
        .signature-preview p {
          margin: 0.15rem 0;
        }
        .signature-preview a {
          color: #059669;
          text-decoration: underline;
        }
        /* Preserve inline table styles from signature templates — TipTap's
           default tableWrapper otherwise forces block layout that collapses
           the two-column layout into stacked rows. */
        .signature-editor-content .tableWrapper,
        .signature-preview .tableWrapper {
          overflow: visible !important;
          display: inline-block !important;
          width: auto !important;
          margin: 0 !important;
        }
        .signature-editor-content table,
        .signature-preview table {
          border-collapse: collapse !important;
          width: auto !important;
          table-layout: auto !important;
        }
        /* Signature sits left-aligned inside the preview — that's how it
           actually renders when a recipient opens the email in Gmail /
           Outlook / Apple Mail. Centering would mislead the user about
           how it will actually look. */
        .signature-preview {
          text-align: left;
        }
        .signature-preview table {
          display: inline-block !important;
        }
        .signature-editor-content td,
        .signature-preview td {
          position: relative;
          display: table-cell !important;
        }
        .signature-editor-content .selectedCell {
          background: rgba(99, 102, 241, 0.08);
        }
        /* Prevent margin collapse from pushing paragraphs inside cells apart */
        .signature-editor-content td p,
        .signature-preview td p {
          margin: 0;
        }
      `}</style>
    </div>
  );
}
