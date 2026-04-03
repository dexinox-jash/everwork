/**
 * Mock TimeService for Testing
 * Mirrors the functionality in shared/time-service.js
 */

class TimeService {
  constructor() {
    this.serverTimeOffset = 0;
    this.timeInitialized = false;
    this.userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  }

  async init() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch('https://timeapi.io/api/time/current/zone?timeZone=UTC', {
        signal: controller.signal,
        cache: 'no-store',
        headers: { Accept: 'application/json' }
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const serverTime = new Date(data.dateTime).getTime();
        const localTime = Date.now();
        const drift = localTime - serverTime;

        // Only apply offset if drift is significant (>60 seconds)
        if (Math.abs(drift) > 60000) {
          this.serverTimeOffset = drift;
        }
      }
    } catch (error) {
      // Silently fail - use local time
    }

    this.timeInitialized = true;
  }

  now() {
    return new Date(Date.now() - this.serverTimeOffset);
  }

  timestamp() {
    return Date.now() - this.serverTimeOffset;
  }

  toISOString() {
    return this.now().toISOString();
  }

  getTodayDate() {
    return this.now().toISOString().split('T')[0];
  }

  getDateString(date) {
    const d = date ? new Date(date) : this.now();
    return d.toISOString().split('T')[0];
  }

  getTimezoneInfo() {
    const now = this.now();
    return {
      timezone: this.userTimezone,
      offset: -now.getTimezoneOffset(),
      isDST: false
    };
  }

  formatTime(date) {
    const d = date ? new Date(date) : this.now();
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  }

  formatDate(date) {
    const d = date ? new Date(date) : this.now();
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }

  formatDuration(seconds) {
    if (!seconds || seconds < 0) seconds = 0;
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  getElapsedSeconds(startTime) {
    const start = typeof startTime === 'number' ? startTime : new Date(startTime).getTime();
    return Math.floor((this.timestamp() - start) / 1000);
  }

  isMidnightCrossing(start, end) {
    const startDate = new Date(start).toISOString().split('T')[0];
    const endDate = end 
      ? new Date(end).toISOString().split('T')[0] 
      : this.getTodayDate();
    return startDate !== endDate;
  }

  getMidnight(date) {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
  }

  isTimeManipulated() {
    return Math.abs(this.serverTimeOffset) > 60000;
  }

  getTimeWarning() {
    if (!this.isTimeManipulated()) return null;
    const minutes = Math.round(Math.abs(this.serverTimeOffset) / 60000);
    const direction = this.serverTimeOffset > 0 ? 'ahead' : 'behind';
    return `Your device clock appears to be ${minutes} minutes ${direction} server time.`;
  }

  async resync() {
    this.timeInitialized = false;
    await this.init();
  }
}

module.exports = { TimeService };
