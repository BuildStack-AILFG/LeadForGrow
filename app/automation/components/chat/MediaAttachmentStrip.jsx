'use client';

import { X, RotateCcw, FileText, Image as ImageIcon, Film, Music } from 'lucide-react';
import { formatFileSize } from '@/lib/omnichannel/mediaTypes';

function FileIcon({ mimeType }) {
  if (mimeType?.startsWith('image/')) return <ImageIcon className="w-4 h-4" />;
  if (mimeType?.startsWith('video/')) return <Film className="w-4 h-4" />;
  if (mimeType?.startsWith('audio/')) return <Music className="w-4 h-4" />;
  return <FileText className="w-4 h-4" />;
}

export default function MediaAttachmentStrip({ uploads, onRemove, onRetry }) {
  if (!uploads.length) return null;

  return (
    <div className="flex gap-2 px-3 pt-2 overflow-x-auto">
      {uploads.map((u) => (
        <div
          key={u.id}
          className={`relative flex-shrink-0 w-20 h-20 rounded-lg border overflow-hidden ${
            u.status === 'failed' ? 'border-red-300 bg-red-50' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'
          }`}
        >
          {u.preview ? (
            <img src={u.preview} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-1 text-slate-500">
              <FileIcon mimeType={u.mimeType} />
              <span className="text-[8px] truncate w-full text-center mt-1">{u.name}</span>
            </div>
          )}
          {u.status === 'uploading' && (
            <div className="absolute inset-0 bg-black/40 flex items-end">
              <div className="w-full h-1 bg-slate-200">
                <div className="h-full bg-teal-500 transition-all" style={{ width: `${u.progress}%` }} />
              </div>
            </div>
          )}
          {u.status === 'failed' && (
            <button
              type="button"
              onClick={() => onRetry?.(u.id)}
              className="absolute inset-0 flex items-center justify-center bg-red-500/20"
              title={u.error || 'Retry'}
            >
              <RotateCcw className="w-4 h-4 text-red-600" />
            </button>
          )}
          <button
            type="button"
            onClick={() => onRemove(u.id)}
            className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/50 text-white hover:bg-black/70"
          >
            <X className="w-3 h-3" />
          </button>
          <span className="absolute bottom-0 left-0 right-0 text-[8px] text-center bg-black/50 text-white py-0.5">
            {formatFileSize(u.size)}
          </span>
        </div>
      ))}
    </div>
  );
}
