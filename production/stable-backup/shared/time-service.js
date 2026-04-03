/**
 * Ever Work - Time Service
 * Provides consistent time handling
 * Uses device time (Firebase handles server-side validation)
 */

class TimeService {
  constructor() {
    this.serverTimeOffset = 0;
    this.timeInitialized = false;
    this.userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  /**
   * Initialize time service
   */
  async init() {
    // Simple initialization - use device time
    // Firebase handles server-side timestamp validation
    this.serverTimeOffset = 0;
    this.timeInitialized = true;
    console.log('[TimeService] Using device time');
  }

  /**
   * Check if device time might have been manipulated
   * Always returns false now - Firebase handles server-side validation
   */
  isTimeManipulated() {
    return false;
  }

  /**
   * Get current accurate time
   */
  now() {
    if (!this.timeInitialized) {
      return new Date();
    }
    return new Date(Date.now() + this.serverTimeOffset);
  }

  /**
   * Get timestamp (milliseconds since epoch)
   */
  timestamp() {
    return this.now().getTime();
  }

  /**
   * Get ISO string
   */
  toISOString() {
    return this.now().toISOString();
  }

  /**
   * Get date string for user's timezone (YYYY-MM-DD)
   */
  getTodayDate() {
    return this.now().toLocaleDateString('en-CA', { 
      timeZone: this.userTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '-');
  }

  /**
   * Format time for display in user's timezone
   */
  formatTime(date, options = {}) {
    const d = date instanceof Date ? date : new Date(date);
    const defaultOptions = {
      timeZone: this.userTimezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };
    return d.toLocaleTimeString('en-US', { ...defaultOptions, ...options });
  }

  /**
   * Format date for display in user's timezone
   */
  formatDate(date, options = {}) {
    const d = date instanceof Date ? date : new Date(date);
    const defaultOptions = {
      timeZone: this.userTimezone,
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    };
    return d.toLocaleDateString('en-US', { ...defaultOptions, ...options });
  }

  /**
   * Format full datetime for display
   */
  formatDateTime(date, options = {}) {
    const d = date instanceof Date ? date : new Date(date);
    const defaultOptions = {
      timeZone: this.userTimezone,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };
    return d.toLocaleString('en-US', { ...defaultOptions, ...options });
  }

  /**
   * Calculate duration between two timestamps in hours
   */
  calculateHours(start, end) {
    const startTime = start instanceof Date ? start.getTime() : new Date(start).getTime();
    const endTime = end instanceof Date ? end.getTime() : new Date(end).getTime();
    const diffMs = endTime - startTime;
    return diffMs / (1000 * 60 * 60); // Convert to hours
  }

  /**
   * Format duration in hours to display string
   */
  formatDuration(hours) {
    if (hours < 1) {
      const minutes = Math.round(hours * 60);
      return `${minutes}m`;
    }
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    if (minutes === 0) {
      return `${wholeHours}h`;
    }
    return `${wholeHours}h ${minutes}m`;
  }

  /**
   * Get start of day for user's timezone
   */
  getStartOfDay(date = new Date()) {
    const d = new Date(date);
    const userDate = d.toLocaleString('en-US', { 
      timeZone: this.userTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const [month, day, year] = userDate.split('/');
    return new Date(`${year}-${month}-${day}T00:00:00`);
  }

  /**
   * Get end of day for user's timezone
   */
  getEndOfDay(date = new Date()) {
    const d = new Date(date);
    const userDate = d.toLocaleString('en-US', { 
      timeZone: this.userTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const [month, day, year] = userDate.split('/');
    return new Date(`${year}-${month}-${day}T23:59:59.999`);
  }
}

// Create global instance
const timeService = new TimeService();

// Auto-initialize
if (typeof window !== 'undefined') {
  timeService.init();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TimeService, timeService };
}
