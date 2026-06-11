import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import {
  Menu,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  User,
  LogOut,
  Wrench,
  AlertOctagon,
  CalendarCheck,
  Home
} from 'lucide-react';

const Navbar = ({ onToggleSidebar, title }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false); // Default light
  const notifRef = useRef();
  const profileRef = useRef();

  // Load theme and notifications
  useEffect(() => {
    const theme = localStorage.getItem('theme') || 'light';
    setIsDarkMode(theme === 'dark');
    if (theme === 'dark') {
      document.body.classList.add('dark');
      document.body.style.backgroundColor = '#030712';
    } else {
      document.body.classList.remove('dark');
      document.body.style.backgroundColor = '#f8fafc';
    }

    fetchNotifications();

    // Poll for notifications every 60s
    const notifInterval = setInterval(fetchNotifications, 60000);

    // Click outside listener to close dropdowns
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifDropdown(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      clearInterval(notifInterval);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.notifications);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err.message);
    }
  };

  const toggleTheme = () => {
    const nextTheme = !isDarkMode ? 'dark' : 'light';
    setIsDarkMode(!isDarkMode);
    localStorage.setItem('theme', nextTheme);
    if (nextTheme === 'dark') {
      document.body.classList.add('dark');
      document.body.style.backgroundColor = '#030712';
    } else {
      document.body.classList.remove('dark');
      document.body.style.backgroundColor = '#f8fafc';
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error(err.message);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err.message);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getNotifIcon = (type) => {
    switch (type) {
      case 'Maintenance Overdue':
        return <AlertOctagon className="h-4 w-4 text-rose-400" />;
      case 'Maintenance Due':
        return <Wrench className="h-4 w-4 text-amber-400" />;
      case 'Appointment Reminder':
        return <CalendarCheck className="h-4 w-4 text-emerald-400" />;
      default:
        return <Bell className="h-4 w-4 text-brand-400" />;
    }
  };

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-slate-100 bg-white px-6 dark:border-darkBg-850 dark:bg-darkBg-900">
      {/* Title & Menu Toggle */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="rounded-xl p-2 text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-darkBg-800 lg:hidden transition-colors border border-slate-100 dark:border-darkBg-800"
        >
          <Menu className="h-4 w-4" />
        </button>
        
        {/* Breadcrumbs */}
        <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500 font-medium tracking-wide uppercase">
          <Link to="/dashboard" className="hover:text-slate-600 dark:hover:text-slate-300">
            <Home className="h-3.5 w-3.5 text-slate-400" />
          </Link>
          <span className="text-slate-300 dark:text-slate-700 font-light">&gt;</span>
          {title.includes('>') ? (
            title.split('>').map((part, index, arr) => (
              <React.Fragment key={index}>
                <span className={index === arr.length - 1 ? "text-slate-800 dark:text-slate-200 font-semibold" : "hover:text-slate-600 dark:hover:text-slate-300"}>
                  {part.trim()}
                </span>
                {index < arr.length - 1 && <span className="text-slate-300 dark:text-slate-700 font-light">&gt;</span>}
              </React.Fragment>
            ))
          ) : (
            <span className="text-slate-800 dark:text-slate-200 font-semibold">{title}</span>
          )}
        </div>
        <h1 className="text-base font-bold text-slate-800 dark:text-slate-100 sm:hidden">
          {title.includes('>') ? title.split('>').pop() : title}
        </h1>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-3">
        {/* Theme Toggler */}
        <button
          onClick={toggleTheme}
          className="rounded-xl p-2.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-darkBg-800 dark:hover:text-slate-200 transition-all shadow-sm border border-slate-200 dark:border-darkBg-800"
        >
          {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Notifications Icon and Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            className="relative rounded-xl p-2.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-darkBg-800 dark:hover:text-slate-200 transition-all shadow-sm border border-slate-200 dark:border-darkBg-800"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-md animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifDropdown && (
            <div className="absolute right-0 mt-3 w-80 origin-top-right rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-darkBg-800 dark:bg-darkBg-900 overflow-hidden z-50 transform scale-100 transition-all">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-darkBg-850">
                <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">Alerts & Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs font-semibold text-brand-500 hover:text-brand-400"
                  >
                    Clear All
                  </button>
                )}
              </div>
              
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-darkBg-850">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Bell className="h-8 w-8 text-slate-300 dark:text-darkBg-800 mb-2" />
                    <p className="text-xs text-slate-500">All caught up!</p>
                  </div>
                ) : (
                  notifications.slice(0, 5).map((notif) => (
                    <div
                      key={notif._id}
                      onClick={() => markAsRead(notif._id)}
                      className={`flex gap-3 p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-darkBg-850/50 transition-colors ${
                        !notif.isRead ? 'bg-brand-500/[0.02] dark:bg-brand-500/[0.01]' : ''
                      }`}
                    >
                      <div className="mt-0.5 rounded-lg bg-darkBg-850 p-2 h-8 w-8 flex items-center justify-center">
                        {getNotifIcon(notif.type)}
                      </div>
                      <div className="flex-1 space-y-0.5">
                        <div className="flex items-center justify-between">
                          <p className={`text-xs font-semibold ${!notif.isRead ? 'text-slate-200' : 'text-slate-400'}`}>
                            {notif.title}
                          </p>
                          {!notif.isRead && (
                            <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                          {notif.message}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <Link
                to="/notifications"
                onClick={() => setShowNotifDropdown(false)}
                className="block border-t border-slate-100 bg-slate-50 py-2.5 text-center text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-darkBg-850 dark:bg-darkBg-850/30 dark:text-slate-300 dark:hover:bg-darkBg-800"
              >
                View all notifications
              </Link>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-darkBg-800 bg-slate-50 dark:bg-darkBg-850/50 p-1.5 pr-3 text-sm font-medium hover:bg-slate-100 dark:hover:bg-darkBg-800 transition-all shadow-sm"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 font-bold text-white uppercase shadow-sm">
              {user?.name?.slice(0, 2) || 'US'}
            </div>
            <span className="hidden md:inline-block max-w-[100px] truncate text-slate-700 dark:text-slate-200">
              {user?.name}
            </span>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>

          {showProfileDropdown && (
            <div className="absolute right-0 mt-3 w-48 origin-top-right rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-darkBg-800 dark:bg-darkBg-900 overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-darkBg-850">
                <p className="text-xs text-slate-400">Signed in as</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{user?.email}</p>
              </div>
              <div className="p-1">
                <button
                  onClick={() => {
                    setShowProfileDropdown(false);
                    navigate('/profile');
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-darkBg-850 transition-colors"
                >
                  <User className="h-4 w-4" />
                  My Profile
                </button>
                <button
                  onClick={() => {
                    setShowProfileDropdown(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
