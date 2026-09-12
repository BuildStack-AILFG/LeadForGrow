'use client';

import { useState, useCallback, useEffect } from 'react';
import { useConfirm } from '@/app/components/ConfirmProvider';

const SESSION_KEY = 'lfg_admin_session';

async function adminFetch(password, payload) {
  const res = await fetch('/api/admin/db', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password, ...payload }),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.error || 'Request failed');
  return result;
}

export function useAdminPanel() {
  const confirm = useConfirm();
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [models, setModels] = useState([]);
  const [activeView, setActiveView] = useState('overview');
  const [selectedModel, setSelectedModel] = useState('');
  const [data, setData] = useState([]);
  const [schemaDef, setSchemaDef] = useState({});
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 1 });
  const [search, setSearch] = useState('');
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [viewMode, setViewMode] = useState('form');
  const [formData, setFormData] = useState({});
  const [jsonText, setJsonText] = useState('');

  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) {
      setPassword(saved);
      login(saved, true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (pwd, silent = false) => {
    const pass = pwd || password;
    if (!pass) return;
    setLoading(true);
    if (!silent) setError('');
    try {
      const result = await adminFetch(pass, { action: 'listModels' });
      sessionStorage.setItem(SESSION_KEY, pass);
      setPassword(pass);
      setIsAuthenticated(true);
      setModels(result.data || []);
      await loadDashboard(pass);
      setActiveView('overview');
    } catch (err) {
      sessionStorage.removeItem(SESSION_KEY);
      if (!silent) setError(err.message);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, [password]);

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setIsAuthenticated(false);
    setPassword('');
    setActiveView('overview');
    setSelectedModel('');
    setData([]);
  };

  const loadDashboard = useCallback(async (pwd) => {
    const pass = pwd || password;
    try {
      const result = await adminFetch(pass, { action: 'dashboard' });
      setDashboard(result.data);
    } catch (err) {
      setError(err.message);
    }
  }, [password]);

  const fetchData = useCallback(async (modelName, page = 1, searchTerm = search) => {
    const pass = password;
    if (!pass || !modelName) return;
    setLoading(true);
    setError('');
    try {
      const result = await adminFetch(pass, {
        action: 'find',
        modelName,
        page,
        limit: pagination.limit,
        search: searchTerm,
      });
      setData(result.data || []);
      setSchemaDef(result.schema || {});
      setPagination(result.pagination || { page: 1, limit: 50, total: 0, pages: 1 });
      setSelectedModel(modelName);
      setActiveView('model');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [password, search, pagination.limit]);

  const handleSearch = (term) => {
    setSearch(term);
    if (selectedModel) fetchData(selectedModel, 1, term);
  };

  const handleDelete = async (id) => {
    if (!(await confirm({ title: 'Delete record', message: 'Permanently delete this record?', confirmLabel: 'Delete', danger: true }))) return;
    setLoading(true);
    try {
      await adminFetch(password, { action: 'delete', modelName: selectedModel, id });
      setData((prev) => prev.filter((d) => d._id !== id));
      setPagination((p) => ({ ...p, total: Math.max(0, p.total - 1) }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFreeze = async (doc) => {
    const nextFrozen = !doc.frozen;
    if (nextFrozen && !(await confirm({ title: 'Freeze business', message: `Freeze "${doc.businessName || doc._id}"? They will lose all access to /automation immediately.`, confirmLabel: 'Freeze', danger: true }))) return;
    setLoading(true);
    setError('');
    try {
      const updateData = { frozen: nextFrozen, frozenAt: nextFrozen ? new Date().toISOString() : null };
      const result = await adminFetch(password, {
        action: 'update',
        modelName: 'Business',
        id: doc._id,
        updateData,
      });
      setData((prev) => prev.map((d) => (d._id === doc._id ? result.data : d)));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (doc) => {
    setEditingDoc(doc);
    setFormData(doc);
    setJsonText(JSON.stringify(doc, null, 2));
    setViewMode('form');
    setIsModalOpen(true);
    setError('');
  };

  const openCreateModal = () => {
    const newObj = { createdAt: new Date().toISOString() };
    Object.keys(schemaDef).forEach((k) => {
      if (k !== '_id' && k !== 'createdAt' && k !== '__v') {
        newObj[k] = schemaDef[k].type === 'Boolean' ? false : '';
      }
    });
    setEditingDoc(null);
    setFormData(newObj);
    setJsonText(JSON.stringify(newObj, null, 2));
    setViewMode('form');
    setIsModalOpen(true);
    setError('');
  };

  const handleFieldChange = (key, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [key]: value };
      setJsonText(JSON.stringify(updated, null, 2));
      return updated;
    });
  };

  const handleJsonChange = (val) => {
    setJsonText(val);
    try {
      setFormData(JSON.parse(val));
    } catch { /* typing */ }
  };

  const handleSave = async () => {
    let updateData;
    try {
      updateData = JSON.parse(jsonText);
    } catch {
      setError('Invalid JSON. Check the Raw Data tab.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await adminFetch(password, {
        action: editingDoc ? 'update' : 'create',
        modelName: selectedModel,
        id: editingDoc?._id,
        updateData,
      });
      setIsModalOpen(false);
      await fetchData(selectedModel, pagination.page);
      if (activeView === 'overview') await loadDashboard();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const goToOverview = async () => {
    setActiveView('overview');
    setSelectedModel('');
    setSidebarOpen(false);
    await loadDashboard();
  };

  const selectModel = (modelName) => {
    setSearch('');
    setSidebarOpen(false);
    fetchData(modelName, 1, '');
  };

  return {
    password, setPassword, isAuthenticated, login, logout, loading, error, setError,
    models, activeView, selectedModel, data, schemaDef, pagination, search,
    dashboard, sidebarOpen, setSidebarOpen,
    isModalOpen, setIsModalOpen, editingDoc, viewMode, setViewMode,
    formData, jsonText, handleFieldChange, handleJsonChange,
    fetchData, handleSearch, handleDelete, handleToggleFreeze, openEditModal, openCreateModal, handleSave,
    goToOverview, selectModel, loadDashboard,
  };
}
