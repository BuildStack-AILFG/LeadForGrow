'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { authFetch, getUserId } from '@/lib/apiClient';
import { useConfirm } from '@/app/components/ConfirmProvider';

const EMPTY_FORM = {
  name: '',
  industry: '',
  website: '',
  email: '',
  phone: '',
  employeeCount: '',
  annualRevenue: '',
  description: '',
};

export function useCompanyDetail(companyId) {
  const confirm = useConfirm();
  const router = useRouter();
  const [company, setCompany] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [showEdit, setShowEdit] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [showAddDeal, setShowAddDeal] = useState(false);
  const [contactForm, setContactForm] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [dealForm, setDealForm] = useState({ title: '', amount: '', stage: 'qualification' });
  const [noteText, setNoteText] = useState('');
  const [uploading, setUploading] = useState(false);

  const fetchCompany = useCallback(async () => {
    if (!companyId) return;
    const res = await authFetch(`/api/automation/companies/${companyId}`);
    const data = await res.json();
    if (data.success) {
      setCompany(data.data);
      setEditForm({
        name: data.data.name || '',
        industry: data.data.industry || '',
        website: data.data.website || '',
        email: data.data.email || '',
        phone: data.data.phone || '',
        employeeCount: data.data.employeeCount || '',
        annualRevenue: data.data.annualRevenue || '',
        description: data.data.description || '',
      });
    }
    return data;
  }, [companyId]);

  const fetchTeam = useCallback(async () => {
    const res = await authFetch('/api/automation/team');
    const data = await res.json();
    if (data.success) setTeamMembers(data.data || []);
  }, []);

  useEffect(() => {
    async function load() {
      if (!getUserId()) {
        router.push('/user/register');
        return;
      }
      setLoading(true);
      const data = await fetchCompany();
      if (!data?.success) toast.error('Failed to load company');
      await fetchTeam();
      setLoading(false);
    }
    load();
  }, [companyId, fetchCompany, fetchTeam, router]);

  const refresh = useCallback(() => fetchCompany(), [fetchCompany]);

  const updateCompany = async (payload) => {
    setSaving(true);
    try {
      const res = await authFetch(`/api/automation/companies/${companyId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(payload.archived ? 'Company archived' : 'Company updated');
        await refresh();
        return true;
      }
      toast.error(data.error || 'Update failed');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const saveEdit = async () => {
    const ok = await updateCompany({
      ...editForm,
      annualRevenue: editForm.annualRevenue ? Number(editForm.annualRevenue) : 0,
    });
    if (ok) setShowEdit(false);
  };

  const archiveCompany = async () => {
    if (!(await confirm({ title: 'Archive company', message: 'Archive this company? It will be hidden from active lists.', confirmLabel: 'Archive' }))) return;
    await updateCompany({ archived: true });
    router.push('/automation/companies');
  };

  const deleteCompany = async () => {
    if (!(await confirm({ title: 'Delete company', message: 'Permanently delete this company? This cannot be undone.', confirmLabel: 'Delete', danger: true }))) return;
    setSaving(true);
    try {
      const res = await authFetch(`/api/automation/companies/${companyId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Company deleted');
        router.push('/automation/companies');
      } else toast.error(data.error || 'Delete failed');
    } finally {
      setSaving(false);
    }
  };

  const addContact = async () => {
    if (!contactForm.firstName) {
      toast.error('First name is required');
      return;
    }
    setSaving(true);
    try {
      const body = {
        firstName: contactForm.firstName,
        lastName: contactForm.lastName,
        companyId,
        emails: contactForm.email ? [{ address: contactForm.email, type: 'work', primary: true }] : [],
        phones: contactForm.phone ? [{ number: contactForm.phone, type: 'work', primary: true }] : [],
      };
      const res = await authFetch('/api/automation/contacts', { method: 'POST', body: JSON.stringify(body) });
      const data = await res.json();
      if (data.success) {
        toast.success('Contact added');
        setShowAddContact(false);
        setContactForm({ firstName: '', lastName: '', email: '', phone: '' });
        await refresh();
      } else toast.error(data.error || 'Failed to add contact');
    } finally {
      setSaving(false);
    }
  };

  const addDeal = async () => {
    if (!dealForm.title) {
      toast.error('Deal title is required');
      return;
    }
    setSaving(true);
    try {
      const res = await authFetch('/api/automation/deals', {
        method: 'POST',
        body: JSON.stringify({
          title: dealForm.title,
          amount: Number(dealForm.amount) || 0,
          stage: dealForm.stage,
          companyId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Deal created');
        setShowAddDeal(false);
        setDealForm({ title: '', amount: '', stage: 'qualification' });
        await refresh();
      } else toast.error(data.error || 'Failed to create deal');
    } finally {
      setSaving(false);
    }
  };

  const addNote = async () => {
    if (!noteText.trim()) return;
    setSaving(true);
    try {
      const res = await authFetch('/api/automation/notes', {
        method: 'POST',
        body: JSON.stringify({ entityType: 'company', entityId: companyId, content: noteText.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Note added');
        setNoteText('');
        await refresh();
      } else toast.error(data.error || 'Failed to add note');
    } finally {
      setSaving(false);
    }
  };

  const uploadAttachment = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await authFetch('/api/upload', { method: 'POST', body: formData });
      const uploadData = await uploadRes.json();
      if (!uploadData.success) {
        toast.error(uploadData.error || 'Upload failed');
        return;
      }
      const res = await authFetch('/api/automation/attachments', {
        method: 'POST',
        body: JSON.stringify({
          entityType: 'company',
          entityId: companyId,
          fileName: file.name,
          fileUrl: uploadData.url,
          fileSize: file.size,
          mimeType: file.type,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('File attached');
        await refresh();
      } else toast.error(data.error || 'Failed to save attachment');
    } finally {
      setUploading(false);
    }
  };

  return {
    company,
    teamMembers,
    loading,
    saving,
    uploading,
    editForm,
    setEditForm,
    showEdit,
    setShowEdit,
    showAddContact,
    setShowAddContact,
    showAddDeal,
    setShowAddDeal,
    contactForm,
    setContactForm,
    dealForm,
    setDealForm,
    noteText,
    setNoteText,
    refresh,
    saveEdit,
    archiveCompany,
    deleteCompany,
    addContact,
    addDeal,
    addNote,
    uploadAttachment,
  };
}
