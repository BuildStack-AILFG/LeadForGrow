'use client';

import { useState, useEffect, useCallback } from 'react';
import { authJson } from '@/lib/apiClient';
import toast from 'react-hot-toast';

export function useAccessControl() {
  const [loading, setLoading] = useState(true);
  const [access, setAccess] = useState(null);
  const [roles, setRoles] = useState([]);
  const [usageLimits, setUsageLimits] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [moduleGroups, setModuleGroups] = useState([]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ctxRes, rolesRes] = await Promise.all([
        authJson('/api/access/context'),
        authJson('/api/access/roles'),
      ]);
      if (ctxRes.success) {
        setAccess(ctxRes.data.access);
        setUsageLimits(ctxRes.data.usageLimits || []);
        setModuleGroups(ctxRes.data.moduleGroups || []);
      }
      if (rolesRes.success) setRoles(rolesRes.data);
    } catch (e) {
      toast.error('Failed to load access settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const loadAudit = useCallback(async () => {
    const res = await authJson('/api/access/audit?limit=40');
    if (res.success) setAuditLogs(res.data);
    else if (res.requiresUpgrade) toast.error(res.error);
  }, []);

  const updateRolePermissions = async (roleId, permissions) => {
    setSaving(true);
    try {
      const res = await authJson(`/api/access/roles/${roleId}`, {
        method: 'PATCH',
        body: JSON.stringify({ permissions }),
      });
      if (res.success) {
        toast.success('Permissions saved');
        load();
      } else toast.error(res.error || 'Failed to save');
    } catch {
      toast.error('Failed to save permissions');
    } finally {
      setSaving(false);
    }
  };

  const createRole = async (name, description) => {
    const res = await authJson('/api/access/roles', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
    if (res.success) {
      toast.success('Role created');
      load();
    } else toast.error(res.error || 'Failed');
  };

  const deleteRole = async (roleId) => {
    const res = await authJson(`/api/access/roles/${roleId}`, { method: 'DELETE' });
    if (res.success) {
      toast.success('Role deleted');
      load();
    } else toast.error(res.error || 'Failed to delete role');
  };

  const updateMemberAccess = async (userId, payload) => {
    const res = await authJson(`/api/access/members/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    if (res.success) {
      toast.success('Member access updated');
      load();
    } else toast.error(res.error || 'Failed');
  };

  return {
    loading,
    saving,
    access,
    roles,
    usageLimits,
    auditLogs,
    moduleGroups,
    load,
    loadAudit,
    updateRolePermissions,
    createRole,
    deleteRole,
    updateMemberAccess,
  };
}
