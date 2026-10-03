'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, X, MessageCircle, UserPlus, CheckCircle, Info, Clock, Bot as Sparkles, Mail, Instagram } from 'lucide-react';
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
      case 'whatsapp_message': return <MessageCircle className="w-4 h-4 text-accent-fg" />;
      case 'instagram_message': return <Instagram className="w-4 h-4 text-pink-600" />;
      case 'email_message': return <Mail className="w-4 h-4 text-[#4285F4]" />;
      case 'conversation_assigned': return <UserPlus className="w-4 h-4 text-accent-fg" />;
      case 'internal_mention': return <Info className="w-4 h-4 text-accent-fg" />;
      case 'new_lead': return <UserPlus className="w-4 h-4 text-accent-fg" />;
      case 'task_reminder': return <Clock className="w-4 h-4 text-accent-fg" />;
      case 'automation_alert': return <Sparkles className="w-4 h-4 text-accent-fg" />;
      default: return <Info className="w-4 h-4 text-fg-secondary" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-none hover:bg-accent-subtle hover:text-accent-fg transition-colors text-fg-secondary"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-danger text-white text-meta font-semibold rounded-full flex items-center justify-center border-2 border-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 md:w-96 bg-canvas rounded-none shadow-modal border border-line z-[100] duration-200 origin-top-left">
          <div className="p-4 border-b border-line flex items-center justify-between">
            <h3 className="font-semibold text-fg">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-meta font-semibold text-accent-fg hover:text-accent-fg"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-10 text-center">
                <div className="w-12 h-12 bg-canvas border border-line rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-6 h-6 text-fg-secondary" />
                </div>
                <p className="text-sm text-fg-tertiary">All caught up!</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  className={`p-4 border-b border-slate-50 hover:bg-accent-subtle transition-colors relative group ${!n.isRead ? 'bg-accent-subtle' : ''}`}
                >
                  <div className="flex gap-3">
                    <div className="mt-1 flex-shrink-0">
                      <div className="w-8 h-8 rounded-none bg-canvas flex items-center justify-center border border-line">
                        {getIcon(n.type)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <p className={`text-sm leading-tight ${!n.isRead ? 'font-semibold text-fg' : 'text-fg-secondary'}`}>
                          {n.title}
                        </p>
                        <span className="text-meta text-fg-tertiary whitespace-nowrap">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-fg-tertiary mt-1 line-clamp-2">
                        {n.message}
                      </p>
                      {n.link && (
                        <Link
                          href={n.link}
                          onClick={() => {
                            markAsRead(n._id);
                            setIsOpen(false);
                          }}
                          className="inline-block mt-2 text-meta font-semibold text-accent-fg hover:underline"
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
                      <div className="w-2 h-2 bg-accent rounded-full"></div>
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="p-3 bg-subtle text-center">
            <Link href="/automation/reports" className="text-meta font-semibold text-fg-tertiary hover:text-accent-fg">
              View All Activity
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
