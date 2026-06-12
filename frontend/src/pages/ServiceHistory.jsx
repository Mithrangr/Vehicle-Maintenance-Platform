import React, { useState, useEffect, useMemo } from 'react';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { formatOdometer, formatCost, formatDate } from '../utils/format';
import {
  Wrench,
  Search,
  Plus,
  Coins,
  Store,
  ChevronDown,
  ChevronUp,
  Pencil,
  Trash2,
  Package,
  StickyNote,
  ArrowUpDown,
} from 'lucide-react';

const SERVICE_CATEGORIES = [
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
  'Other',
];

const ServiceHistory = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Data state
  const [services, setServices] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('');

  // Sort State
  const [sortField, setSortField] = useState('serviceDate');
  const [sortDir, setSortDir] = useState('desc');

  // Expanded rows
  const [expandedRow, setExpandedRow] = useState(null);

  // Add / Edit Service Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null); // null = add mode, object = edit mode
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [serviceCategory, setServiceCategory] = useState('Engine Oil');
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [serviceOdo, setServiceOdo] = useState('');
  const [serviceDesc, setServiceDesc] = useState('');
  const [serviceParts, setServiceParts] = useState('');
  const [serviceCost, setServiceCost] = useState('');
  const [serviceCenter, setServiceCenter] = useState('');
  const [serviceNotes, setServiceNotes] = useState('');

  // Delete confirmation modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [formSubmitting, setFormSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchServicesAndVehicles();
  }, []);

  const fetchServicesAndVehicles = async () => {
    try {
      setLoading(true);
      const [srvRes, vehRes] = await Promise.all([
        api.get('/services'),
        api.get('/vehicles'),
      ]);

      if (srvRes.data.success) setServices(srvRes.data.services);
      if (vehRes.data.success) {
        setVehicles(vehRes.data.vehicles);
        if (vehRes.data.vehicles.length > 0) {
          setSelectedVehicle(vehRes.data.vehicles[0]._id);
        }
      }
    } catch (err) {
      console.error(err.message);
      setToast({ message: 'Failed to load service histories', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingService(null);
    setServiceCategory('Engine Oil');
    setServiceDate(new Date().toISOString().split('T')[0]);
    setServiceOdo('');
    setServiceDesc('');
    setServiceParts('');
    setServiceCost('');
    setServiceCenter('');
    setServiceNotes('');
    if (vehicles.length > 0) setSelectedVehicle(vehicles[0]._id);
  };

  const openAddModal = () => {
    resetForm();
    if (vehicles.length > 0) {
      setServiceOdo(vehicles[0].currentOdometer);
    }
    setIsModalOpen(true);
  };

  const openEditModal = (srv) => {
    setEditingService(srv);
    const vehId = srv.vehicle?._id || srv.vehicle;
    setSelectedVehicle(vehId);
    setServiceCategory(srv.serviceCategory);
    setServiceDate(srv.serviceDate ? new Date(srv.serviceDate).toISOString().split('T')[0] : '');
    setServiceOdo(srv.odometerReading);
    setServiceDesc(srv.serviceDescription);
    setServiceParts(srv.partsReplaced?.join(', ') || '');
    setServiceCost(srv.cost);
    setServiceCenter(srv.serviceCenter);
    setServiceNotes(srv.notes || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVehicle || !serviceOdo || !serviceDesc || !serviceCost || !serviceCenter) {
      setToast({ message: 'Please complete all required fields', type: 'error' });
      return;
    }

    setFormSubmitting(true);
    try {
      const partsArray = serviceParts
        ? serviceParts.split(',').map((p) => p.trim()).filter((p) => p !== '')
        : [];

      const payload = {
        vehicle: selectedVehicle,
        serviceDate,
        odometerReading: Number(serviceOdo),
        serviceCategory,
        serviceDescription: serviceDesc,
        partsReplaced: partsArray,
        cost: Number(serviceCost),
        serviceCenter,
        notes: serviceNotes,
      };

      let res;
      if (editingService) {
        // Edit mode
        res = await api.put(`/services/${editingService._id}`, payload);
        if (res.data.success) {
          setToast({ message: 'Service record updated successfully!', type: 'success' });
        }
      } else {
        // Add mode
        res = await api.post('/services', payload);
        if (res.data.success) {
          setToast({ message: 'Maintenance record logged successfully!', type: 'success' });
        }
      }

      setIsModalOpen(false);
      resetForm();
      fetchServicesAndVehicles();
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to save record', type: 'error' });
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setFormSubmitting(true);
    try {
      const res = await api.delete(`/services/${deleteTarget._id}`);
      if (res.data.success) {
        setToast({ message: 'Service record deleted', type: 'info' });
        setIsDeleteModalOpen(false);
        setDeleteTarget(null);
        fetchServicesAndVehicles();
      }
    } catch (err) {
      setToast({ message: 'Failed to delete record', type: 'error' });
    } finally {
      setFormSubmitting(false);
    }
  };

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  // Filter and sort services
  const filteredServices = useMemo(() => {
    let result = services.filter((srv) => {
      const vehName = srv.vehicle
        ? `${srv.vehicle.manufacturer} ${srv.vehicle.model}`.toLowerCase()
        : '';
      const matchSearch =
        srv.serviceDescription.toLowerCase().includes(search.toLowerCase()) ||
        srv.serviceCenter.toLowerCase().includes(search.toLowerCase()) ||
        vehName.includes(search.toLowerCase());

      const matchCategory = categoryFilter === '' || srv.serviceCategory === categoryFilter;

      const vehId = srv.vehicle?._id || srv.vehicle;
      const matchVehicle = vehicleFilter === '' || vehId === vehicleFilter;

      return matchSearch && matchCategory && matchVehicle;
    });

    // Sort
    result.sort((a, b) => {
      let valA, valB;
      if (sortField === 'serviceDate') {
        valA = new Date(a.serviceDate).getTime();
        valB = new Date(b.serviceDate).getTime();
      } else if (sortField === 'cost') {
        valA = a.cost;
        valB = b.cost;
      } else if (sortField === 'odometerReading') {
        valA = a.odometerReading;
        valB = b.odometerReading;
      }
      return sortDir === 'asc' ? valA - valB : valB - valA;
    });

    return result;
  }, [services, search, categoryFilter, vehicleFilter, sortField, sortDir]);

  // Calculate sum of costs
  const totalCost = filteredServices.reduce((sum, srv) => sum + srv.cost, 0);

  const SortButton = ({ field, label }) => (
    <button
      onClick={() => toggleSort(field)}
      className="inline-flex items-center gap-1 hover:text-slate-200 transition-colors"
    >
      {label}
      <ArrowUpDown className={`h-3 w-3 ${sortField === field ? 'text-brand-400' : 'text-slate-600'}`} />
    </button>
  );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 dark:bg-darkBg-950">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar onToggleSidebar={() => setSidebarOpen(true)} title="Service Logs" />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-100">Service Logs Timeline</h2>
                <p className="text-xs text-slate-400">Review repairs, invoices and replacements history</p>
              </div>
              <button
                disabled={vehicles.length === 0}
                onClick={openAddModal}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg shadow-brand-500/10 transition-all self-start sm:self-auto"
              >
                <Plus className="h-4 w-4" />
                Log Maintenance Record
              </button>
            </div>

            {/* Quick spend card */}
            <div className="glass-card flex items-center justify-between border-brand-500/10 bg-brand-500/[0.02] py-4 px-6">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-brand-500/10 p-2.5 text-brand-400">
                  <Coins className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Service Expenses</p>
                  <p className="text-2xl font-bold text-slate-200 mt-0.5">{formatCost(totalCost)}</p>
                </div>
              </div>
              <span className="text-xs text-slate-500 font-semibold px-2 py-1 bg-darkBg-900 border border-darkBg-850 rounded-lg">
                {filteredServices.length} Records
              </span>
            </div>

            {/* Filters */}
            <div className="grid gap-4 sm:grid-cols-3 p-4 bg-white dark:bg-darkBg-900 border border-slate-200 dark:border-darkBg-850 rounded-2xl shadow-sm">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search description or shop..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 dark:border-darkBg-800 dark:bg-darkBg-950 rounded-xl text-sm placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>

              <div>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 dark:border-darkBg-800 dark:bg-darkBg-950 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-brand-500 transition-colors"
                >
                  <option value="">All Categories</option>
                  {SERVICE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={vehicleFilter}
                  onChange={(e) => setVehicleFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 dark:border-darkBg-800 dark:bg-darkBg-950 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-brand-500 transition-colors"
                >
                  <option value="">All Vehicles</option>
                  {vehicles.map((v) => (
                    <option key={v._id} value={v._id}>
                      {v.manufacturer} {v.model} ({v.registrationNumber})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* List Table */}
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
              </div>
            ) : filteredServices.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-darkBg-800 rounded-2xl bg-darkBg-900/10">
                <Wrench className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-300">No logs found</p>
                <p className="text-xs text-slate-500 mt-1">Try logging a service or clearing filter variables.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-darkBg-850 shadow-sm bg-white dark:bg-darkBg-900">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-50 text-slate-400 dark:bg-darkBg-850/50 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200 dark:border-darkBg-850">
                    <tr>
                      <th className="px-6 py-4">Service Details</th>
                      <th className="px-6 py-4">Vehicle</th>
                      <th className="px-6 py-4">
                        <SortButton field="odometerReading" label="Mileage" />
                      </th>
                      <th className="px-6 py-4">Service Provider</th>
                      <th className="px-6 py-4">
                        <SortButton field="cost" label="Amount" />
                      </th>
                      <th className="px-6 py-4">
                        <SortButton field="serviceDate" label="Date" />
                      </th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-darkBg-850">
                    {filteredServices.map((srv) => (
                      <React.Fragment key={srv._id}>
                        <tr
                          className="hover:bg-slate-50 dark:hover:bg-darkBg-850/30 transition-colors cursor-pointer"
                          onClick={() => setExpandedRow(expandedRow === srv._id ? null : srv._id)}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="text-slate-100 font-semibold">{srv.serviceCategory}</span>
                              {(srv.partsReplaced?.length > 0 || srv.notes) && (
                                expandedRow === srv._id
                                  ? <ChevronUp className="h-3.5 w-3.5 text-slate-500" />
                                  : <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
                              )}
                            </div>
                            <p className="text-xs text-slate-400 leading-normal mt-1 max-w-sm line-clamp-1">{srv.serviceDescription}</p>
                          </td>
                          
                          <td className="px-6 py-4 font-semibold text-slate-200">
                            {srv.vehicle ? (
                              <div>
                                <p className="text-sm">{srv.vehicle.manufacturer} {srv.vehicle.model}</p>
                                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">{srv.vehicle.registrationNumber}</span>
                              </div>
                            ) : (
                              <span className="text-slate-500">Removed</span>
                            )}
                          </td>
                          
                          <td className="px-6 py-4 font-semibold text-slate-300">
                            {formatOdometer(srv.odometerReading)}
                          </td>

                          <td className="px-6 py-4 text-slate-400 text-xs font-semibold">
                            <div className="flex items-center gap-1.5">
                              <Store className="h-4 w-4 text-slate-500" />
                              {srv.serviceCenter}
                            </div>
                          </td>

                          <td className="px-6 py-4 font-bold text-slate-200">
                            {formatCost(srv.cost)}
                          </td>

                          <td className="px-6 py-4 text-xs text-slate-400 font-semibold">
                            {formatDate(srv.serviceDate)}
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => openEditModal(srv)}
                                className="p-1.5 bg-darkBg-800 border border-darkBg-750 hover:bg-darkBg-700 text-slate-400 hover:text-brand-400 rounded-lg transition-colors"
                                title="Edit record"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => { setDeleteTarget(srv); setIsDeleteModalOpen(true); }}
                                className="p-1.5 bg-darkBg-800 border border-darkBg-750 hover:border-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
                                title="Delete record"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expanded row with parts and notes */}
                        {expandedRow === srv._id && (srv.partsReplaced?.length > 0 || srv.notes) && (
                          <tr className="bg-darkBg-900/40">
                            <td colSpan={7} className="px-6 py-4">
                              <div className="flex flex-wrap gap-6">
                                {srv.partsReplaced?.length > 0 && (
                                  <div className="flex items-start gap-2">
                                    <Package className="h-4 w-4 text-brand-400 mt-0.5 shrink-0" />
                                    <div>
                                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Parts Replaced</span>
                                      <div className="flex flex-wrap gap-1.5">
                                        {srv.partsReplaced.map((part, i) => (
                                          <span key={i} className="text-[10px] font-medium px-2 py-0.5 bg-darkBg-850 border border-darkBg-800 rounded text-slate-350">
                                            {part}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {srv.notes && (
                                  <div className="flex items-start gap-2">
                                    <StickyNote className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                                    <div>
                                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Mechanic Notes</span>
                                      <p className="text-xs text-slate-400 leading-relaxed">{srv.notes}</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add / Edit Service Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); resetForm(); }}
        title={editingService ? 'Edit Service Record' : 'Log Repair / Maintenance Record'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {!editingService && (
              <div className="space-y-1.5 col-span-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Apply to Vehicle *</label>
                <select
                  value={selectedVehicle}
                  onChange={(e) => {
                    setSelectedVehicle(e.target.value);
                    const selected = vehicles.find(v => v._id === e.target.value);
                    if (selected) setServiceOdo(selected.currentOdometer);
                  }}
                  className="w-full px-3 py-2 bg-darkBg-950 border border-darkBg-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-brand-500"
                >
                  {vehicles.map((v) => (
                    <option key={v._id} value={v._id}>
                      {v.manufacturer} {v.model} ({v.registrationNumber})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1.5 col-span-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Service Category *</label>
              <select
                value={serviceCategory}
                onChange={(e) => setServiceCategory(e.target.value)}
                className="w-full px-3 py-2 bg-darkBg-950 border border-darkBg-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-brand-500"
              >
                {SERVICE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
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
                placeholder="e.g. Engine oil and filter replaced"
                className="w-full px-3 py-2 bg-darkBg-950 border border-darkBg-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="space-y-1.5 col-span-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Parts Replaced (comma separated)</label>
              <input
                type="text"
                value={serviceParts}
                onChange={(e) => setServiceParts(e.target.value)}
                placeholder="e.g. Engine Oil, Oil Filter"
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
                placeholder="e.g. Express Lube"
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
              onClick={() => { setIsModalOpen(false); resetForm(); }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formSubmitting}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl text-sm transition-colors"
            >
              {formSubmitting ? 'Saving...' : editingService ? 'Update Record' : 'Save Log'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => { setIsDeleteModalOpen(false); setDeleteTarget(null); }} title="Delete Service Record">
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm leading-relaxed">
            <Trash2 className="h-5 w-5 shrink-0" />
            <span>This will permanently delete the service record for <strong>{deleteTarget?.serviceCategory}</strong>. This action cannot be undone.</span>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-darkBg-850">
            <button
              type="button"
              onClick={() => { setIsDeleteModalOpen(false); setDeleteTarget(null); }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={formSubmitting}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl text-sm transition-colors"
            >
              {formSubmitting ? 'Deleting...' : 'Delete Record'}
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

export default ServiceHistory;
