import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import HealthWidget from '../components/HealthWidget';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { formatOdometer, formatCost, formatDate, getPriorityColor, formatRelativeTime } from '../utils/format';
import {
  Car,
  Wrench,
  Calendar,
  Plus,
  Trash2,
  Edit,
  ArrowLeft,
  Settings2,
  FileText,
  Activity,
  History,
  AlertTriangle,
  Coins,
  Store,
  CheckCircle2,
  AlertOctagon,
  Thermometer,
  Zap,
  Disc,
  Gauge,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const VehicleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Data State
  const [vehicle, setVehicle] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [services, setServices] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [activeTab, setActiveTab] = useState('diagnostics');
  const [loading, setLoading] = useState(true);

  // Modals State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isOdoModalOpen, setIsOdoModalOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);

  // Edit Vehicle Form State
  const [editManufacturer, setEditManufacturer] = useState('');
  const [editModel, setEditModel] = useState('');
  const [editVariant, setEditVariant] = useState('');
  const [editYear, setEditYear] = useState('');
  const [editFuelType, setEditFuelType] = useState('Petrol');
  const [editVehicleType, setEditVehicleType] = useState('Sedan');
  
  // Odo Update Form State
  const [newOdo, setNewOdo] = useState('');

  // Service Record Form State
  const [serviceCategory, setServiceCategory] = useState('Engine Oil');
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [serviceOdo, setServiceOdo] = useState('');
  const [serviceDesc, setServiceDesc] = useState('');
  const [serviceParts, setServiceParts] = useState('');
  const [serviceCost, setServiceCost] = useState('');
  const [serviceCenter, setServiceCenter] = useState('');
  const [serviceNotes, setServiceNotes] = useState('');

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [isSimulatorExpanded, setIsSimulatorExpanded] = useState(false);

  useEffect(() => {
    fetchVehicleDetails();
  }, [id]);

  const fetchVehicleDetails = async () => {
    try {
      setLoading(true);
      const [res, apptRes] = await Promise.all([
        api.get(`/vehicles/${id}`),
        api.get('/appointments')
      ]);

      if (res.data.success) {
        setVehicle(res.data.vehicle);
        setPrediction(res.data.prediction);
        setServices(res.data.services);

        // Prepopulate edit form
        setEditManufacturer(res.data.vehicle.manufacturer);
        setEditModel(res.data.vehicle.model);
        setEditVariant(res.data.vehicle.variant || '');
        setEditYear(res.data.vehicle.year);
        setEditFuelType(res.data.vehicle.fuelType);
        setEditVehicleType(res.data.vehicle.vehicleType);
        setNewOdo(res.data.vehicle.currentOdometer);
        setServiceOdo(res.data.vehicle.currentOdometer);
      }

      if (apptRes.data.success) {
        const filtered = apptRes.data.appointments.filter(
          (a) => {
            const vehicleId = a.vehicle ? (typeof a.vehicle === 'object' ? a.vehicle._id : a.vehicle) : null;
            return vehicleId === id;
          }
        );
        setAppointments(filtered);
      }
    } catch (err) {
      console.error(err.message);
      setToast({ message: 'Failed to fetch vehicle information', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleEditVehicle = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.put(`/vehicles/${id}`, {
        manufacturer: editManufacturer,
        model: editModel,
        variant: editVariant,
        year: Number(editYear),
        fuelType: editFuelType,
        vehicleType: editVehicleType,
      });

      if (res.data.success) {
        setToast({ message: 'Vehicle details updated!', type: 'success' });
        setIsEditModalOpen(false);
        fetchVehicleDetails();
      }
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Update failed', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateOdometer = async (e) => {
    e.preventDefault();
    if (Number(newOdo) < vehicle.currentOdometer) {
      setToast({ message: 'New mileage cannot be less than current reading', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.put(`/vehicles/${id}`, {
        currentOdometer: Number(newOdo),
      });

      if (res.data.success) {
        setToast({ message: 'Odometer reading updated!', type: 'success' });
        setIsOdoModalOpen(false);
        fetchVehicleDetails();
      }
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Update failed', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteVehicle = async () => {
    setSubmitting(true);
    try {
      const res = await api.delete(`/vehicles/${id}`);
      if (res.data.success) {
        navigate('/vehicles');
      }
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to delete vehicle', type: 'error' });
      setSubmitting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const handleAddServiceRecord = async (e) => {
    e.preventDefault();
    if (!serviceOdo || !serviceDesc || !serviceCost || !serviceCenter) {
      setToast({ message: 'Please complete all required fields', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      // Split parts from comma separated string into array
      const partsArray = serviceParts
        ? serviceParts.split(',').map((p) => p.trim()).filter((p) => p !== '')
        : [];

      const res = await api.post('/services', {
        vehicle: id,
        serviceDate,
        odometerReading: Number(serviceOdo),
        serviceCategory,
        serviceDescription: serviceDesc,
        partsReplaced: partsArray,
        cost: Number(serviceCost),
        serviceCenter,
        notes: serviceNotes,
      });

      if (res.data.success) {
        setToast({ message: 'Service log recorded. Engine calculations recalculated!', type: 'success' });
        setIsServiceModalOpen(false);
        
        // Reset form
        setServiceCategory('Engine Oil');
        setServiceDate(new Date().toISOString().split('T')[0]);
        setServiceDesc('');
        setServiceParts('');
        setServiceCost('');
        setServiceCenter('');
        setServiceNotes('');
        
        fetchVehicleDetails();
      }
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to record service', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const openLogServiceForCategory = (cat) => {
    setServiceCategory(cat);
    setServiceOdo(vehicle.currentOdometer);
    setIsServiceModalOpen(true);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 dark:bg-darkBg-950">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar onToggleSidebar={() => setSidebarOpen(true)} title={`My Vehicles > ${vehicle ? `${vehicle.manufacturer} ${vehicle.model}` : 'Vehicle'}`} />

        <main className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex h-full w-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
            </div>
          ) : !vehicle ? (
            <div className="text-center py-20">
              <p className="text-slate-400">Vehicle not found.</p>
              <Link to="/vehicles" className="mt-4 text-brand-500 hover:underline inline-block">Back to Vehicles</Link>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
              {/* Back controls and actions */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <Link
                  to="/vehicles"
                  className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-655 transition-colors dark:hover:text-slate-200"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Fleet
                </Link>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setIsOdoModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-all shadow-sm dark:bg-darkBg-900 dark:border-darkBg-850 dark:text-slate-200 dark:hover:bg-darkBg-850"
                  >
                    <Activity className="h-4 w-4 text-blue-500 dark:text-brand-400" />
                    Update Odometer
                  </button>
                  
                  <button
                    onClick={() => setIsServiceModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md dark:bg-brand-600 dark:hover:bg-brand-500"
                  >
                    <Plus className="h-4 w-4" />
                    Log Repair Record
                  </button>

                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="p-2 bg-white border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-colors dark:bg-darkBg-900 dark:border-darkBg-850 dark:text-slate-450 dark:hover:text-slate-200"
                    title="Edit vehicle details"
                  >
                    <Edit className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="p-2 bg-white border border-slate-200 text-rose-500 hover:bg-rose-50/55 rounded-xl transition-colors dark:bg-darkBg-900 dark:border-darkBg-850 dark:text-rose-400 dark:hover:text-rose-300"
                    title="Delete vehicle"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Infotainment Connected Vehicle Console */}
              <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 text-white shadow-2xl dark:border-darkBg-850">
                {/* Background grid line effects */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent pointer-events-none" />
                
                <div className="relative z-10 flex flex-col xl:flex-row xl:items-stretch gap-6">
                  {/* Health Score Gauge / Digital Clock & Status */}
                  <div className="flex flex-col md:flex-row items-center gap-6 xl:w-2/5 border-b xl:border-b-0 xl:border-r border-slate-800 pb-6 xl:pb-0 xl:pr-6">
                    {/* Gauge Visual */}
                    <div className="relative flex items-center justify-center h-32 w-32 shrink-0">
                      {/* Outer Ring */}
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="64"
                          cy="64"
                          r="52"
                          className="text-slate-800"
                          strokeWidth="8"
                          stroke="currentColor"
                          fill="transparent"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="52"
                          strokeWidth="8"
                          strokeDasharray={2 * Math.PI * 52}
                          strokeDashoffset={2 * Math.PI * 52 * (1 - (prediction?.healthScore || 100) / 100)}
                          strokeLinecap="round"
                          className={`transition-all duration-1000 ${
                            (prediction?.healthScore || 100) >= 90
                              ? 'text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                              : (prediction?.healthScore || 100) >= 75
                              ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]'
                              : (prediction?.healthScore || 100) >= 50
                              ? 'text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                              : 'text-rose-500 animate-pulse drop-shadow-[0_0_10px_rgba(239,68,68,0.7)]'
                          }`}
                          fill="transparent"
                        />
                      </svg>
                      {/* Inside Text */}
                      <div className="absolute text-center">
                        <span className="text-3xl font-extrabold tracking-tight font-mono">
                          {prediction?.healthScore || 100}%
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-semibold">
                          HEALTH
                        </span>
                      </div>
                    </div>

                    {/* Digital display status messages */}
                    <div className="flex-1 space-y-2 text-center md:text-left">
                      <div className="flex items-center justify-center md:justify-start gap-2 text-xs text-slate-400 font-mono">
                        <span className={`h-2 w-2 rounded-full ${
                          vehicle.telemetry?.lastUpdated && (new Date() - new Date(vehicle.telemetry.lastUpdated)) < 5 * 60 * 1000
                            ? 'bg-emerald-500 animate-ping'
                            : 'bg-slate-500'
                        }`} />
                        <span>
                          {vehicle.telemetry?.lastUpdated 
                            ? `TELEMETRY: ${formatRelativeTime(vehicle.telemetry.lastUpdated)}`
                            : 'LIVE TELEMATICS CONNECTED'}
                        </span>
                      </div>
                      <h2 className="text-xl font-bold tracking-tight text-white flex flex-wrap items-center justify-center md:justify-start gap-2">
                        {vehicle.manufacturer} {vehicle.model}
                        <span className="text-xs bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded-lg border border-slate-700">
                          {vehicle.registrationNumber}
                        </span>
                      </h2>
                      
                      {/* Health category status text */}
                      <div className="text-sm font-semibold">
                        Status Rating: {' '}
                        <span className={
                          (prediction?.healthScore || 100) >= 90
                            ? 'text-emerald-400'
                            : (prediction?.healthScore || 100) >= 75
                            ? 'text-cyan-300'
                            : (prediction?.healthScore || 100) >= 50
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }>
                          {(prediction?.healthScore || 100) >= 90
                            ? 'Excellent (Nominal System)'
                            : (prediction?.healthScore || 100) >= 75
                            ? 'Good (Service Recommended)'
                            : (prediction?.healthScore || 100) >= 50
                            ? 'Attention Required'
                            : 'Critical (Immediate Maintenance Required)'}
                        </span>
                      </div>

                      <div className="text-xs text-slate-400 font-mono">
                        Current Mileage: <span className="text-white font-bold">{formatOdometer(vehicle.currentOdometer)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Warning System console screen */}
                  <div className="flex-1 flex flex-col justify-center gap-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
                      SYSTEM INSTRUMENTATION WARNINGS
                    </span>
                    
                    {/* Warnings List */}
                    <div className="space-y-2 max-h-36 overflow-y-auto pr-2">
                      {prediction?.predictions?.filter(p => p.status === 'Critical' || p.status === 'Maintenance Due Soon').length > 0 ? (
                        prediction.predictions
                          .filter(p => p.status === 'Critical' || p.status === 'Maintenance Due Soon')
                          .map((alert, idx) => (
                            <div
                              key={idx}
                              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border font-mono text-xs font-semibold select-none animate-pulse ${
                                alert.status === 'Critical'
                                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                              }`}
                            >
                              <span className="text-base shrink-0">
                                {alert.status === 'Critical' ? '🚨' : '⚠️'}
                              </span>
                              <div className="flex-1 min-w-0">
                                <span className="font-extrabold uppercase">
                                  {alert.status === 'Critical' ? 'CRITICAL:' : 'ATTENTION:'} {alert.category}
                                </span>
                                <span className="block text-[10px] text-slate-400 font-medium leading-relaxed truncate mt-0.5">
                                  {alert.recommendedAction}
                                </span>
                              </div>
                              <span className="text-[9px] bg-slate-805 text-slate-300 px-2 py-0.5 rounded uppercase border border-slate-700 font-extrabold shrink-0">
                                {alert.status === 'Critical' ? 'Critical' : 'Due Soon'}
                              </span>
                            </div>
                          ))
                      ) : (
                        <div className="flex items-center gap-2 px-4 py-4 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-2xl font-mono text-xs">
                          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                          <div>
                            <span className="font-extrabold">ALL SYSTEMS OPERATIONAL</span>
                            <span className="block text-[10px] text-emerald-500/70 font-medium mt-0.5">
                              No predictive diagnostic trouble alerts active. Drive safely.
                            </span>
                          </div>
                        </div>
                      )}

                      {/* OBD Trouble Code alerts */}
                      {vehicle.telemetry?.obdDtc?.map((code, idx) => (
                        <div
                          key={`obd-${idx}`}
                          className="flex items-center gap-3 px-4 py-2.5 bg-red-650/15 border border-red-500/30 text-red-400 rounded-xl font-mono text-xs font-semibold animate-pulse"
                        >
                          <AlertOctagon className="h-4 w-4 shrink-0 text-red-500" />
                          <div className="flex-1">
                            <span className="font-extrabold uppercase">OBD-II CODE DETECTED: {code}</span>
                            <span className="block text-[10px] text-slate-400 font-medium mt-0.5 leading-normal font-mono">
                              {code === 'P0300' && 'Random/Multiple Cylinder Misfire Detected.'}
                              {code === 'P0115' && 'Engine Coolant Temperature Sensor Malfunction.'}
                              {code === 'P0420' && 'Catalyst System Efficiency Below Threshold.'}
                              {!['P0300', 'P0115', 'P0420'].includes(code) && 'Diagnostic Trouble Code active.'}
                            </span>
                          </div>
                          <span className="text-[9px] bg-red-950/50 border border-red-500/35 text-red-400 px-2 py-0.5 rounded font-extrabold shrink-0">
                            FAULT
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Telemetry Live Gauges (Right side) */}
                  <div className="xl:w-1/3 flex flex-col justify-center border-t xl:border-t-0 xl:border-l border-slate-800 pt-6 xl:pt-0 xl:pl-6 space-y-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
                      LIVE INSTRUMENT CLUSTER
                    </span>
                    
                    <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                      {/* Coolant Temp Gauge */}
                      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex items-center gap-2">
                        <Thermometer className={`h-5 w-5 ${
                          (vehicle.telemetry?.coolantTemp || 90) > 105 ? 'text-red-500 animate-bounce' : 'text-blue-400'
                        }`} />
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase font-semibold">COOLANT</span>
                          <span className={`font-bold ${
                            (vehicle.telemetry?.coolTemp || vehicle.telemetry?.coolantTemp || 90) > 105 ? 'text-red-400' : 'text-slate-200'
                          }`}>
                            {vehicle.telemetry?.coolantTemp || 90}°C
                          </span>
                        </div>
                      </div>

                      {/* Battery Voltage Gauge */}
                      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex items-center gap-2">
                        <Zap className={`h-5 w-5 ${
                          (vehicle.telemetry?.batteryVoltage || 12.6) < 11.5 ? 'text-red-500 animate-pulse' : 'text-amber-400'
                        }`} />
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase font-semibold">BATTERY</span>
                          <span className={`font-bold ${
                            (vehicle.telemetry?.batteryVoltage || 12.6) < 11.5 ? 'text-red-400' : 'text-slate-200'
                          }`}>
                            {vehicle.telemetry?.batteryVoltage || 12.6}V
                          </span>
                        </div>
                      </div>

                      {/* Brake Wear Gauge */}
                      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex items-center gap-2">
                        <Disc className={`h-5 w-5 ${
                          (vehicle.telemetry?.brakePadWear || 10) > 80 ? 'text-red-500 animate-pulse' : 'text-slate-400'
                        }`} />
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase font-semibold">BRAKES</span>
                          <span className={`font-bold ${
                            (vehicle.telemetry?.brakePadWear || 10) > 80 ? 'text-red-400' : 'text-slate-200'
                          }`}>
                            {vehicle.telemetry?.brakePadWear || 10}% wear
                          </span>
                        </div>
                      </div>

                      {/* Tire pressure status */}
                      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex items-center gap-2">
                        <Gauge className="h-5 w-5 text-cyan-400" />
                        <div className="w-full">
                          <span className="text-[10px] text-slate-500 block uppercase font-semibold">TPMS STATUS</span>
                          <div className="grid grid-cols-2 text-[9px] text-slate-350 font-bold gap-x-1.5 leading-tight">
                            <span>FL: <span className={(vehicle.telemetry?.tirePressure?.fl || 33) < 26 ? 'text-red-400' : 'text-emerald-400'}>{vehicle.telemetry?.tirePressure?.fl || 33}</span></span>
                            <span>FR: <span className={(vehicle.telemetry?.tirePressure?.fr || 33) < 26 ? 'text-red-400' : 'text-emerald-400'}>{vehicle.telemetry?.tirePressure?.fr || 33}</span></span>
                            <span>RL: <span className={(vehicle.telemetry?.tirePressure?.rl || 33) < 26 ? 'text-red-400' : 'text-emerald-400'}>{vehicle.telemetry?.tirePressure?.rl || 33}</span></span>
                            <span>RR: <span className={(vehicle.telemetry?.tirePressure?.rr || 33) < 26 ? 'text-red-400' : 'text-emerald-400'}>{vehicle.telemetry?.tirePressure?.rr || 33}</span></span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Panels */}
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Left side: IoT simulator, Vehicle Specs & Activity Log */}
                <div className="flex flex-col gap-6 lg:col-span-1">
                  
                  {/* Connected Vehicle IoT Simulator */}
                  <div className="glass-card">
                    <div 
                      onClick={() => setIsSimulatorExpanded(!isSimulatorExpanded)}
                      className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-darkBg-850 pb-3 cursor-pointer select-none"
                    >
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block font-mono">
                        CONNECTED VEHICLE IoT SIMULATOR
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                        {isSimulatorExpanded ? (
                          <ChevronUp className="h-4 w-4 text-blue-500 dark:text-brand-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-blue-500 dark:text-brand-400" />
                        )}
                      </div>
                    </div>

                    {isSimulatorExpanded && (
                      <form onSubmit={handleTransmitTelemetry} className="space-y-4 text-xs animate-slide-up">
                      {/* Battery Health & Voltage */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center font-mono">
                          <span className="font-semibold text-slate-700 dark:text-slate-350">Battery Health</span>
                          <span className="font-bold text-slate-600 dark:text-slate-400">{simBatteryHealth}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={simBatteryHealth}
                          onChange={(e) => setSimBatteryHealth(Number(e.target.value))}
                          className="w-full accent-blue-600 dark:accent-brand-500 cursor-pointer"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between items-center font-mono">
                          <span className="font-semibold text-slate-700 dark:text-slate-355">Battery Voltage</span>
                          <span className="font-bold text-slate-600 dark:text-slate-400">{simBatteryVoltage} V</span>
                        </div>
                        <input
                          type="range"
                          min="10.0"
                          max="14.5"
                          step="0.1"
                          value={simBatteryVoltage}
                          onChange={(e) => setSimBatteryVoltage(Number(e.target.value))}
                          className="w-full accent-blue-600 dark:accent-brand-500 cursor-pointer"
                        />
                      </div>

                      {/* Brake Pad Wear */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center font-mono">
                          <span className="font-semibold text-slate-700 dark:text-slate-355">Brake Pad Wear</span>
                          <span className="font-bold text-slate-600 dark:text-slate-400">{simBrakePadWear}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={simBrakePadWear}
                          onChange={(e) => setSimBrakePadWear(Number(e.target.value))}
                          className="w-full accent-blue-600 dark:accent-brand-500 cursor-pointer"
                        />
                      </div>

                      {/* Coolant Temperature */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center font-mono">
                          <span className="font-semibold text-slate-700 dark:text-slate-355">Coolant Temp</span>
                          <span className="font-bold text-slate-600 dark:text-slate-400">{simCoolantTemp} °C</span>
                        </div>
                        <input
                          type="range"
                          min="60"
                          max="120"
                          value={simCoolantTemp}
                          onChange={(e) => setSimCoolantTemp(Number(e.target.value))}
                          className="w-full accent-blue-600 dark:accent-brand-500 cursor-pointer"
                        />
                      </div>

                      {/* Tire Pressures */}
                      <div className="space-y-1">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 block font-mono">Tire Pressures (psi)</span>
                        <div className="grid grid-cols-2 gap-2 font-mono">
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-0.5">Front Left</label>
                            <input
                              type="number"
                              min="15"
                              max="45"
                              value={simTireFL}
                              onChange={(e) => setSimTireFL(Number(e.target.value))}
                              className="w-full px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-705 focus:outline-none dark:bg-darkBg-950 dark:border-darkBg-800 dark:text-slate-200"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-0.5">Front Right</label>
                            <input
                              type="number"
                              min="15"
                              max="45"
                              value={simTireFR}
                              onChange={(e) => setSimTireFR(Number(e.target.value))}
                              className="w-full px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-705 focus:outline-none dark:bg-darkBg-950 dark:border-darkBg-800 dark:text-slate-200"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-0.5">Rear Left</label>
                            <input
                              type="number"
                              min="15"
                              max="45"
                              value={simTireRL}
                              onChange={(e) => setSimTireRL(Number(e.target.value))}
                              className="w-full px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-705 focus:outline-none dark:bg-darkBg-950 dark:border-darkBg-800 dark:text-slate-200"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-0.5">Rear Right</label>
                            <input
                              type="number"
                              min="15"
                              max="45"
                              value={simTireRR}
                              onChange={(e) => setSimTireRR(Number(e.target.value))}
                              className="w-full px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-705 focus:outline-none dark:bg-darkBg-950 dark:border-darkBg-800 dark:text-slate-200"
                            />
                          </div>
                        </div>
                      </div>

                      {/* OBD-II Fault Codes checkboxes */}
                      <div className="space-y-1.5 pt-1">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 block font-mono">OBD-II Fault Codes</span>
                        <div className="grid grid-cols-1 gap-1.5">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={simObdCodes.includes('P0300')}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSimObdCodes([...simObdCodes, 'P0300']);
                                } else {
                                  setSimObdCodes(simObdCodes.filter(c => c !== 'P0300'));
                                }
                              }}
                              className="h-3.5 w-3.5 accent-blue-600 dark:accent-brand-500 rounded border-slate-300 dark:border-darkBg-800"
                            />
                            <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400">P0300 - Engine Misfire</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={simObdCodes.includes('P0115')}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSimObdCodes([...simObdCodes, 'P0115']);
                                } else {
                                  setSimObdCodes(simObdCodes.filter(c => c !== 'P0115'));
                                }
                              }}
                              className="h-3.5 w-3.5 accent-blue-600 dark:accent-brand-500 rounded border-slate-300 dark:border-darkBg-800"
                            />
                            <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400">P0115 - Coolant Temp Sensor Fault</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={simObdCodes.includes('P0420')}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSimObdCodes([...simObdCodes, 'P0420']);
                                } else {
                                  setSimObdCodes(simObdCodes.filter(c => c !== 'P0420'));
                                }
                              }}
                              className="h-3.5 w-3.5 accent-blue-600 dark:accent-brand-500 rounded border-slate-300 dark:border-darkBg-800"
                            />
                            <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400">P0420 - Catalyst Efficiency</span>
                          </label>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={transmittingTelemetry}
                        className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md disabled:opacity-50 mt-4 dark:bg-brand-600 dark:hover:bg-brand-500"
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${transmittingTelemetry ? 'animate-spin' : ''}`} />
                        {transmittingTelemetry ? 'Transmitting...' : 'Transmit Telematics'}
                      </button>
                    </form>
                  )}
                </div>

                  {/* Stockomo Details Card */}
                  <div className="glass-card">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-4">DETAILS</span>
                    <div className="space-y-3.5 text-sm">
                      <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-darkBg-850 mb-3">
                        <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Health Rating</span>
                        {prediction ? (
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${getHealthBg(prediction.healthScore)}`}>
                            {prediction.healthScore}%
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 dark:text-slate-550">Calculating...</span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-slate-400 dark:text-slate-500 col-span-1">Category</span>
                        <span className="text-slate-300 dark:text-slate-705 col-span-0.5 text-center">:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-205 col-span-1.5">{vehicle.vehicleType}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-slate-400 dark:text-slate-500 col-span-1">Priority</span>
                        <span className="text-slate-305 dark:text-slate-707 col-span-0.5 text-center">:</span>
                        <span className="col-span-1.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                            !prediction || prediction.healthScore >= 80
                              ? 'bg-emerald-50 border-emerald-200/50 text-emerald-600 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400'
                              : prediction.healthScore >= 50
                              ? 'bg-amber-50 border-amber-200/50 text-amber-600 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400'
                              : 'bg-rose-50 border-rose-200/50 text-rose-600 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-455'
                          }`}>
                            {!prediction || prediction.healthScore >= 80 ? 'Low' : prediction.healthScore >= 50 ? 'Medium' : 'High'}
                          </span>
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-slate-400 dark:text-slate-500 col-span-1">Odometer</span>
                        <span className="text-slate-300 dark:text-slate-705 col-span-0.5 text-center">:</span>
                        <span className="font-mono font-semibold text-slate-705 dark:text-slate-200 col-span-1.5">{formatOdometer(vehicle.currentOdometer)}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-slate-400 dark:text-slate-500 col-span-1">Fuel Type</span>
                        <span className="text-slate-300 dark:text-slate-705 col-span-0.5 text-center">:</span>
                        <span className="font-semibold text-slate-705 dark:text-slate-200 col-span-1.5">{vehicle.fuelType}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-slate-400 dark:text-slate-500 col-span-1">Year</span>
                        <span className="text-slate-300 dark:text-slate-705 col-span-0.5 text-center">:</span>
                        <span className="font-semibold text-slate-750 dark:text-slate-200 col-span-1.5">{vehicle.year}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-slate-400 dark:text-slate-500 col-span-1">Registered</span>
                        <span className="text-slate-300 dark:text-slate-705 col-span-0.5 text-center">:</span>
                        <span className="font-mono text-xs font-semibold text-slate-705 dark:text-slate-200 col-span-1.5">{vehicle.registrationNumber}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-slate-400 dark:text-slate-500 col-span-1">Purchased</span>
                        <span className="text-slate-300 dark:text-slate-705 col-span-0.5 text-center">:</span>
                        <span className="font-semibold text-slate-705 dark:text-slate-200 col-span-1.5">{formatDate(vehicle.purchaseDate)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Maintenance Cost Forecast Card */}
                  {prediction && (
                    <div className="glass-card animate-slide-up">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 text-sm">
                          <Coins className="h-5 w-5 text-amber-500 animate-pulse-slow" />
                          Maintenance Cost Forecast
                        </h3>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-darkBg-850">
                          <span className="text-xs text-slate-400 dark:text-slate-500">Predicted Upcoming Spend</span>
                          <span className="text-base font-extrabold text-slate-200">
                            {formatCost(
                              prediction.predictions
                                ?.filter(p => p.status !== 'Healthy')
                                ?.reduce((sum, p) => sum + p.estimatedCost, 0) || 0
                            )}
                          </span>
                        </div>
                        <div className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed font-mono">
                          This is the estimated cost of servicing components currently marked as 'Critical', 'Maintenance Due Soon', or 'Attention Required'.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Stockomo Activity Log Card */}
                  <div className="glass-card">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-4">ACTIVITY LOG</span>
                    <div className="space-y-4">
                      {services.slice(0, 3).map((srv, idx) => (
                        <div key={idx} className="flex gap-3 items-start">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 font-bold text-xs dark:bg-darkBg-850 dark:text-brand-400 uppercase">
                            {srv.serviceCenter?.slice(0, 2) || 'SC'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-250 leading-tight">
                              {srv.serviceCategory} logged
                            </p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                              At {srv.serviceCenter} • {formatDate(srv.serviceDate)}
                            </p>
                          </div>
                        </div>
                      ))}
                      {services.length === 0 && (
                        <div className="text-center py-6 text-slate-450 dark:text-slate-500 text-xs">
                          No repair activities logged.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right side: Tabbed diagnostic list & schedules */}
                <div className="flex flex-col gap-6 lg:col-span-2">
                  
                  {/* Stockomo-inspired tabbed body card */}
                  <div className="glass-card flex-1 flex flex-col p-0 overflow-hidden">
                    {/* Tabs bar */}
                    <div className="flex border-b border-slate-100 dark:border-darkBg-850 px-6 pt-4">
                      <button
                        onClick={() => setActiveTab('diagnostics')}
                        className={`pb-4 px-2 text-sm font-semibold border-b-2 transition-all ${
                          activeTab === 'diagnostics'
                            ? 'border-blue-600 text-blue-600 dark:border-brand-500 dark:text-brand-400'
                            : 'border-transparent text-slate-400 hover:text-slate-655 dark:hover:text-slate-300'
                        }`}
                      >
                        Diagnostics
                      </button>
                      <button
                        onClick={() => setActiveTab('logs')}
                        className={`pb-4 px-2 ml-6 text-sm font-semibold border-b-2 transition-all ${
                          activeTab === 'logs'
                            ? 'border-blue-600 text-blue-600 dark:border-brand-500 dark:text-brand-400'
                            : 'border-transparent text-slate-400 hover:text-slate-655 dark:hover:text-slate-300'
                        }`}
                      >
                        Service History
                      </button>
                      <button
                        onClick={() => setActiveTab('appointments')}
                        className={`pb-4 px-2 ml-6 text-sm font-semibold border-b-2 transition-all ${
                          activeTab === 'appointments'
                            ? 'border-blue-600 text-blue-600 dark:border-brand-500 dark:text-brand-400'
                            : 'border-transparent text-slate-400 hover:text-slate-655 dark:hover:text-slate-300'
                        }`}
                      >
                        Appointments
                      </button>
                    </div>

                    {/* Tab contents */}
                    <div className="p-6 overflow-y-auto">
                      {activeTab === 'diagnostics' && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Component Diagnostics Checklist</span>
                            {prediction && (
                              <span className="text-xs text-slate-400 dark:text-slate-500">
                                Overall Health: <strong>{prediction.healthScore}%</strong>
                              </span>
                            )}
                          </div>
                          
                          <div className="divide-y divide-slate-100 dark:divide-darkBg-850">
                            {prediction?.predictions?.map((pred) => (
                              <div
                                key={pred._id}
                                className="py-5 flex flex-col gap-3 group first:pt-0 last:pb-0 border-b border-slate-100 last:border-0 dark:border-darkBg-850"
                              >
                                {/* First line: category, health %, status */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                  <div className="flex items-center gap-2.5">
                                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{pred.category}</h4>
                                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border uppercase ${
                                      pred.status === 'Critical'
                                        ? 'bg-rose-50 border-rose-200/50 text-rose-600 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-455'
                                        : pred.status === 'Maintenance Due Soon'
                                        ? 'bg-amber-50 border-amber-200/50 text-amber-600 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400'
                                        : pred.status === 'Attention Required'
                                        ? 'bg-yellow-50 border-yellow-200/50 text-yellow-600 dark:bg-yellow-500/10 dark:border-yellow-500/20 dark:text-yellow-400'
                                        : 'bg-emerald-50 border-emerald-200/50 text-emerald-600 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400'
                                    }`}>
                                      {pred.status}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-400 dark:text-slate-500 font-bold font-mono">
                                      {pred.healthPercent}% Health
                                    </span>
                                  </div>
                                </div>

                                {/* Second line: Sleek remaining life progress bar */}
                                <div className="w-full bg-slate-100 rounded-full h-1.5 dark:bg-darkBg-850 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      pred.healthPercent >= 75
                                        ? 'bg-emerald-500'
                                        : pred.healthPercent >= 50
                                        ? 'bg-yellow-400'
                                        : pred.healthPercent >= 25
                                        ? 'bg-amber-500'
                                        : 'bg-rose-500 animate-pulse'
                                    }`}
                                    style={{ width: `${pred.healthPercent}%` }}
                                  />
                                </div>

                                {/* Third line: details and action controls */}
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
                                  <div className="space-y-1 max-w-xl">
                                    <div className="text-[11px] text-slate-455 dark:text-slate-400 leading-normal">
                                      Remaining: <span className={pred.remainingDistance <= 0 && pred.remainingDays <= 0 ? 'text-rose-500 font-bold' : 'font-bold text-slate-650 dark:text-slate-300'}>
                                        {pred.remainingDistance > 0 ? `${pred.remainingDistance.toLocaleString()} km` : '0 km'}
                                        {' / '}
                                        {pred.remainingDays > 0 ? `${pred.remainingDays} days` : '0 days'}
                                      </span>
                                      {pred.status !== 'Healthy' && (
                                        <div className="mt-1 font-semibold text-slate-700 dark:text-slate-300">
                                          💡 Recommendation: <span className="font-normal text-slate-500 dark:text-slate-400">{pred.recommendedAction}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                                    {pred.status !== 'Healthy' && (
                                      <div className="flex items-center gap-2.5 mr-2">
                                        <div className="text-right">
                                          <span className="text-[10px] text-slate-455 dark:text-slate-500 block uppercase font-mono leading-none">Est. Cost</span>
                                          <span className="text-xs font-bold text-slate-700 dark:text-slate-202">
                                            {formatCost(pred.estimatedCost)}
                                          </span>
                                        </div>
                                        
                                        <button
                                          onClick={() => handleAutoBookDealer(pred.category, pred.estimatedCost)}
                                          disabled={submitting}
                                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold rounded-xl transition-all shadow-sm dark:bg-brand-600 dark:hover:bg-brand-500 disabled:opacity-50 cursor-pointer"
                                        >
                                          <Calendar className="h-3.5 w-3.5" />
                                          Auto-Book Service
                                        </button>
                                      </div>
                                    )}

                                    <button
                                      onClick={() => openLogServiceForCategory(pred.category)}
                                      className="px-3 py-1.5 bg-white border border-slate-200 text-slate-650 text-[10px] font-bold rounded-xl hover:bg-slate-100 transition-all cursor-pointer dark:bg-darkBg-850 dark:border-darkBg-800 dark:text-slate-350 dark:hover:bg-darkBg-800"
                                    >
                                      Log Service
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {activeTab === 'logs' && (
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Historical Logs</span>
                          </div>

                          {services.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50 dark:border-darkBg-800 dark:bg-darkBg-900/10">
                              <FileText className="h-8 w-8 text-slate-400 mb-2 animate-pulse" />
                              <p className="text-xs text-slate-500">No repair logs recorded</p>
                              <button
                                onClick={() => setIsServiceModalOpen(true)}
                                className="mt-2 text-xs font-semibold text-blue-600 hover:underline"
                              >
                                Log First Service
                              </button>
                            </div>
                          ) : (
                            <div className="relative border-l border-slate-100 ml-2 space-y-6 dark:border-darkBg-850">
                              {services.map((srv) => (
                                <div key={srv._id} className="relative pl-6 group">
                                  {/* Bullet point circle */}
                                  <div className="absolute -left-[4.5px] top-1.5 h-2 w-2 rounded-full bg-blue-500 dark:bg-brand-500" />

                                  <div className="p-4 rounded-xl bg-slate-50/50 border border-slate-100 hover:bg-slate-50/70 hover:border-slate-200 transition-all dark:bg-darkBg-900/40 dark:border-darkBg-850 dark:hover:bg-darkBg-900/70">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                                      <div className="flex items-center gap-2">
                                        <h4 className="font-semibold text-slate-800 text-sm dark:text-slate-200">{srv.serviceCategory}</h4>
                                        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">• {formatOdometer(srv.odometerReading)}</span>
                                      </div>
                                      <span className="text-[10px] font-semibold text-slate-400">
                                        {formatDate(srv.serviceDate)}
                                      </span>
                                    </div>

                                    <p className="text-xs text-slate-500 dark:text-slate-450 mt-2 leading-relaxed">
                                      {srv.serviceDescription}
                                    </p>

                                    {srv.partsReplaced?.length > 0 && (
                                      <div className="mt-3 flex flex-wrap gap-1 items-center">
                                        <span className="text-[10px] text-slate-400 font-semibold mr-1">Parts:</span>
                                        {srv.partsReplaced.map((part, pidx) => (
                                          <span key={pidx} className="text-[9px] font-medium px-2 py-0.5 bg-white border border-slate-150 rounded text-slate-655 dark:bg-darkBg-850 dark:border-darkBg-800 dark:text-slate-350">
                                            {part}
                                          </span>
                                        ))}
                                      </div>
                                    )}

                                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-450 dark:border-darkBg-850 font-medium">
                                      <span className="flex items-center gap-1">
                                        <Store className="h-3.5 w-3.5" /> {srv.serviceCenter}
                                      </span>
                                      <span className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-300">
                                        <Coins className="h-3.5 w-3.5 text-blue-550 dark:text-brand-400" /> {formatCost(srv.cost)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {activeTab === 'appointments' && (
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Scheduled Service Appointments</span>
                          </div>

                          {appointments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50 dark:border-darkBg-800 dark:bg-darkBg-900/10">
                              <Calendar className="h-8 w-8 text-slate-400 mb-2" />
                              <p className="text-xs text-slate-500">No appointments booked for this vehicle</p>
                              <Link
                                to="/appointments"
                                className="mt-2 text-xs font-semibold text-blue-650 hover:underline dark:text-brand-400"
                              >
                                Book Service Slot
                              </Link>
                            </div>
                          ) : (
                            <div className="grid gap-3 sm:grid-cols-2">
                              {appointments.map((appt) => (
                                <div
                                  key={appt._id}
                                  className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 flex flex-col justify-between dark:border-darkBg-850 dark:bg-darkBg-900"
                                >
                                  <div>
                                    <div className="flex items-center justify-between mb-2.5">
                                      <span className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                                        appt.status === 'Confirmed'
                                          ? 'bg-emerald-50 border-emerald-200/50 text-emerald-600 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400'
                                          : 'bg-amber-50 border-amber-200/50 text-amber-600 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400'
                                      }`}>
                                        {appt.status}
                                      </span>
                                      <span className="text-[10px] text-slate-400 font-semibold">
                                        {formatDate(appt.appointmentDate)}
                                      </span>
                                    </div>
                                    <h4 className="font-semibold text-slate-700 dark:text-slate-200 text-sm">{appt.serviceCategory}</h4>
                                    <p className="text-xs text-slate-450 dark:text-slate-400 mt-1 leading-normal">{appt.notes || 'No comments provided'}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Edit Vehicle Details Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Vehicle Details">
        <form onSubmit={handleEditVehicle} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Manufacturer *</label>
              <input
                type="text"
                required
                value={editManufacturer}
                onChange={(e) => setEditManufacturer(e.target.value)}
                className="w-full px-3 py-2 bg-darkBg-950 border border-darkBg-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-brand-500"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Model *</label>
              <input
                type="text"
                required
                value={editModel}
                onChange={(e) => setEditModel(e.target.value)}
                className="w-full px-3 py-2 bg-darkBg-950 border border-darkBg-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Variant</label>
              <input
                type="text"
                value={editVariant}
                onChange={(e) => setEditVariant(e.target.value)}
                className="w-full px-3 py-2 bg-darkBg-950 border border-darkBg-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Year Model *</label>
              <input
                type="number"
                required
                value={editYear}
                onChange={(e) => setEditYear(e.target.value)}
                className="w-full px-3 py-2 bg-darkBg-950 border border-darkBg-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fuel Type *</label>
              <select
                value={editFuelType}
                onChange={(e) => setEditFuelType(e.target.value)}
                className="w-full px-3 py-2 bg-darkBg-950 border border-darkBg-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-brand-500"
              >
                <option value="Petrol">Petrol</option>
                <option value="Diesel">Diesel</option>
                <option value="Electric">Electric</option>
                <option value="Hybrid">Hybrid</option>
                <option value="CNG">CNG</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Classification *</label>
              <select
                value={editVehicleType}
                onChange={(e) => setEditVehicleType(e.target.value)}
                className="w-full px-3 py-2 bg-darkBg-950 border border-darkBg-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-brand-500"
              >
                <option value="Sedan">Sedan</option>
                <option value="SUV">SUV</option>
                <option value="Hatchback">Hatchback</option>
                <option value="Coupe">Coupe</option>
                <option value="Convertible">Convertible</option>
                <option value="Minivan">Minivan</option>
                <option value="Pickup Truck">Pickup Truck</option>
                <option value="Truck">Truck</option>
                <option value="Van">Van</option>
                <option value="Motorcycle">Motorcycle</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-darkBg-850">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl text-sm transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Update Odometer Modal */}
      <Modal isOpen={isOdoModalOpen} onClose={() => setIsOdoModalOpen(false)} title="Update Odometer Reading">
        <form onSubmit={handleUpdateOdometer} className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs text-slate-400 leading-normal">
              Enter the current odometer value. Doing so resets standard calculations for time/mileage diagnostics.
            </p>
            <div className="flex items-center gap-3 py-2">
              <span className="text-xs text-slate-500">Current reading:</span>
              <span className="text-sm font-bold text-slate-300">{formatOdometer(vehicle?.currentOdometer)}</span>
            </div>
            <input
              type="number"
              required
              value={newOdo}
              onChange={(e) => setNewOdo(e.target.value)}
              placeholder="e.g. 46500"
              className="w-full px-4 py-3 bg-darkBg-950 border border-darkBg-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-darkBg-850">
            <button
              type="button"
              onClick={() => setIsOdoModalOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl text-sm transition-colors"
            >
              Update
            </button>
          </div>
        </form>
      </Modal>

      {/* Log Service Record Modal */}
      <Modal isOpen={isServiceModalOpen} onClose={() => setIsServiceModalOpen(false)} title="Log Repair / Maintenance Record">
        <form onSubmit={handleAddServiceRecord} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Service Category *</label>
              <select
                value={serviceCategory}
                onChange={(e) => setServiceCategory(e.target.value)}
                className="w-full px-3 py-2 bg-darkBg-950 border border-darkBg-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-brand-500"
              >
                <option value="Engine Oil">Engine Oil</option>
                <option value="Brake Pads">Brake Pads</option>
                <option value="Brake Fluid">Brake Fluid</option>
                <option value="Battery">Battery</option>
                <option value="Coolant">Coolant</option>
                <option value="Air Filter">Air Filter</option>
                <option value="Tires">Tires</option>
                <option value="Wiper Blades">Wiper Blades</option>
                <option value="First Aid Kit Expiry">First Aid Kit Expiry</option>
                <option value="General Vehicle Service">General Vehicle Service</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Service Date *</label>
              <input
                type="date"
                required
                value={serviceDate}
                onChange={(e) => setServiceDate(e.target.value)}
                className="w-full px-3 py-2 bg-darkBg-950 border border-darkBg-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Odometer Reading (km) *</label>
              <input
                type="number"
                required
                value={serviceOdo}
                onChange={(e) => setServiceOdo(e.target.value)}
                placeholder="Odometer when serviced"
                className="w-full px-3 py-2 bg-darkBg-950 border border-darkBg-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="space-y-1.5 col-span-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Description *</label>
              <input
                type="text"
                required
                value={serviceDesc}
                onChange={(e) => setServiceDesc(e.target.value)}
                placeholder="e.g. Engine oil replaced with Mobil 1, oil filter swapped"
                className="w-full px-3 py-2 bg-darkBg-950 border border-darkBg-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="space-y-1.5 col-span-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Parts Replaced (comma separated)</label>
              <input
                type="text"
                value={serviceParts}
                onChange={(e) => setServiceParts(e.target.value)}
                placeholder="e.g. Engine Oil, Oil Filter, Spark Plug"
                className="w-full px-3 py-2 bg-darkBg-950 border border-darkBg-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cost (₹ INR) *</label>
              <input
                type="number"
                required
                value={serviceCost}
                onChange={(e) => setServiceCost(e.target.value)}
                placeholder="Total invoice cost"
                className="w-full px-3 py-2 bg-darkBg-950 border border-darkBg-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Service Center *</label>
              <input
                type="text"
                required
                value={serviceCenter}
                onChange={(e) => setServiceCenter(e.target.value)}
                placeholder="e.g. Pep Boys #104"
                className="w-full px-3 py-2 bg-darkBg-950 border border-darkBg-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="space-y-1.5 col-span-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Notes</label>
              <textarea
                value={serviceNotes}
                onChange={(e) => setServiceNotes(e.target.value)}
                placeholder="Additional mechanics observations..."
                rows="2"
                className="w-full px-3 py-2 bg-darkBg-950 border border-darkBg-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-brand-500 resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-darkBg-850">
            <button
              type="button"
              onClick={() => setIsServiceModalOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl text-sm transition-colors"
            >
              {submitting ? 'Saving...' : 'Save Record'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Vehicle Deletion">
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm leading-relaxed">
            <AlertTriangle className="h-6 w-6 shrink-0" />
            <span>
              <strong>Warning:</strong> Deleting this vehicle will permanently clear all its historical repair records, scheduled appointments, and calculations logs. This action is irreversible.
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Are you sure you want to delete <strong>{vehicle?.manufacturer} {vehicle?.model} ({vehicle?.registrationNumber})</strong>?
          </p>

          <div className="flex justify-end gap-3 pt-4 border-t border-darkBg-850">
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-sm transition-colors"
            >
              No, Keep Vehicle
            </button>
            <button
              type="button"
              onClick={handleDeleteVehicle}
              disabled={submitting}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl text-sm transition-colors"
            >
              {submitting ? 'Deleting...' : 'Yes, Delete Vehicle'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Toast banner */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
};

export default VehicleDetail;
