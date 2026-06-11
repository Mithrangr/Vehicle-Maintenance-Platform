import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { formatOdometer, getHealthBg } from '../utils/format';
import { Car, Plus, Search, Filter, Fuel, Calendar, CalendarRange, Eye } from 'lucide-react';

const Vehicles = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search and Filter State
  const [search, setSearch] = useState('');
  const [fuelFilter, setFuelFilter] = useState('');

  // Add Vehicle Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [regNo, setRegNo] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [model, setModel] = useState('');
  const [variant, setVariant] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [fuelType, setFuelType] = useState('Petrol');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [odometer, setOdometer] = useState('');
  const [vehicleType, setVehicleType] = useState('Sedan');
  
  // Toast State
  const [toast, setToast] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const res = await api.get('/vehicles');
      if (res.data.success) {
        setVehicles(res.data.vehicles);
      }
    } catch (err) {
      console.error(err.message);
      setToast({ message: 'Failed to load vehicles list', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    if (!regNo || !manufacturer || !model || !year || !fuelType || !purchaseDate || !odometer || !vehicleType) {
      setToast({ message: 'Please enter all required fields', type: 'error' });
      return;
    }

    setFormSubmitting(true);
    try {
      const res = await api.post('/vehicles', {
        registrationNumber: regNo,
        manufacturer,
        model,
        variant,
        year: Number(year),
        fuelType,
        purchaseDate,
        currentOdometer: Number(odometer),
        vehicleType,
      });

      if (res.data.success) {
        setToast({ message: 'Vehicle registered successfully!', type: 'success' });
        setIsModalOpen(false);
        // Reset form
        setRegNo('');
        setManufacturer('');
        setModel('');
        setVariant('');
        setYear(new Date().getFullYear());
        setFuelType('Petrol');
        setPurchaseDate('');
        setOdometer('');
        setVehicleType('Sedan');
        // Refresh list
        fetchVehicles();
      }
    } catch (err) {
      setToast({
        message: err.response?.data?.message || 'Failed to add vehicle. Registration number may be duplicate.',
        type: 'error',
      });
    } finally {
      setFormSubmitting(false);
    }
  };

  const filteredVehicles = vehicles.filter((v) => {
    const matchesSearch =
      v.manufacturer.toLowerCase().includes(search.toLowerCase()) ||
      v.model.toLowerCase().includes(search.toLowerCase()) ||
      v.registrationNumber.toLowerCase().includes(search.toLowerCase());
    const matchesFuel = fuelFilter === '' || v.fuelType === fuelFilter;
    return matchesSearch && matchesFuel;
  });

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 dark:bg-darkBg-950">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar onToggleSidebar={() => setSidebarOpen(true)} title="My Vehicles" />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
            {/* Header section with add button */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Manage Fleet</h2>
                <p className="text-xs text-slate-550 dark:text-slate-400">Track and inspect registered vehicles</p>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/10 transition-all self-start sm:self-auto dark:bg-brand-600 dark:hover:bg-brand-500 dark:shadow-brand-500/20"
              >
                <Plus className="h-4 w-4" />
                Register Vehicle
              </button>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-4 bg-white dark:bg-darkBg-900 border border-slate-200/50 dark:border-darkBg-850 rounded-2xl shadow-sm">
              <div className="relative w-full md:max-w-sm">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search manufacturer, model or plate..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 dark:border-darkBg-800 dark:bg-darkBg-950 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white dark:text-slate-100 dark:focus:border-brand-500 transition-colors"
                />
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <Filter className="h-4 w-4 text-slate-400 shrink-0" />
                <select
                  value={fuelFilter}
                  onChange={(e) => setFuelFilter(e.target.value)}
                  className="w-full md:w-40 px-3 py-2 bg-slate-50 border border-slate-200 dark:border-darkBg-800 dark:bg-darkBg-950 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-blue-600 focus:bg-white dark:text-slate-300 dark:focus:border-brand-500 transition-colors"
                >
                  <option value="">All Fuel Types</option>
                  <option value="Petrol">Petrol</option>
                  <option value="Diesel">Diesel</option>
                  <option value="Electric">Electric</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="CNG">CNG</option>
                </select>
              </div>
            </div>

            {/* Vehicles Cards Grid */}
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
              </div>
            ) : filteredVehicles.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50 dark:border-darkBg-800 dark:bg-darkBg-900/10">
                <Car className="h-10 w-10 text-slate-400 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No vehicles found</p>
                <p className="text-xs text-slate-500 mt-1">Try refining your search keywords or filter settings.</p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredVehicles.map((v) => (
                  <div
                    key={v._id}
                    className="glass-card hover:border-blue-500/20 dark:hover:border-brand-500/20 flex flex-col justify-between group h-full relative"
                  >
                    <div>
                      {/* Top plate and type */}
                      <div className="flex items-start justify-between mb-4">
                        <span className="font-mono text-xs font-bold px-2.5 py-1 bg-slate-100 dark:bg-darkBg-800 rounded-lg text-slate-400 tracking-wider border border-slate-200/50 dark:border-darkBg-750 uppercase">
                          {v.registrationNumber}
                        </span>
                        
                        {v.prediction ? (
                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${getHealthBg(v.prediction.healthScore)}`}>
                            Health: {v.prediction.healthScore}%
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-semibold uppercase">Calibrating</span>
                        )}
                      </div>

                      {/* Manufacturer and Model */}
                      <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors dark:text-slate-200 dark:group-hover:text-brand-400">
                        {v.manufacturer} {v.model}
                      </h3>
                      <p className="text-xs text-slate-450 dark:text-slate-400 mt-0.5">{v.variant || 'Standard Variant'}</p>

                      {/* Specs */}
                      <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-darkBg-850 text-xs text-slate-500 dark:text-slate-400 font-medium">
                        <div className="flex items-center gap-2">
                          <Fuel className="h-4 w-4 text-slate-400" />
                          <span>{v.fuelType}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          <span>Year {v.year}</span>
                        </div>
                        <div className="flex items-center gap-2 col-span-2">
                          <span className="font-semibold text-slate-400">Odometer:</span>
                          <span className="text-slate-700 font-semibold dark:text-slate-300">{formatOdometer(v.currentOdometer)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6">
                      <Link
                        to={`/vehicles/${v._id}`}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-50 border border-slate-200 text-slate-700 hover:bg-blue-600 hover:text-white hover:border-transparent text-xs font-semibold rounded-xl transition-all shadow-sm dark:bg-darkBg-850 dark:border-darkBg-800 dark:text-slate-200 dark:hover:bg-brand-600"
                      >
                        <Eye className="h-4 w-4" />
                        Inspect Health & Logs
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add Vehicle Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register New Vehicle">
        <form onSubmit={handleAddVehicle} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Registration Number *</label>
              <input
                type="text"
                required
                value={regNo}
                onChange={(e) => setRegNo(e.target.value)}
                placeholder="e.g. TX-FORD-778"
                className="w-full px-3 py-2 bg-darkBg-950 border border-darkBg-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-brand-500 uppercase"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Manufacturer *</label>
              <input
                type="text"
                required
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                placeholder="e.g. Ford, Tesla"
                className="w-full px-3 py-2 bg-darkBg-950 border border-darkBg-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Model *</label>
              <input
                type="text"
                required
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. F-150, Model 3"
                className="w-full px-3 py-2 bg-darkBg-950 border border-darkBg-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Variant</label>
              <input
                type="text"
                value={variant}
                onChange={(e) => setVariant(e.target.value)}
                placeholder="e.g. Lariat V8, Dual Motor"
                className="w-full px-3 py-2 bg-darkBg-950 border border-darkBg-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Year *</label>
              <input
                type="number"
                required
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full px-3 py-2 bg-darkBg-950 border border-darkBg-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fuel Type *</label>
              <select
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value)}
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
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Vehicle Type *</label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
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

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Purchase Date *</label>
              <input
                type="date"
                required
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full px-3 py-2 bg-darkBg-950 border border-darkBg-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Odometer Reading (km) *</label>
              <input
                type="number"
                required
                value={odometer}
                onChange={(e) => setOdometer(e.target.value)}
                placeholder="Current Odometer"
                className="w-full px-3 py-2 bg-darkBg-950 border border-darkBg-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-darkBg-850">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formSubmitting}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl text-sm shadow-md transition-colors"
            >
              {formSubmitting ? 'Registering...' : 'Register'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Global Toast Notifications */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
};

export default Vehicles;
