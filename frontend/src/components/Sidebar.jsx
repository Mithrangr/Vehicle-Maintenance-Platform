import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Car,
  Wrench,
  CalendarDays,
  BarChart3,
  ShieldAlert,
  User,
  LogOut,
  X,
  Gauge
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();

  const links = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    { name: 'My Vehicles', path: '/vehicles', icon: <Car className="h-5 w-5" /> },
    { name: 'Service Logs', path: '/services', icon: <Wrench className="h-5 w-5" /> },
    { name: 'Appointments', path: '/appointments', icon: <CalendarDays className="h-5 w-5" /> },
    { name: 'Insights', path: '/analytics', icon: <BarChart3 className="h-5 w-5" /> },
  ];

  if (user && user.role === 'admin') {
    links.push({
      name: 'Admin Panel',
      path: '/admin',
      icon: <ShieldAlert className="h-5 w-5 text-indigo-400" />,
    });
  }

  const activeClass = 'flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50/70 text-blue-600 font-semibold border-l-2 border-blue-600 transition-all dark:bg-brand-600 dark:text-white dark:border-0 dark:shadow-md dark:shadow-brand-500/10';
  const inactiveClass = 'flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all duration-200 dark:text-slate-400 dark:hover:bg-darkBg-850 dark:hover:text-slate-200';

  return (
    <>
      {/* Backdrop for mobile drawer */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden dark:bg-darkBg-950/60"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-100 bg-white px-4 py-6 transition-transform duration-300 lg:static lg:translate-x-0 dark:border-darkBg-850 dark:bg-darkBg-900 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo and close control */}
        <div className="flex items-center justify-between px-2 mb-8">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-blue-600 p-2 text-white dark:bg-brand-600">
              <Gauge className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Aero<span className="text-blue-600 dark:text-brand-400">Keep</span>
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 lg:hidden dark:hover:bg-darkBg-800 dark:hover:text-slate-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 space-y-1 px-1 overflow-y-auto">
          {links.map((link) => (
            <NavLink
              key={link.name}
              to={link.path}
              onClick={() => {
                if (window.innerWidth < 1024) onClose();
              }}
              className={({ isActive }) => (isActive ? activeClass : inactiveClass)}
            >
              <span className="text-slate-400 dark:text-inherit">{link.icon}</span>
              <span className="text-sm">{link.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom User Profile Block */}
        <div className="mt-auto border-t border-slate-100 dark:border-darkBg-850 pt-4 px-1">
          <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-darkBg-850/30 transition-all">
            <NavLink
              to="/profile"
              onClick={() => {
                if (window.innerWidth < 1024) onClose();
              }}
              className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-80"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-darkBg-800 text-blue-600 dark:text-brand-400 font-bold text-sm uppercase">
                {user?.name?.slice(0, 2) || 'US'}
              </div>
              <div className="truncate pr-2">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{user?.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
              </div>
            </NavLink>

            <button
              onClick={logout}
              title="Sign Out"
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-darkBg-800 dark:hover:text-rose-400 transition-all shrink-0"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
