'use client';

import { SCORE_CONFIG } from './constants';

export default function LeadScoreBadge({ intelligence, showLabel = false }) {
  const level = intelligence?.engagementScore?.level || 'Low';
  const score = intelligence?.engagementScore?.score ?? 0;
  const config = SCORE_CONFIG[level] || SCORE_CONFIG.Low;

  return (
    <span title="Engagement score" className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded tabular-nums ${config.badge}`}>
      {showLabel ? 'Score ' : ''}{Math.round(score)}
    </span>
  );
}
