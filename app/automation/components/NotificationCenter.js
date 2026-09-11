'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, X, MessageCircle, UserPlus, CheckCircle, Info, Clock, Sparkles, Mail, Instagram } from 'lucide-react';
import Link from 'next/link';
import { authFetch } from '@/lib/apiClient';
import { useRealtime, REALTIME_EVENTS } from '@/app/automation/hooks/useRealtime';

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await authFetch('/api/automation/notifications');
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data);
        setUnreadCount(data.data.filter((n) => !n.isRead).length);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useRealtime({
    onEvent: useCallback((event) => {
      if (event.type === REALTIME_EVENTS.NOTIFICATION) {
        fetchNotifications();
      }
    }, [fetchNotifications]),
  });

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id) => {
    try {
      await authFetch('/api/automation/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id })
      });
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await authFetch('/api/automation/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true })
      });
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'whatsapp_message': return <MessageCircle className="w-4 h-4 text-emerald-600" />;
      case 'instagram_message': return <Instagram className="w-4 h-4 text-pink-600" />;
      case 'email_message': return <Mail className="w-4 h-4 text-indigo-600" />;
      case 'conversation_assigned': return <UserPlus className="w-4 h-4 text-teal-600" />;
      case 'internal_mention': return <Info className="w-4 h-4 text-amber-600" />;
      case 'new_lead': return <UserPlus className="w-4 h-4 text-indigo-600" />;
      case 'task_reminder': return <Clock className="w-4 h-4 text-amber-600" />;
      case 'automation_alert': return <Sparkles className="w-4 h-4 text-purple-600" />;
      default: return <Info className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-600"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-[100] animate-in fade-in zoom-in-95 duration-200 origin-top-left">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-10 text-center">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-6 h-6 text-slate-300" />
                </div>
                <p className="text-sm text-slate-500">All caught up!</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors relative group ${!n.isRead ? 'bg-indigo-50/30' : ''}`}
                >
                  <div className="flex gap-3">
                    <div className="mt-1 flex-shrink-0">
                      <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center border border-slate-100">
                        {getIcon(n.type)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <p className={`text-sm leading-tight ${!n.isRead ? 'font-bold text-slate-900' : 'text-slate-700'}`}>
                          {n.title}
                        </p>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {n.message}
                      </p>
                      {n.link && (
                        <Link
                          href={n.link}
                          onClick={() => {
                            markAsRead(n._id);
                            setIsOpen(false);
                          }}
                          className="inline-block mt-2 text-[10px] font-bold text-indigo-600 hover:underline"
                        >
                          View Details →
                        </Link>
                      )}
                    </div>
                  </div>
                  {!n.isRead && (
                    <button
                      onClick={() => markAsRead(n._id)}
                      className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="p-3 bg-slate-50 text-center rounded-b-2xl">
            <Link href="/automation/reports" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:text-indigo-600">
              View All Activity
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
