"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  User, Shield, CheckCircle, Edit3, Save, X,
  Loader2, Camera, LogOut, Sparkles, Settings,
  Zap, ToggleLeft, ToggleRight, BarChart3
} from "lucide-react";
import UserNavbar from "../../Header";
import { getUserId } from "@/lib/apiClient";
import { clearUserStorage } from "@/lib/clientStorage";
import toast from "react-hot-toast";

function isValidObjectId(id) {
  return typeof id === "string" && /^[a-f\d]{24}$/i.test(id);
}

export default function ProfilePage() {
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [profileId, setProfileId] = useState(null);

  const [editData, setEditData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    businessName: "",
    industry: "",
    businessWebsite: "",
  });

  const fetchProfile = useCallback(async (id) => {
    if (!isValidObjectId(id)) {
      setLoadError("Invalid profile ID. Please log in again.");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setLoadError(null);
      const res = await fetch(`/api/user/profile/${id}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || data.detail || "Failed to fetch profile");
      }
      setUserData(data);
      setEditData({
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        phone: data.phone || "",
        businessName: data.business?.name || "",
        industry: data.business?.industry || "",
        businessWebsite: data.business?.website || "",
      });
    } catch (error) {
      console.error(error);
      setLoadError(error.message || "Could not load profile");
      toast.error("Could not load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const paramId = params?.id;
    const storedId = getUserId();
    const effectiveId = isValidObjectId(paramId) ? paramId : storedId;
    setProfileId(effectiveId);
    if (effectiveId) fetchProfile(effectiveId);
    else {
      setLoadError("Not logged in. Please sign in to view your profile.");
      setLoading(false);
    }
  }, [params?.id, fetchProfile]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!profileId) return;
    try {
      setSaving(true);
      const res = await fetch(`/api/user/profile/${profileId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });
      if (!res.ok) throw new Error("Update failed");
      await fetchProfile(profileId);
      setIsEditing(false);
      toast.success("Profile updated!");
    } catch (error) {
      console.error(error);
      toast.error("Update failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFDFA] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-[#FAFDFA]">
        <UserNavbar />
        <div className="max-w-lg mx-auto px-6 pt-32 text-center">
          <p className="text-lg font-semibold text-[#111827]">Profile unavailable</p>
          <p className="text-[#64748B] mt-2">{loadError || "Something went wrong."}</p>
          <a href="/login" className="inline-block mt-6 px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold text-sm">
            Sign in
          </a>
        </div>
      </div>
    );
  }

  const quotas = userData.business?.quotas || {};
  const leadsQuota = quotas.maxLeadsPerMonth || 100;
  const leadsUsed = userData.business?.usage?.leadsThisMonth || 0;
  const leadProgress = leadsQuota > 0 ? Math.min((leadsUsed / leadsQuota) * 100, 100) : 0;
  const featureGroups = userData.business?.featureGroups || {};
  const planLabel = userData.business?.planLabel || userData.planLabel || "Free";

  return (
    <div className="min-h-screen bg-[#FAFDFA] pb-20 font-sans">
      <UserNavbar />

      <div className="relative pt-28 pb-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#D2EDD0]/40 via-white to-white pointer-events-none" />
        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-8">
            <div className="relative">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-emerald-100 flex items-center justify-center border border-emerald-200 shadow-sm">
                <span className="text-3xl font-bold text-emerald-700 select-none">
                  {(userData.name || "U").charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            <div className="flex-1 text-center md:text-left space-y-2">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <h1 className="text-3xl md:text-4xl font-bold text-[#111827] tracking-tight">{userData.name}</h1>
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-widest border border-emerald-200">
                  {planLabel}
                </span>
              </div>
              <p className="text-[#64748B] font-medium">{userData.business?.name || userData.email}</p>
            </div>
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className={`px-5 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 text-sm ${
                isEditing ? "bg-emerald-50 text-emerald-700" : "bg-white text-[#111827] border border-emerald-100 hover:bg-emerald-50"
              }`}
            >
              {isEditing ? <><X className="w-4 h-4" /> Cancel</> : <><Settings className="w-4 h-4" /> Edit</>}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          {/* Identity */}
          <section className="rounded-2xl border border-emerald-100 bg-white p-6 lg:p-8 shadow-sm">
            <div className="flex items-center justify-between border-b border-emerald-50 pb-4 mb-6">
              <h2 className="text-lg font-bold text-[#111827]">Profile</h2>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                <CheckCircle className="w-3 h-3" /> Verified
              </span>
            </div>

            {isEditing ? (
              <form onSubmit={handleUpdate} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {[
                    { key: "firstName", label: "First Name" },
                    { key: "lastName", label: "Last Name" },
                    { key: "phone", label: "Phone" },
                    { key: "businessName", label: "Business Name" },
                    { key: "industry", label: "Industry" },
                    { key: "businessWebsite", label: "Website" },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="text-xs text-[#64748B] mb-1 block">{label}</label>
                      <input
                        value={editData[key]}
                        onChange={(e) => setEditData({ ...editData, [key]: e.target.value })}
                        className="w-full bg-emerald-50/30 border border-emerald-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500/30 outline-none"
                      />
                    </div>
                  ))}
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-emerald-600 text-white rounded-xl py-3.5 font-semibold hover:bg-emerald-700 transition flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-4 h-4" /> Save</>}
                </button>
              </form>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {[
                  { label: "Full Name", value: userData.name },
                  { label: "Email", value: userData.email },
                  { label: "Phone", value: userData.phone || "—" },
                  { label: "Organization", value: userData.business?.name || "—" },
                  { label: "Website", value: userData.business?.website || "—" },
                  { label: "Role", value: userData.role || "—" },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] mb-1">{label}</p>
                    <p className="text-sm font-semibold text-[#111827]">{value}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Plan features — read-only view of admin-configured access */}
          {userData.business && (
            <section className="rounded-2xl border border-emerald-100 bg-white p-6 lg:p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <Zap className="w-5 h-5 text-emerald-600" />
                <div>
                  <h2 className="text-lg font-bold text-[#111827]">Plan & feature access</h2>
                  <p className="text-xs text-[#64748B] mt-0.5">Configured for your workspace · contact support to change</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mb-8">
                {[
                  { label: "Leads this month", used: leadsUsed, limit: leadsQuota },
                  { label: "Team seats", used: "—", limit: quotas.maxTeamMembers || 1 },
                  { label: "Forms", used: userData.business.usage?.formsCreated || 0, limit: quotas.maxForms || 1 },
                  { label: "Automation rules", used: "—", limit: quotas.maxAutomationRules || 3 },
                ].map((item) => (
                  <div key={item.label} className="p-4 rounded-xl bg-[#FAFDFA] border border-emerald-100/80">
                    <p className="text-xs text-[#64748B]">{item.label}</p>
                    <p className="text-lg font-bold text-[#111827] mt-1 tabular-nums">
                      {item.used} / {item.limit >= 999999 ? "∞" : item.limit}
                    </p>
                  </div>
                ))}
              </div>

              {Object.entries(featureGroups).map(([group, features]) => (
                <div key={group} className="mb-6 last:mb-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-3">{group}</p>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {features.map((f) => (
                      <div
                        key={f.key}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm ${
                          f.enabled
                            ? "border-emerald-100 bg-emerald-50/50 text-[#111827]"
                            : "border-slate-100 bg-slate-50 text-[#94A3B8]"
                        }`}
                      >
                        <span className="font-medium">{f.label}</span>
                        {f.enabled ? (
                          <ToggleRight className="w-5 h-5 text-emerald-600 shrink-0" />
                        ) : (
                          <ToggleLeft className="w-5 h-5 text-slate-300 shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* Security */}
          <section className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-widest text-[#94A3B8] mb-4">Security</h3>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="p-4 rounded-xl border border-emerald-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-[#64748B]" />
                  <span className="text-sm font-medium text-[#111827]">Two-Factor Auth</span>
                </div>
                <span className="text-[10px] text-[#94A3B8] font-bold uppercase">Disabled</span>
              </div>
              <div className="p-4 rounded-xl border border-emerald-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-[#64748B]" />
                  <span className="text-sm font-medium text-[#111827]">API Access</span>
                </div>
                <span className={`text-xs font-semibold ${userData.business?.featureFlags?.apiAccess ? "text-emerald-600" : "text-[#94A3B8]"}`}>
                  {userData.business?.featureFlags?.apiAccess ? "Enabled" : "Disabled"}
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              <h4 className="text-sm font-bold text-[#111827]">Activity</h4>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-[#64748B]">Total leads</span>
                <span className="font-bold text-[#111827]">{userData.stats?.totalLeads || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#64748B]">Websites</span>
                <span className="font-bold text-[#111827]">{userData.stats?.websiteCount || 0}</span>
              </div>
              <div className="pt-3 border-t border-emerald-50">
                <div className="flex justify-between text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-2">
                  <span>Lead quota</span>
                  <span>{leadsUsed}/{leadsQuota >= 999999 ? "∞" : leadsQuota}</span>
                </div>
                <div className="w-full h-2 bg-emerald-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-600 rounded-full transition-all" style={{ width: `${leadProgress}%` }} />
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => { clearUserStorage(); window.location.href = "/"; }}
            className="w-full py-3 text-[#64748B] hover:text-rose-600 transition-colors flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
