/**
 * Mock Utility Functions for Testing
 * Mirrors the functionality in shared/scripts.js
 */

/**
 * Format seconds to HH:MM:SS
 */
function formatTime(seconds) {
  if (!seconds || seconds < 0) seconds = 0;
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format duration (alias for formatTime)
 */
function formatDuration(seconds) {
  return formatTime(seconds);
}

/**
 * Format seconds to decimal hours (e.g., 1.5 for 1 hour 30 min)
 */
function formatDecimalHours(seconds) {
  if (!seconds || seconds < 0) return '0.00';
  const hours = seconds / 3600;
  return hours.toFixed(2);
}

/**
 * Format number as currency
 */
function formatCurrency(amount, symbol = '$') {
  if (typeof amount !== 'number') amount = 0;
  const negative = amount < 0;
  const absAmount = Math.abs(amount);
  const formatted = absAmount.toFixed(2);
  return negative ? `-${symbol}${formatted}` : `${symbol}${formatted}`;
}

/**
 * Format date to short readable string
 */
function formatDate(dateStr) {
  if (!dateStr) return 'Invalid Date';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  } catch (e) {
    return 'Invalid Date';
  }
}

/**
 * Format date to full readable string
 */
function formatDateFull(dateStr) {
  if (!dateStr) return 'Invalid Date';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (e) {
    return 'Invalid Date';
  }
}

/**
 * Calculate earnings based on time and hourly rate
 */
function calculateEarnings(seconds, hourlyRate) {
  if (!seconds || !hourlyRate) return 0;
  const hours = seconds / 3600;
  return Math.round(hours * hourlyRate * 100) / 100;
}

/**
 * Generate a UUID v4
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Debounce function
 */
function debounce(fn, delay) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Throttle function
 */
function throttle(fn, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

module.exports = {
  formatTime,
  formatDuration,
  formatDecimalHours,
  formatCurrency,
  formatDate,
  formatDateFull,
  calculateEarnings,
  generateUUID,
  debounce,
  throttle
};
