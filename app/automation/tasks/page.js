'use client';

import { Suspense } from 'react';
import { useTasksWorkspace } from '../hooks/useTasksWorkspace';
import TasksHeader from '../components/tasks/TasksHeader';
import TaskStatCards from '../components/tasks/TaskStatCards';
import TaskTable from '../components/tasks/TaskTable';
import MobileTaskCard from '../components/tasks/MobileTaskCard';
import TasksEmptyState from '../components/tasks/TasksEmptyState';
import CreateTaskModal from '../components/tasks/CreateTaskModal';
import RescheduleTaskModal from '../components/tasks/RescheduleTaskModal';
import TasksSkeleton from '../components/tasks/TasksSkeleton';
import AutoPageIntro from '@/app/automation/components/shared/tour/AutoPageIntro';

function TasksWorkspaceContent() {
  const ws = useTasksWorkspace();

  if (ws.loading) return <TasksSkeleton />;

  return (
    <div className="min-h-full bg-[#F8F9FA] dark:bg-slate-950">
      <div className="px-4 sm:px-6 pb-8">
        <TasksHeader
          search={ws.search}
          onSearchChange={ws.setSearch}
          total={ws.total}
          refreshing={ws.refreshing}
          onRefresh={ws.refresh}
          onCreate={() => ws.setShowCreateModal(true)}
        />

        <AutoPageIntro />

        <div className="mt-4 mb-4">
          <TaskStatCards
            counts={ws.counts}
            activeFilter={ws.filter}
            onFilterChange={ws.setFilter}
          />
        </div>

        {ws.tasks.length === 0 ? (
          <TasksEmptyState filter={ws.filter} onCreate={() => ws.setShowCreateModal(true)} />
        ) : (
          <>
            <div className="hidden lg:block">
              <TaskTable
                tasks={ws.tasks}
                onMarkDone={ws.markDone}
                onReschedule={ws.openReschedule}
                onCommunicate={ws.handleCommunication}
              />
            </div>
            <div className="lg:hidden space-y-3">
              {ws.tasks.map((task) => (
                <MobileTaskCard
                  key={task._id}
                  task={task}
                  onMarkDone={ws.markDone}
                  onReschedule={ws.openReschedule}
                  onCommunicate={ws.handleCommunication}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <CreateTaskModal
        open={ws.showCreateModal}
        task={ws.newTask}
        onChange={ws.setNewTask}
        leads={ws.leads}
        teamMembers={ws.teamMembers}
        onClose={() => ws.setShowCreateModal(false)}
        onSubmit={ws.createTask}
      />

      <RescheduleTaskModal
        open={ws.showRescheduleModal}
        task={ws.selectedTask}
        dueDate={ws.rescheduleDate}
        onDueDateChange={ws.setRescheduleDate}
        onClose={() => ws.setShowRescheduleModal(false)}
        onSubmit={ws.rescheduleTask}
      />
    </div>
  );
}

export default function TasksPage() {
  return (
    <Suspense fallback={<TasksSkeleton />}>
      <TasksWorkspaceContent />
    </Suspense>
  );
}
