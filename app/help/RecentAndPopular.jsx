'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { History, Flame } from 'lucide-react';
import { getRecentGuides } from '@/app/automation/components/shared/tour/storage';

// Curated "popular" slugs — the guides new users hit most often per support
// chats. Static rather than derived from analytics since there's no guide
// pageview tracking pipeline to read from yet.
const POPULAR_SLUGS = ['getting-started', 'connect-whatsapp', 'automation-rules', 'leads'];

export default function RecentAndPopular({ allGuides }) {
  const [recentSlugs, setRecentSlugs] = useState([]);

  useEffect(() => {
    setRecentSlugs(getRecentGuides());
  }, []);

  const recent = recentSlugs.map((s) => allGuides.find((g) => g.slug === s)).filter(Boolean);
  const popular = POPULAR_SLUGS.map((s) => allGuides.find((g) => g.slug === s)).filter(Boolean);

  if (!recent.length && !popular.length) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
      {recent.length > 0 && (
        <Chip title="Recently viewed" Icon={History} guides={recent} />
      )}
      <Chip title="Popular guides" Icon={Flame} guides={popular} />
    </div>
  );
}

function Chip({ title, Icon, guides }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2.5">
        <Icon className="w-3.5 h-3.5" /> {title}
      </div>
      <ul className="space-y-0.5">
        {guides.map((g) => (
          <li key={g.slug}>
            <Link
              href={`/help/${g.slug}`}
              className="block text-sm text-slate-700 hover:text-blue-600 py-1 truncate"
            >
              {g.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
