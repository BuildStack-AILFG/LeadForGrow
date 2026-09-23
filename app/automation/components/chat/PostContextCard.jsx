'use client';

import { useState, useEffect } from 'react';
import { Image as ImageIcon, ExternalLink } from 'lucide-react';
import { authFetch } from '@/lib/apiClient';

/**
 * Shows which post a comment came from — thumbnail + caption + a link out to the
 * real post. Rendered above a comment conversation so an agent has context at a
 * glance. Fetches the post lazily from Meta; degrades to a plain label if the
 * lookup fails (e.g. token scope) so it never blocks the conversation.
 */
export default function PostContextCard({ channel, postId }) {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!postId) return;
    let alive = true;
    setLoading(true);
    authFetch(`/api/automation/inbox/social-post?channel=${channel}&id=${encodeURIComponent(postId)}`)
      .then((r) => r.json())
      .then((d) => { if (alive) setPost(d.success ? d.data : null); })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [channel, postId]);

  const label = channel === 'facebook' ? 'Facebook' : 'Instagram';
  const accent = channel === 'facebook' ? 'text-[#1877F2]' : 'text-[#D4537E]';

  return (
    <div className="mx-4 my-3 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 flex gap-3 items-center bg-slate-50 dark:bg-slate-800/40">
      <span className="w-12 h-12 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
        {post?.thumbnail
          ? <img src={post.thumbnail} alt="Post" className="w-full h-full object-cover" />
          : <ImageIcon className="w-5 h-5 text-slate-400" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className={`text-[10px] font-semibold uppercase tracking-wide ${accent}`}>Comment on this post</p>
        <p className="text-xs font-medium text-slate-800 dark:text-slate-100 truncate">
          {loading ? 'Loading post…' : (post?.caption?.trim()?.slice(0, 90) || `${label} post`)}
        </p>
        {post?.permalink && (
          <a href={post.permalink} target="_blank" rel="noopener noreferrer" className="text-[11px] text-teal-600 dark:text-teal-400 inline-flex items-center gap-0.5 hover:underline">
            View on {label} <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
}
