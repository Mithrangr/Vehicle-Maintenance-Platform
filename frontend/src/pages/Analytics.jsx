import React, { useState, useEffect, useMemo } from 'react';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { formatCost } from '../utils/format';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { BarChart3, TrendingUp, DollarSign, Activity, PieChart as PieIcon, Coins } from 'lucide-react';

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#64748b'];

const Analytics = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalyticsAndVehicles = async () => {
      try {
        setLoading(true);
        const [analRes, vehRes] = await Promise.all([
          api.get('/analytics/dashboard'),
          api.get('/vehicles')
        ]);
        
        if (analRes.data.success) {
          setAnalytics(analRes.data.data);
        }
        if (vehRes.data.success) {
          setVehicles(vehRes.data.vehicles);
        }
      } catch (err) {
        console.error('Failed to load analytics charts:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsAndVehicles();
  }, []);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 bg-darkBg-900 border border-darkBg-800 rounded-xl shadow-lg text-xs text-slate-200">
          <p className="font-bold mb-1">{label}</p>
          <p className="text-brand-400 font-semibold">Spending: {formatCost(payload[0].value)}</p>
          {payload[1] && <p className="text-emerald-400 font-semibold">Services: {payload[1].value}</p>}
        </div>
      );
    }
    return null;
  };

  const pieData = useMemo(() => {
    if (!analytics?.categoryCosts || analytics.categoryCosts.length === 0) {
      return [{ name: 'No Data', value: 1 }];
    }
    return analytics.categoryCosts.map((item) => ({
      name: item.category,
      value: item.cost,
    }));
  }, [analytics]);

  const forecastData = useMemo(() => {
    if (!analytics?.costForecast?.items || analytics.costForecast.items.length === 0) {
      return [];
    }
    const grouped = {};
    analytics.costForecast.items.forEach(item => {
      if (!grouped[item.category]) {
        grouped[item.category] = 0;
      }
      grouped[item.category] += item.estimatedCost;
    });

    return Object.keys(grouped).map(cat => ({
      category: cat,
      cost: grouped[cat]
    }));
  }, [analytics]);

  const healthComparisonData = useMemo(() => {
    return vehicles.map(v => ({
      name: `${v.manufacturer} ${v.model}`,
      health: v.prediction?.healthScore ?? 100
    }));
  }, [vehicles]);

  const monthlyData = analytics?.monthlyCosts || [];

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 dark:bg-darkBg-950">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar onToggleSidebar={() => setSidebarOpen(true)} title="Insights" />

        <main className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex h-full w-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
            </div>
          ) : !analytics || (monthlyData.length === 0 && pieData[0]?.name === 'No Data' && vehicles.length === 0) ? (
            <div className="text-center py-20 border border-dashed border-darkBg-850 rounded-2xl bg-darkBg-900/10 max-w-lg mx-auto">
              <BarChart3 className="h-10 w-10 text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-300">Insufficient analytics records</p>
              <p className="text-xs text-slate-500 mt-1">Add vehicles and log repair service records to view spend summaries.</p>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
              {/* Header */}
              <div>
                <h2 className="text-xl font-bold text-slate-100">Fleet Insights</h2>
                <p className="text-xs text-slate-400">Inspect cost allocations, mileage histories, and part statuses</p>
              </div>

              {/* Top row stats summary cards */}
              <div className="grid gap-6 sm:grid-cols-3">
                <div className="glass-card flex items-center gap-4 py-5 px-6">
                  <div className="rounded-xl bg-brand-500/10 p-3 text-brand-400">
                    <DollarSign className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Fleet Spend</span>
                    <p className="text-xl font-extrabold text-slate-200 mt-0.5">
                      {formatCost(pieData.reduce((sum, item) => sum + (item.name !== 'No Data' ? item.value : 0), 0))}
                    </p>
                  </div>
                </div>

                <div className="glass-card flex items-center gap-4 py-5 px-6">
                  <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-400">
                    <Activity className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Average Fleet Health</span>
                    <p className="text-xl font-extrabold text-slate-200 mt-0.5">
                      {analytics?.averageHealthScore || 100}%
                    </p>
                  </div>
                </div>

                <div className="glass-card flex items-center gap-4 py-5 px-6">
                  <div className="rounded-xl bg-amber-500/10 p-3 text-amber-400">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Active Alerts</span>
                    <p className="text-xl font-extrabold text-slate-200 mt-0.5">
                      {(analytics?.upcomingMaintenance || 0) + (analytics?.overdueMaintenance || 0)} issues
                    </p>
                  </div>
                </div>
              </div>

              {/* Visualizations Grid */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* 1. Monthly Repairs Expenditures */}
                <div className="glass-card">
                  <h3 className="font-bold text-slate-100 mb-4 flex items-center gap-2 text-sm">
                    <TrendingUp className="h-4 w-4 text-brand-400" />
                    Monthly Repairs Expenditures
                  </h3>
                  <div className="h-72 w-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="month" stroke="#64748b" fontSize={10} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1e293b', opacity: 0.2 }} />
                        <Bar dataKey="cost" fill="url(#colorCost)" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 2. Categorized Maintenance Expenses */}
                <div className="glass-card flex flex-col justify-between">
                  <h3 className="font-bold text-slate-100 mb-4 flex items-center gap-2 text-sm">
                    <PieIcon className="h-4 w-4 text-brand-400" />
                    Expense Distribution by Category
                  </h3>
                  <div className="h-72 w-full flex flex-col sm:flex-row items-center justify-center">
                    <div className="h-full w-full sm:w-1/2">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={75}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#0f172a" />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value) => [formatCost(value), 'Spend']}
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Custom legends side panel */}
                    <div className="flex-1 space-y-1.5 px-6 self-start sm:self-center mt-4 sm:mt-0 max-h-64 overflow-y-auto">
                      {pieData.map((item, index) => (
                        <div key={item.name} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                            <span className="text-slate-400 truncate max-w-[120px] font-semibold">{item.name}</span>
                          </div>
                          <span className="font-bold text-slate-200">{formatCost(item.value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 3. Service Events Frequency Trend */}
                <div className="glass-card lg:col-span-2">
                  <h3 className="font-bold text-slate-100 mb-4 flex items-center gap-2 text-sm">
                    <Activity className="h-4 w-4 text-brand-400" />
                    Service Events Frequency Trend
                  </h3>
                  <div className="h-64 w-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="month" stroke="#64748b" fontSize={10} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                        <Tooltip
                          formatter={(value) => [value, 'Services Run']}
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                        />
                        <Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorEvents)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 4. Maintenance Cost Forecast */}
                <div className="glass-card">
                  <h3 className="font-bold text-slate-100 mb-4 flex items-center gap-2 text-sm">
                    <Coins className="h-4 w-4 text-amber-500 animate-pulse-slow" />
                    Upcoming Maintenance Cost Forecast
                  </h3>
                  {forecastData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center border border-dashed border-darkBg-850 rounded-2xl bg-darkBg-900/10">
                      <p className="text-xs text-slate-550">No upcoming maintenance costs predicted. All systems healthy!</p>
                    </div>
                  ) : (
                    <div className="h-64 w-full pt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={forecastData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                          <XAxis dataKey="category" stroke="#64748b" fontSize={10} tickLine={false} />
                          <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                          <Tooltip
                            formatter={(value) => [formatCost(value), 'Predicted Spend']}
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                          />
                          <Bar dataKey="cost" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* 5. Vehicle Health Comparison */}
                <div className="glass-card">
                  <h3 className="font-bold text-slate-100 mb-4 flex items-center gap-2 text-sm">
                    <Activity className="h-4 w-4 text-emerald-500" />
                    Vehicle Health Index Comparison
                  </h3>
                  {healthComparisonData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center border border-dashed border-darkBg-850 rounded-2xl bg-darkBg-900/10">
                      <p className="text-xs text-slate-500">No vehicles registered yet.</p>
                    </div>
                  ) : (
                    <div className="h-64 w-full pt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={healthComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                          <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                          <YAxis stroke="#64748b" fontSize={10} tickLine={false} domain={[0, 100]} />
                          <Tooltip
                            formatter={(value) => [`${value}%`, 'Health Score']}
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                          />
                          <Bar dataKey="health" fill="#10b981" radius={[6, 6, 0, 0]}>
                            {healthComparisonData.map((entry, index) => {
                              const color = entry.health >= 80 ? '#10b981' : entry.health >= 50 ? '#f59e0b' : '#ef4444';
                              return <Cell key={`cell-${index}`} fill={color} />;
                            })}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Analytics;
