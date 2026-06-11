import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import StatCard from '../components/StatCard';
import HealthWidget from '../components/HealthWidget';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { formatOdometer, formatDate, formatRelativeTime, getHealthBg } from '../utils/format';
import {
  Car,
  Wrench,
  AlertTriangle,
  Heart,
  Plus,
  Calendar,
  Bell,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Call parallel endpoints
        const [analRes, vehRes, apptRes, notifRes] = await Promise.all([
          api.get('/analytics/dashboard'),
          api.get('/vehicles'),
          api.get('/appointments'),
          api.get('/notifications'),
        ]);

        if (analRes.data.success) setAnalytics(analRes.data.data);
        if (vehRes.data.success) setVehicles(vehRes.data.vehicles);
        if (apptRes.data.success) setAppointments(apptRes.data.appointments);
        if (notifRes.data.success) setNotifications(notifRes.data.notifications);
      } catch (err) {
        console.error('Failed to load dashboard data:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (err) {
      console.error(err.message);
    }
  };

  const getUrgentPredictions = () => {
    const urgent = [];
    vehicles.forEach((v) => {
      if (v.prediction && v.prediction.predictions) {
        v.prediction.predictions.forEach((p) => {
          if (p.status !== 'Healthy') {
            urgent.push({
              vehicleId: v._id,
              vehicleName: `${v.manufacturer} ${v.model}`,
              regNo: v.registrationNumber,
              ...p,
            });
          }
        });
      }
    });
    // Sort by priorityScore descending
    return urgent.sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 4);
  };

  const urgentItems = getUrgentPredictions();
  const upcomingAppts = appointments
    .filter((a) => a.status === 'Confirmed' || a.status === 'Pending')
    .slice(0, 3);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 dark:bg-darkBg-950">
      {/* Navigation Left Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Container */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar onToggleSidebar={() => setSidebarOpen(true)} title="Dashboard" />

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex h-full w-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
            </div>
          ) : vehicles.length === 0 ? (
            /* Onboarding State */
            <div className="flex h-[80vh] flex-col items-center justify-center text-center p-6 max-w-lg mx-auto">
              <div className="rounded-3xl bg-brand-500/10 p-5 text-brand-400 mb-6 border border-brand-500/25">
                <Car className="h-12 w-12" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Register Your First Vehicle</h2>
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Welcome to AeroKeep! Add your car, SUV, or motorcycle to start tracking maintenance logs, scheduling center slots, and predicting parts replacements.
              </p>
              <button
                onClick={() => navigate('/vehicles')}
                className="mt-8 inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/10 active:transform active:scale-[0.98] transition-all dark:bg-brand-600 dark:hover:bg-brand-500 dark:shadow-brand-500/20"
              >
                <Plus className="h-5 w-5" />
                Add Vehicle
              </button>
            </div>
          ) : (
            /* Dashboard Grid */
            <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
              {/* Stat Cards Grid */}
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  title="Total Vehicles"
                  value={analytics?.totalVehicles || vehicles.length}
                  icon={<Car className="h-6 w-6" />}
                  description="Registered in fleet"
                />
                <StatCard
                  title="Upcoming Maintenance"
                  value={analytics?.upcomingMaintenance || 0}
                  icon={<Wrench className="h-6 w-6" />}
                  description="Require attention soon"
                  trend={analytics?.upcomingMaintenance > 0 ? 'Action Needed' : 'Normal'}
                  trendType={analytics?.upcomingMaintenance > 0 ? 'negative' : 'positive'}
                />
                <StatCard
                  title="Overdue Systems"
                  value={analytics?.overdueMaintenance || 0}
                  icon={<AlertTriangle className="h-6 w-6" />}
                  description="Exceeded safety threshold"
                  trend={analytics?.overdueMaintenance > 0 ? 'CRITICAL' : 'Clear'}
                  trendType={analytics?.overdueMaintenance > 0 ? 'negative' : 'positive'}
                />
                <StatCard
                  title="Fleet Health Index"
                  value={`${analytics?.averageHealthScore || 100}%`}
                  icon={<Heart className="h-6 w-6" />}
                  description="Average score"
                  trend={analytics?.averageHealthScore >= 80 ? 'Good' : 'Fair'}
                  trendType={analytics?.averageHealthScore >= 80 ? 'positive' : 'negative'}
                />
              </div>

              {/* Lower Body Layout */}
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Fleet Health Meter & Quick Vehicles list */}
                <div className="flex flex-col gap-6 lg:col-span-1">
                  <div className="glass-card">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4">Fleet Health Status</h3>
                    <HealthWidget score={analytics?.averageHealthScore || 100} />
                  </div>

                  {/* Vehicles Quick Access */}
                  <div className="glass-card flex-1">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-slate-800 dark:text-slate-100">My Fleet</h3>
                      <Link to="/vehicles" className="text-xs font-semibold text-blue-600 hover:text-blue-500 dark:text-brand-400 dark:hover:text-brand-300 flex items-center gap-1">
                        View All <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                    <div className="space-y-3">
                      {vehicles.slice(0, 3).map((vehicle) => (
                        <Link
                          key={vehicle._id}
                          to={`/vehicles/${vehicle._id}`}
                          className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/60 border border-slate-100 hover:border-blue-500/20 hover:bg-blue-50/20 transition-all group dark:bg-darkBg-900 dark:border-darkBg-850 dark:hover:border-brand-500/20 dark:hover:bg-darkBg-850/30"
                        >
                          <div>
                            <p className="font-semibold text-sm text-slate-700 group-hover:text-blue-600 transition-colors dark:text-slate-200 dark:group-hover:text-brand-400">
                              {vehicle.manufacturer} {vehicle.model}
                            </p>
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider dark:text-slate-500">
                              {vehicle.registrationNumber} • {formatOdometer(vehicle.currentOdometer)}
                            </span>
                          </div>
                          
                          {vehicle.prediction ? (
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${getHealthBg(vehicle.prediction.healthScore)}`}>
                              {vehicle.prediction.healthScore}%
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 dark:text-slate-500">Calculating...</span>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Urgent Alerts and Calendar Schedules */}
                <div className="flex flex-col gap-6 lg:col-span-2">
                  {/* Urgent Maintenance Warnings */}
                  <div className="glass-card">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                      Alert Tracker
                    </h3>
                    
                    {urgentItems.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50 dark:border-darkBg-800 dark:bg-darkBg-900/10">
                        <ShieldCheck className="h-10 w-10 text-emerald-500 mb-2.5" />
                        <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm">All Systems Healthy</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">No pending maintenance alerts detected.</p>
                      </div>
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {urgentItems.map((item, index) => (
                          <div
                            key={index}
                            className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 flex flex-col justify-between dark:border-darkBg-850 dark:bg-darkBg-900"
                          >
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  item.status === 'Overdue'
                                    ? 'bg-rose-50 border-rose-200/50 text-rose-600 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400'
                                    : 'bg-amber-50 border-amber-200/50 text-amber-600 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400'
                                }`}>
                                  {item.status}
                                </span>
                                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                                  Score: {item.priorityScore}
                                </span>
                              </div>
                              <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200">{item.category}</h4>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.vehicleName} ({item.regNo})</p>
                            </div>
                            
                            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 font-medium dark:border-darkBg-850">
                              <span>Distance: {item.remainingDistance <= 0 ? 'Limit Exceeded' : `${item.remainingDistance} km`}</span>
                              <span>Days: {item.remainingDays <= 0 ? 'Time Exceeded' : `${item.remainingDays}d`}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Appointments List & Notifications */}
                  <div className="grid gap-6 md:grid-cols-2 flex-1">
                    {/* Appointments Card */}
                    <div className="glass-card flex flex-col">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-blue-500 dark:text-brand-400" />
                          Upcoming Services
                        </h3>
                        <Link to="/appointments" className="text-xs font-semibold text-blue-600 hover:text-blue-500 dark:text-brand-400 dark:hover:text-brand-300">
                          Book Slot
                        </Link>
                      </div>

                      <div className="space-y-3 flex-1">
                        {upcomingAppts.length === 0 ? (
                          <div className="flex h-32 flex-col items-center justify-center text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50 dark:border-darkBg-800 dark:bg-darkBg-900/10">
                            <p className="text-xs text-slate-400 dark:text-slate-500">No scheduled appointments</p>
                          </div>
                        ) : (
                          upcomingAppts.map((appt) => (
                            <div
                              key={appt._id}
                              className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between dark:border-darkBg-850 dark:bg-darkBg-900"
                            >
                              <div>
                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{appt.serviceCategory}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                  {appt.vehicle.manufacturer} {appt.vehicle.model} • {formatDate(appt.appointmentDate)}
                                </p>
                              </div>
                              
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                appt.status === 'Confirmed'
                                  ? 'bg-emerald-550 border-emerald-200/50 text-emerald-600 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400'
                                  : 'bg-amber-50 border-amber-200/50 text-amber-600 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400'
                              }`}>
                                {appt.status}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Inbox Notifications list */}
                    <div className="glass-card flex flex-col">
                      <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                        <Bell className="h-5 w-5 text-blue-500 dark:text-brand-400" />
                        Inbox Alert Feed
                      </h3>

                      <div className="space-y-3 flex-1">
                        {notifications.filter(n => !n.isRead).length === 0 ? (
                          <div className="flex h-32 flex-col items-center justify-center text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50 dark:border-darkBg-800 dark:bg-darkBg-900/10">
                            <p className="text-xs text-slate-400 dark:text-slate-500">Inbox is empty</p>
                          </div>
                        ) : (
                          notifications.filter(n => !n.isRead).slice(0, 3).map((notif) => (
                            <div
                              key={notif._id}
                              className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 flex items-start gap-2.5 relative group dark:border-darkBg-850 dark:bg-darkBg-900"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{notif.title}</p>
                                <p className="text-[10px] text-slate-450 dark:text-slate-400 mt-0.5 line-clamp-1 leading-normal">
                                  {notif.message}
                                </p>
                              </div>
                              <button
                                onClick={() => handleMarkAsRead(notif._id)}
                                className="text-[10px] font-bold text-blue-600 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity dark:text-brand-400 dark:hover:text-brand-300"
                              >
                                Mark Read
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
