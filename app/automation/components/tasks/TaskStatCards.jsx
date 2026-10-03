'use client';

import { Clock, AlertCircle, Calendar, CheckSquare } from 'lucide-react';
import StatCard from '../dashboard/primitives/StatCard';

export default function TaskStatCards({ counts, activeFilter, onFilterChange }) {
  const cards = [
    { id: 'today', label: 'Due today', value: counts.today, icon: Clock, accent: 'blue' },
    { id: 'overdue', label: 'Overdue', value: counts.overdue, icon: AlertCircle, accent: 'amber' },
    { id: 'upcoming', label: 'Upcoming', value: counts.upcoming, icon: Calendar, accent: 'green' },
    { id: 'all', label: 'All pending', value: counts.all, icon: CheckSquare, accent: 'slate' }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => (
        <button
          key={card.id}
          type="button"
          onClick={() => onFilterChange(card.id)}
          aria-pressed={activeFilter === card.id}
          className={`text-left rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
            activeFilter === card.id ? '[&>div]:border-accent [&>div]:bg-accent-subtle' : ''
          }`}
        >
          <StatCard label={card.label} value={card.value} icon={card.icon} accent={card.accent} />
        </button>
      ))}
    </div>
  );
}
