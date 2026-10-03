'use client';

import { SCORE_CONFIG } from './constants';

export default function LeadScoreBadge({ intelligence, showLabel = false }) {
  const level = intelligence?.engagementScore?.level || 'Low';
  const score = intelligence?.engagementScore?.score ?? 0;
  const config = SCORE_CONFIG[level] || SCORE_CONFIG.Low;

  return (
    <span className={`inline-flex items-center h-5 min-w-7 justify-center text-meta font-medium px-1.5 rounded-sm tabular ${config.badge}`}>
      {showLabel ? 'Score ' : ''}{Math.round(score)}
    </span>
  );
}
