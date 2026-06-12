/**
 * Format odometer mileage string
 * @param {number} value
 * @returns {string}
 */
export const formatOdometer = (value) => {
  if (value === undefined || value === null) return '0 km';
  return `${Number(value).toLocaleString()} km`;
};

/**
 * Format currency string
 * @param {number} value
 * @returns {string}
 */
export const formatCost = (value) => {
  if (value === undefined || value === null) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value);
};

/**
 * Format standard date
 * @param {string|Date} dateVal
 * @returns {string}
 */
export const formatDate = (dateVal) => {
  if (!dateVal) return 'N/A';
  const d = new Date(dateVal);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Format relative time (e.g. "2 days ago" or "in 5 days")
 * @param {string|Date} dateVal
 * @returns {string}
 */
export const formatRelativeTime = (dateVal) => {
  if (!dateVal) return '';
  const date = new Date(dateVal);
  const now = new Date();
  const diffTime = date - now;
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 1) return `In ${diffDays} days`;
  return `${Math.abs(diffDays)} days ago`;
};

/**
 * Health Score color helper
 * @param {number} score
 * @returns {string} Tailwind text color class
 */
export const getHealthColor = (score) => {
  if (score >= 80) return 'text-emerald-500';
  if (score >= 50) return 'text-amber-500';
  return 'text-rose-500';
};

/**
 * Health Score BG color helper
 * @param {number} score
 * @returns {string} Tailwind bg class
 */
export const getHealthBg = (score) => {
  if (score >= 80) return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
  if (score >= 50) return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
  return 'bg-rose-500/10 border-rose-500/20 text-rose-400';
};

/**
 * Priority Score color helper
 * @param {number} score
 * @returns {string}
 */
export const getPriorityColor = (score) => {
  if (score >= 80) return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
  if (score >= 50) return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
};
