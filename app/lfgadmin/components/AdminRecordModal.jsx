'use client';

import { X, Save, RefreshCw, LayoutTemplate, Code, ToggleLeft } from 'lucide-react';
import { HARDCODED_ENUMS } from '../constants';
import BusinessFeatureEditor from './BusinessFeatureEditor';

export default function AdminRecordModal({
  open, modelName, editingDoc, viewMode, setViewMode,
  formData, jsonText, schemaDef, error, loading,
  onClose, onSave, onFieldChange, onJsonChange,
}) {
  if (!open) return null;

  const isBusiness = modelName === 'Business';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {editingDoc ? 'Edit record' : 'Create record'}
            </h3>
            <span className="text-xs text-teal-600 font-mono">{modelName}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-slate-200/70 dark:bg-slate-700/70 p-0.5 rounded-lg flex">
              <button
                type="button"
                onClick={() => setViewMode('form')}
                className={`px-2.5 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1 ${viewMode === 'form' ? 'bg-white dark:bg-slate-900 text-teal-600 shadow-sm' : 'text-slate-500'}`}
              >
                <LayoutTemplate className="w-3.5 h-3.5" /> Form
              </button>
              <button
                type="button"
                onClick={() => setViewMode('json')}
                className={`px-2.5 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1 ${viewMode === 'json' ? 'bg-white dark:bg-slate-900 text-teal-600 shadow-sm' : 'text-slate-500'}`}
              >
                <Code className="w-3.5 h-3.5" /> JSON
              </button>
              {isBusiness && (
                <button
                  type="button"
                  onClick={() => setViewMode('features')}
                  className={`px-2.5 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1 ${viewMode === 'features' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm' : 'text-slate-500'}`}
                >
                  <ToggleLeft className="w-3.5 h-3.5" /> Features
                </button>
              )}
            </div>
            <button type="button" onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {viewMode === 'features' && isBusiness ? (
            <BusinessFeatureEditor formData={formData} onFieldChange={onFieldChange} />
          ) : viewMode === 'form' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.keys(formData).map((key) => {
                if (key === '__v') return null;
                const fieldDef = schemaDef[key] || {};
                const val = formData[key] ?? '';
                const isId = key === '_id';

                if (!isId && typeof val === 'object' && val !== null && !Array.isArray(val)) {
                  return (
                    <div key={key} className="sm:col-span-2">
                      <label className="text-xs font-semibold text-slate-500">{key} (object)</label>
                      <p className="text-xs text-slate-400 mt-1 p-3 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        Complex object — edit in JSON tab
                      </p>
                    </div>
                  );
                }

                const options = HARDCODED_ENUMS[key] || (fieldDef.enumValues?.length ? fieldDef.enumValues : null);

                if (options) {
                  return (
                    <div key={key}>
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">{key}</label>
                      <select
                        value={val}
                        onChange={(e) => onFieldChange(key, e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                      >
                        <option value="">— Select —</option>
                        {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                  );
                }

                if (fieldDef.type === 'Boolean' || typeof val === 'boolean') {
                  return (
                    <div key={key} className="flex items-center gap-3 pt-5">
                      <input
                        type="checkbox"
                        checked={Boolean(val)}
                        onChange={(e) => onFieldChange(key, e.target.checked)}
                        className="w-4 h-4 rounded text-teal-600"
                      />
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{key}</label>
                    </div>
                  );
                }

                return (
                  <div key={key} className={isId ? 'sm:col-span-2' : ''}>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">
                      {key} {isId && <span className="text-slate-400 font-normal">(read-only)</span>}
                    </label>
                    <input
                      type={fieldDef.type === 'Number' || typeof val === 'number' ? 'number' : 'text'}
                      value={val}
                      readOnly={isId}
                      onChange={(e) => onFieldChange(key, fieldDef.type === 'Number' ? Number(e.target.value) : e.target.value)}
                      className={`w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm ${isId ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-white dark:bg-slate-900'}`}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <textarea
              value={jsonText}
              onChange={(e) => onJsonChange(e.target.value)}
              spellCheck={false}
              className="w-full h-[400px] p-4 rounded-xl bg-slate-950 text-emerald-400 font-mono text-xs leading-relaxed border border-slate-800 resize-none outline-none"
            />
          )}

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 rounded-xl text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {editingDoc ? 'Save changes' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}
