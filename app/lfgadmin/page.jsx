'use client';

import { useAdminPanel } from './hooks/useAdminPanel';
import AdminLogin from './components/AdminLogin';
import AdminSidebar, { AdminMobileHeader } from './components/AdminSidebar';
import AdminDashboard from './components/AdminDashboard';
import AdminModelView from './components/AdminModelView';
import AdminRecordModal from './components/AdminRecordModal';

export default function LFGAdminPage() {
  const admin = useAdminPanel();

  if (!admin.isAuthenticated) {
    return (
      <AdminLogin
        password={admin.password}
        setPassword={admin.setPassword}
        onLogin={() => admin.login()}
        loading={admin.loading}
        error={admin.error}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f6fa] dark:bg-slate-950 flex">
      <AdminSidebar
        models={admin.models}
        activeView={admin.activeView}
        selectedModel={admin.selectedModel}
        onOverview={admin.goToOverview}
        onSelectModel={admin.selectModel}
        onLogout={admin.logout}
        open={admin.sidebarOpen}
        onClose={() => admin.setSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white/80 dark:bg-slate-950/80 backdrop-blur border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3 flex items-center gap-3">
          <AdminMobileHeader onMenuOpen={() => admin.setSidebarOpen(true)} />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-400 hidden sm:block">LeadForGrow · Production database</p>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            Live
          </span>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {admin.activeView === 'overview' ? (
            <AdminDashboard
              dashboard={admin.dashboard}
              loading={admin.loading}
              onSelectModel={admin.selectModel}
            />
          ) : (
            <AdminModelView
              modelName={admin.selectedModel}
              data={admin.data}
              loading={admin.loading}
              error={admin.error}
              search={admin.search}
              pagination={admin.pagination}
              onSearch={admin.handleSearch}
              onRefresh={() => admin.fetchData(admin.selectedModel, admin.pagination.page)}
              onCreate={admin.openCreateModal}
              onEdit={admin.openEditModal}
              onDelete={admin.handleDelete}
              onToggleFreeze={admin.handleToggleFreeze}
              onPageChange={(page) => admin.fetchData(admin.selectedModel, page)}
            />
          )}
        </div>
      </main>

      <AdminRecordModal
        open={admin.isModalOpen}
        modelName={admin.selectedModel}
        editingDoc={admin.editingDoc}
        viewMode={admin.viewMode}
        setViewMode={admin.setViewMode}
        formData={admin.formData}
        jsonText={admin.jsonText}
        schemaDef={admin.schemaDef}
        error={admin.error}
        loading={admin.loading}
        onClose={() => admin.setIsModalOpen(false)}
        onSave={admin.handleSave}
        onFieldChange={admin.handleFieldChange}
        onJsonChange={admin.handleJsonChange}
      />
    </div>
  );
}
