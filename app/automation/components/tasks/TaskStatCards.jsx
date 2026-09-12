'use client';

import { Clock, AlertCircle, Calendar, CheckSquare } from 'lucide-react';
import StatCard from '../dashboard/primitives/StatCard';

export default function TaskStatCards({ counts, activeFilter, onFilterChange }) {
  const cards = [
    { id: 'today', label: 'Due Today', value: counts.today, icon: Clock, accent: 'blue' },
    { id: 'overdue', label: 'Overdue', value: counts.overdue, icon: AlertCircle, accent: 'amber' },
    { id: 'upcoming', label: 'Upcoming', value: counts.upcoming, icon: Calendar, accent: 'green' },
    { id: 'all', label: 'All Pending', value: counts.all, icon: CheckSquare, accent: 'slate' }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => (
        <button
          key={card.id}
          type="button"
          onClick={() => onFilterChange(card.id)}
          className={`text-left rounded-xl transition-all ${
            activeFilter === card.id ? 'ring-2 ring-[#1D4B3E]/40 ring-offset-2 ring-offset-white dark:ring-offset-slate-950' : ''
          }`}
        >
          <StatCard label={card.label} value={card.value} icon={card.icon} accent={card.accent} />
        </button>
      ))}
    </div>
  );
}
