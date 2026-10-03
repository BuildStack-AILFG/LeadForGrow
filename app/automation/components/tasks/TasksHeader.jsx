'use client';

import { Search, Plus, RefreshCw } from 'lucide-react';
import Button from '@/app/components/ui/Button';
import Input from '@/app/components/ui/Input';

/** Tasks header — same pattern as every list page: title + count left, search/refresh + one primary right. */
export default function TasksHeader({ search, onSearchChange, total, refreshing, onRefresh, onCreate }) {
  return (
    <header className="sticky top-0 z-30 -mx-4 border-b border-line bg-canvas px-4 py-4 sm:-mx-6 sm:px-6">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-page font-semibold text-fg">Tasks</h1>
          <p className="mt-0.5 text-body text-fg-secondary">
            {total.toLocaleString()} {total === 1 ? 'task' : 'tasks'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-56 lg:w-72">
            <Input type="search" icon={Search} aria-label="Search tasks" placeholder="Search task, lead, phone" value={search} onChange={(e) => onSearchChange(e.target.value)} className="h-8" />
          </div>
          <Button variant="ghost" icon={RefreshCw} aria-label="Refresh" onClick={onRefresh} loading={refreshing} />
          <Button variant="primary" icon={Plus} onClick={onCreate}>
            New task
          </Button>
        </div>
      </div>
    </header>
  );
}
