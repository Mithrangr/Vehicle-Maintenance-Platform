import React, { useState, useEffect, useMemo } from 'react';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/format';
import {
  Calendar as CalendarIcon,
  Plus,
  CalendarRange,
  Clock,
  Check,
  AlertCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Wrench
} from 'lucide-react';

const CATEGORIES = [
  'Engine Oil',
  'Brake Pads',
  'Brake Fluid',
  'Battery',
  'Coolant',
  'Air Filter',
  'Tires',
  'Wiper Blades',
  'First Aid Kit Expiry',
  'General Vehicle Service',
  'Other'
];

const Appointments = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Data state
  const [appointments, setAppointments] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Book Appointment Form State
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [category, setCategory] = useState('Engine Oil');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');

  // Reschedule Modal State
  const [isReschedModalOpen, setIsReschedModalOpen] = useState(false);
  const [reschedId, setReschedId] = useState('');
  const [reschedDate, setReschedDate] = useState('');
  const [reschedTime, setReschedTime] = useState('');
  const [reschedNotes, setReschedNotes] = useState('');

  // Cancel Confirmation Modal State
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [apptToCancel, setApptToCancel] = useState(null);

  // Calendar navigation state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);

  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAppointmentsAndVehicles();
  }, []);

  const fetchAppointmentsAndVehicles = async () => {
    try {
      setLoading(true);
      const [apptRes, vehRes] = await Promise.all([
        api.get('/appointments'),
        api.get('/vehicles'),
      ]);

      if (apptRes.data.success) setAppointments(apptRes.data.appointments);
      if (vehRes.data.success) {
        setVehicles(vehRes.data.vehicles);
        if (vehRes.data.vehicles.length > 0) {
          setSelectedVehicle(vehRes.data.vehicles[0]._id);
        }
      }
    } catch (err) {
      console.error(err.message);
      setToast({ message: 'Failed to fetch appointment rosters', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    if (!selectedVehicle || !date || !time) {
      setToast({ message: 'Please complete all fields', type: 'error' });
      return;
    }

    const fullDateTime = new Date(`${date}T${time}`);
    if (fullDateTime < new Date()) {
      setToast({ message: 'Appointment date must be in the future', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/appointments', {
        vehicle: selectedVehicle,
        serviceCategory: category,
        appointmentDate: fullDateTime.toISOString(),
        notes,
      });

      if (res.data.success) {
        setToast({ message: 'Service slot booked successfully!', type: 'success' });
        setIsBookModalOpen(false);
        // Reset form
        setDate('');
        setTime('');
        setNotes('');
        fetchAppointmentsAndVehicles();
      }
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Booking failed', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReschedule = async (e) => {
    e.preventDefault();
    if (!reschedDate || !reschedTime) {
      setToast({ message: 'Please enter a valid date and time', type: 'error' });
      return;
    }

    const fullDateTime = new Date(`${reschedDate}T${reschedTime}`);
    if (fullDateTime < new Date()) {
      setToast({ message: 'Date must be in the future', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.put(`/appointments/${reschedId}/reschedule`, {
        appointmentDate: fullDateTime.toISOString(),
        notes: reschedNotes,
      });

      if (res.data.success) {
        setToast({ message: 'Appointment rescheduled!', type: 'success' });
        setIsReschedModalOpen(false);
        fetchAppointmentsAndVehicles();
      }
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Rescheduling failed', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const openCancelModal = (appt) => {
    setApptToCancel(appt);
    setIsCancelModalOpen(true);
  };

  const handleCancel = async () => {
    if (!apptToCancel) return;
    try {
      const res = await api.put(`/appointments/${apptToCancel._id}/cancel`);
      if (res.data.success) {
        setToast({ message: 'Appointment cancelled', type: 'info' });
        fetchAppointmentsAndVehicles();
      }
    } catch (err) {
      setToast({ message: 'Cancellation failed', type: 'error' });
    } finally {
      setIsCancelModalOpen(false);
      setApptToCancel(null);
    }
  };

  const handleAdminUpdateStatus = async (id, status) => {
    try {
      const res = await api.put(`/appointments/${id}/status`, { status });
      if (res.data.success) {
        setToast({ message: `Appointment status updated to ${status}!`, type: 'success' });
        fetchAppointmentsAndVehicles();
      }
    } catch (err) {
      setToast({ message: 'Failed to update status', type: 'error' });
    }
  };

  const openReschedModal = (appt) => {
    setReschedId(appt._id);
    const dateObj = new Date(appt.appointmentDate);
    setReschedDate(dateObj.toISOString().split('T')[0]);
    setReschedTime(dateObj.toTimeString().split(' ')[0].slice(0, 5));
    setReschedNotes(appt.notes || '');
    setIsReschedModalOpen(true);
  };

  // Calendar Helpers
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // First day of the month index (0 = Sun, 1 = Mon, etc.)
    const firstDayIndex = new Date(year, month, 1).getDay();
    // Total days in the month
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    // Pad previous month days
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    // Fill current month days
    for (let i = 1; i <= totalDays; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  }, [currentMonth]);

  // Map of appointments by date string for quick calendar lookups
  const appointmentsDateMap = useMemo(() => {
    const map = {};
    appointments.forEach((appt) => {
      const dateStr = new Date(appt.appointmentDate).toDateString();
      if (!map[dateStr]) {
        map[dateStr] = [];
      }
      map[dateStr].push(appt);
    });
    return map;
  }, [appointments]);

  // Filtered appointments based on selected date on mini calendar
  const filteredAppointments = useMemo(() => {
    if (!selectedCalendarDate) return appointments;
    const dateStr = selectedCalendarDate.toDateString();
    return appointments.filter((appt) => new Date(appt.appointmentDate).toDateString() === dateStr);
  }, [appointments, selectedCalendarDate]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 dark:bg-darkBg-950">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar onToggleSidebar={() => setSidebarOpen(true)} title="Appointments" />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-100">Scheduled Services</h2>
                <p className="text-xs text-slate-400">Book and inspect service appointments</p>
              </div>
              <button
                disabled={vehicles.length === 0}
                onClick={() => setIsBookModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg shadow-brand-500/10 transition-all self-start sm:self-auto"
              >
                <Plus className="h-4 w-4" />
                Book Appointment Slot
              </button>
            </div>

            {/* Layout Grid */}
            <div className="grid gap-6 lg:grid-cols-3">
              
              {/* Mini Calendar View Column */}
              <div className="lg:col-span-1 space-y-6">
                <div className="glass-card">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Service Calendar</h3>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={prevMonth}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-darkBg-850 rounded-lg text-slate-400 dark:text-slate-500"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200 min-w-[80px] text-center">
                        {currentMonth.toLocaleString('default', { month: 'short', year: 'numeric' })}
                      </span>
                      <button
                        onClick={nextMonth}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-darkBg-850 rounded-lg text-slate-400 dark:text-slate-500"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1 text-center mb-4">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, idx) => (
                      <span key={idx} className="text-[10px] font-bold text-slate-400 dark:text-slate-500 py-1 uppercase">
                        {d}
                      </span>
                    ))}
                    {calendarDays.map((day, idx) => {
                      if (!day) {
                        return <div key={`empty-${idx}`} className="aspect-square" />;
                      }

                      const dateStr = day.toDateString();
                      const dayAppts = appointmentsDateMap[dateStr] || [];
                      const isSelected = selectedCalendarDate && selectedCalendarDate.toDateString() === dateStr;
                      const isToday = new Date().toDateString() === dateStr;
                      
                      // Determine status dots
                      const hasPending = dayAppts.some(a => a.status === 'Pending');
                      const hasConfirmed = dayAppts.some(a => a.status === 'Confirmed');

                      return (
                        <button
                          key={`day-${idx}`}
                          onClick={() => setSelectedCalendarDate(isSelected ? null : day)}
                          className={`aspect-square relative flex flex-col items-center justify-center rounded-xl text-xs font-semibold transition-all hover:bg-brand-500/10 ${
                            isSelected
                              ? 'bg-brand-600 text-white hover:bg-brand-500'
                              : isToday
                              ? 'border border-brand-500/50 text-brand-500 bg-brand-500/5'
                              : 'text-slate-700 dark:text-slate-350'
                          }`}
                        >
                          <span>{day.getDate()}</span>
                          
                          {/* Indicator dots */}
                          {dayAppts.length > 0 && (
                            <div className="absolute bottom-1 flex gap-0.5">
                              {hasConfirmed && (
                                <span className={`h-1 w-1 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-400'}`} />
                              )}
                              {hasPending && (
                                <span className={`h-1 w-1 rounded-full ${isSelected ? 'bg-white' : 'bg-amber-400'}`} />
                              )}
                              {!hasConfirmed && !hasPending && (
                                <span className={`h-1 w-1 rounded-full ${isSelected ? 'bg-white' : 'bg-slate-400'}`} />
                              )}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Filter Status Panel */}
                  <div className="pt-3 border-t border-slate-100 dark:border-darkBg-850 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                      <div className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-400" /> Confirmed
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Pending
                      </div>
                    </div>
                    {selectedCalendarDate && (
                      <button
                        onClick={() => setSelectedCalendarDate(null)}
                        className="text-[10px] font-bold text-blue-600 hover:text-blue-500 dark:text-brand-400 dark:hover:text-brand-300 flex items-center gap-1"
                      >
                        <Filter className="h-2.5 w-2.5" /> Clear Filter
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Appointments List Column */}
              <div className="lg:col-span-2 space-y-4">
                {selectedCalendarDate && (
                  <div className="p-3 bg-blue-50/40 border border-blue-100 rounded-xl flex items-center justify-between dark:bg-darkBg-900/30 dark:border-darkBg-850 animate-fade-in">
                    <p className="text-xs text-slate-500 dark:text-slate-450">
                      Showing appointments for <strong>{formatDate(selectedCalendarDate)}</strong>
                    </p>
                    <button
                      onClick={() => setSelectedCalendarDate(null)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-500 dark:text-brand-400 dark:hover:text-brand-300"
                    >
                      Show All
                    </button>
                  </div>
                )}

                {loading ? (
                  <div className="flex justify-center py-20">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
                  </div>
                ) : filteredAppointments.length === 0 ? (
                  <div className="text-center py-20 border border-dashed border-darkBg-850 rounded-2xl bg-darkBg-900/10">
                    <CalendarIcon className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-slate-300">No appointments scheduled</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {selectedCalendarDate
                        ? 'No slots reserved for this specific date.'
                        : 'Book a service slot to reserve your appointment.'}
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-1 xl:grid-cols-2">
                    {filteredAppointments.map((appt) => {
                      const apptDate = new Date(appt.appointmentDate);
                      return (
                        <div
                          key={appt._id}
                          className="glass-card hover:border-brand-500/20 flex flex-col justify-between"
                        >
                          <div>
                            {/* Header status */}
                            <div className="flex items-center justify-between mb-4">
                              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border uppercase ${
                                appt.status === 'Completed'
                                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                  : appt.status === 'Confirmed'
                                  ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                                  : appt.status === 'Cancelled'
                                  ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                                  : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                              }`}>
                                {appt.status}
                              </span>
                              <span className="text-[10px] text-slate-500 font-semibold uppercase flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {apptDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            {/* Title details */}
                            <h3 className="text-base font-bold text-slate-200">{appt.serviceCategory}</h3>
                            <p className="text-xs text-slate-400 mt-0.5">
                              Vehicle: {appt.vehicle ? `${appt.vehicle.manufacturer} ${appt.vehicle.model}` : 'Removed'} 
                              {appt.vehicle?.registrationNumber && ` (${appt.vehicle.registrationNumber})`}
                            </p>
                            
                            {appt.notes && (
                              <p className="text-xs text-slate-500 mt-3 p-3 bg-darkBg-950 border border-darkBg-850 rounded-xl leading-relaxed italic">
                                "{appt.notes}"
                              </p>
                            )}

                            {/* Date details */}
                            <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                              <CalendarRange className="h-4 w-4 text-brand-400" />
                              <span>Scheduled Date: <strong>{formatDate(appt.appointmentDate)}</strong></span>
                            </div>

                            {/* Admin Info */}
                            {user.role === 'admin' && appt.user && (
                              <p className="text-[10px] text-slate-500 mt-3 uppercase tracking-wider font-semibold">
                                Booked by: {appt.user.name} ({appt.user.email})
                              </p>
                            )}
                          </div>

                          {/* Controls */}
                          <div className="mt-6 pt-4 border-t border-darkBg-850 flex flex-wrap gap-2.5 items-center justify-between">
                            {/* User Actions */}
                            {appt.status !== 'Completed' && appt.status !== 'Cancelled' ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => openReschedModal(appt)}
                                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors border border-darkBg-800"
                                >
                                  Reschedule
                                </button>
                                <button
                                  onClick={() => openCancelModal(appt)}
                                  className="px-3.5 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 text-xs font-semibold rounded-lg transition-colors border border-rose-500/20"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-500 font-semibold">Log Locked</span>
                            )}

                            {/* Admin Action Triggers */}
                            {user.role === 'admin' && appt.status === 'Pending' && (
                              <div className="flex gap-1.5 ml-auto">
                                <button
                                  onClick={() => handleAdminUpdateStatus(appt._id, 'Confirmed')}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-1 transition-colors"
                                  title="Confirm Appointment"
                                >
                                  <Check className="h-3.5 w-3.5" /> Confirm
                                </button>
                                <button
                                  onClick={() => handleAdminUpdateStatus(appt._id, 'Cancelled')}
                                  className="p-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg flex items-center justify-center transition-colors"
                                  title="Reject / Cancel"
                                >
                                  <XCircle className="h-4 w-4" />
                                </button>
                              </div>
                            )}

                            {user.role === 'admin' && appt.status === 'Confirmed' && (
                              <button
                                onClick={() => handleAdminUpdateStatus(appt._id, 'Completed')}
                                className="px-3.5 py-1.5 ml-auto bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-1 transition-colors"
                              >
                                <Check className="h-3.5 w-3.5" /> Mark Completed
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

          </div>
        </main>
      </div>

      {/* Book Slot Modal */}
      <Modal isOpen={isBookModalOpen} onClose={() => setIsBookModalOpen(false)} title="Book Service Appointment">
        <form onSubmit={handleBookAppointment} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Select Vehicle *</label>
            <select
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              className="w-full px-3 py-2 bg-darkBg-950 border border-darkBg-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-brand-500"
            >
              {vehicles.map((v) => (
                <option key={v._id} value={v._id}>
                  {v.manufacturer} {v.model} ({v.registrationNumber})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Service Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-darkBg-950 border border-darkBg-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-brand-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Appointment Date *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-darkBg-950 border border-darkBg-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Preferred Time *</label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 bg-darkBg-950 border border-darkBg-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Service Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe symptoms, requirements, or custom requests..."
              rows="3"
              className="w-full px-3 py-2 bg-darkBg-950 border border-darkBg-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-brand-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-darkBg-850">
            <button
              type="button"
              onClick={() => setIsBookModalOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl text-sm transition-colors"
            >
              {submitting ? 'Reserving...' : 'Book Slot'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Reschedule Modal */}
      <Modal isOpen={isReschedModalOpen} onClose={() => setIsReschedModalOpen(false)} title="Reschedule Appointment">
        <form onSubmit={handleReschedule} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">New Date *</label>
              <input
                type="date"
                required
                value={reschedDate}
                onChange={(e) => setReschedDate(e.target.value)}
                className="w-full px-3 py-2 bg-darkBg-950 border border-darkBg-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">New Time *</label>
              <input
                type="time"
                required
                value={reschedTime}
                onChange={(e) => setReschedTime(e.target.value)}
                className="w-full px-3 py-2 bg-darkBg-950 border border-darkBg-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Reschedule Notes</label>
            <textarea
              value={reschedNotes}
              onChange={(e) => setReschedNotes(e.target.value)}
              placeholder="Explain reasons for adjustment or update mechanic remarks..."
              rows="3"
              className="w-full px-3 py-2 bg-darkBg-950 border border-darkBg-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-brand-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-darkBg-850">
            <button
              type="button"
              onClick={() => setIsReschedModalOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl text-sm transition-colors"
            >
              {submitting ? 'Applying...' : 'Reschedule'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Cancel Confirmation Modal */}
      <Modal isOpen={isCancelModalOpen} onClose={() => setIsCancelModalOpen(false)} title="Cancel Appointment">
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            Are you sure you want to cancel your service slot request for{' '}
            <strong className="text-slate-100">{apptToCancel?.serviceCategory}</strong>?
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-darkBg-850">
            <button
              type="button"
              onClick={() => setIsCancelModalOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-sm transition-colors"
            >
              Keep Slot
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl text-sm transition-colors"
            >
              Confirm Cancel
            </button>
          </div>
        </div>
      </Modal>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
};

export default Appointments;
