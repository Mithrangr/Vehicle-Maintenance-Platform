import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Toast from '../components/Toast';
import { formatDate } from '../utils/format';
import {
  Bell,
  Check,
  Trash2,
  Wrench,
  AlertTriangle,
  CalendarCheck,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

const Notifications = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.notifications);
      }
    } catch (err) {
      console.error(err.message);
      setToast({ message: 'Failed to retrieve notifications feed', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      const res = await api.put(`/notifications/${id}/read`);
      if (res.data.success) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
        );
      }
    } catch (err) {
      console.error(err.message);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await api.put('/notifications/read-all');
      if (res.data.success) {
        setToast({ message: 'All notifications marked as read', type: 'success' });
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }
    } catch (err) {
      console.error(err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await api.delete(`/notifications/${id}`);
      if (res.data.success) {
        setNotifications((prev) => prev.filter((n) => n._id !== id));
        setToast({ message: 'Notification deleted', type: 'info' });
      }
    } catch (err) {
      console.error(err.message);
    }
  };

  const handleNotifClick = (notif) => {
    if (notif.link) {
      if (!notif.isRead) handleMarkAsRead(notif._id);
      navigate(notif.link);
    }
  };

  const getNotifStyle = (type) => {
    switch (type) {
      case 'Maintenance Overdue':
        return {
          bg: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
          icon: <AlertTriangle className="h-5 w-5 text-rose-400" />,
        };
      case 'Maintenance Due':
        return {
          bg: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
          icon: <Wrench className="h-5 w-5 text-amber-400" />,
        };
      case 'Appointment Reminder':
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
          icon: <CalendarCheck className="h-5 w-5 text-emerald-400" />,
        };
      default:
        return {
          bg: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
          icon: <Bell className="h-5 w-5 text-blue-400" />,
        };
    }
  };

  const filteredNotifs = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'read') return n.isRead;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Group notifications by date
  const groupByDate = (notifs) => {
    const groups = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    notifs.forEach((n) => {
      const d = new Date(n.createdAt);
      d.setHours(0, 0, 0, 0);
      let label;
      if (d.getTime() === today.getTime()) label = 'Today';
      else if (d.getTime() === yesterday.getTime()) label = 'Yesterday';
      else if (d >= weekAgo) label = 'This Week';
      else label = 'Earlier';

      if (!groups[label]) groups[label] = [];
      groups[label].push(n);
    });

    // Return in order
    const order = ['Today', 'Yesterday', 'This Week', 'Earlier'];
    return order.filter((k) => groups[k]).map((k) => ({ label: k, items: groups[k] }));
  };

  const groupedNotifs = groupByDate(filteredNotifs);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 dark:bg-darkBg-950">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar onToggleSidebar={() => setSidebarOpen(true)} title="Notification Feed" />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-100">Inbox Notifications</h2>
                <p className="text-xs text-slate-400">Receive predictive warnings and schedule updates</p>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md self-start sm:self-auto"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Mark All Read
                </button>
              )}
            </div>

            {/* Filter buttons */}
            <div className="flex gap-2 p-1.5 bg-darkBg-900 border border-darkBg-850 rounded-xl max-w-sm">
              {['all', 'unread', 'read'].map((opt) => (
                <button
                  key={opt}
                  onClick={() => setFilter(opt)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
                    filter === opt
                      ? 'bg-brand-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {opt} {opt === 'unread' && unreadCount > 0 ? `(${unreadCount})` : ''}
                </button>
              ))}
            </div>

            {/* Notifications List — Grouped by Date */}
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
              </div>
            ) : groupedNotifs.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-darkBg-850 rounded-2xl bg-darkBg-900/10">
                <Bell className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-300">All caught up</p>
                <p className="text-xs text-slate-500 mt-1">No alerts found matching your filter criteria.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {groupedNotifs.map((group) => (
                  <div key={group.label}>
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 pl-1">
                      {group.label}
                    </h3>
                    <div className="space-y-3.5">
                      {group.items.map((notif) => {
                        const style = getNotifStyle(notif.type);
                        return (
                          <div
                            key={notif._id}
                            className={`p-4 rounded-2xl border flex items-start justify-between gap-4 transition-all ${
                              !notif.isRead
                                ? 'bg-darkBg-900/60 border-darkBg-800'
                                : 'bg-darkBg-900/25 border-darkBg-850 opacity-70'
                            } ${notif.link ? 'cursor-pointer hover:border-brand-500/20' : ''}`}
                            onClick={() => handleNotifClick(notif)}
                          >
                            <div className="flex gap-3.5 flex-1 min-w-0">
                              <div className={`rounded-xl p-2.5 h-10 w-10 flex items-center justify-center border shrink-0 ${style.bg}`}>
                                {style.icon}
                              </div>
                              <div className="space-y-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className={`text-sm font-semibold ${!notif.isRead ? 'text-slate-200' : 'text-slate-400'}`}>
                                    {notif.title}
                                  </h4>
                                  {!notif.isRead && (
                                    <span className="h-1.5 w-1.5 rounded-full bg-brand-500 shrink-0" />
                                  )}
                                </div>
                                <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                                  {notif.message}
                                </p>
                                <div className="flex items-center gap-3 pt-1">
                                  <span className="text-[10px] text-slate-500 font-semibold">
                                    {formatDate(notif.createdAt)}
                                  </span>
                                  {notif.link && (
                                    <span className="text-[10px] font-bold text-brand-400 flex items-center gap-0.5">
                                      <ExternalLink className="h-3 w-3" /> View Details
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0 self-center" onClick={(e) => e.stopPropagation()}>
                              {!notif.isRead && (
                                <button
                                  onClick={() => handleMarkAsRead(notif._id)}
                                  className="p-1.5 bg-darkBg-800 border border-darkBg-750 hover:bg-darkBg-700 text-slate-400 hover:text-slate-200 rounded-lg transition-colors"
                                  title="Mark as read"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(notif._id)}
                                className="p-1.5 bg-darkBg-800 border border-darkBg-750 hover:border-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
                                title="Delete notification"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
};

export default Notifications;
