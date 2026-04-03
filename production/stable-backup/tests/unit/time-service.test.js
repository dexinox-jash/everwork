/**
 * Whitebox Unit Tests - TimeService
 * Tests internal logic, edge cases, and state management
 */

const { TimeService } = require('../mocks/timeServiceMock.js');
const { mockTimeApiResponse } = require('../fixtures/mockData.js');

describe('TimeService - Whitebox Tests', () => {
  let timeService;

  beforeEach(() => {
    timeService = new TimeService();
    fetch.mockClear();
  });

  describe('Initialization', () => {
    test('should initialize with default values', () => {
      expect(timeService.serverTimeOffset).toBe(0);
      expect(timeService.timeInitialized).toBe(false);
      expect(timeService.userTimezone).toBeDefined();
    });

    test('should fetch accurate time from external API on init', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTimeApiResponse
      });

      await timeService.init();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('timeapi.io'),
        expect.objectContaining({
          signal: expect.any(AbortSignal),
          cache: 'no-store',
          headers: { Accept: 'application/json' }
        })
      );
      expect(timeService.timeInitialized).toBe(true);
    });

    test('should handle API failure gracefully', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      await timeService.init();

      expect(timeService.serverTimeOffset).toBe(0);
      expect(timeService.timeInitialized).toBe(true);
    });

    test('should apply offset only when clock drift > 60 seconds', async () => {
      // Mock API returning time 90 seconds ahead
      const futureDate = new Date(Date.now() + 90000);
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockTimeApiResponse,
          dateTime: futureDate.toISOString()
        })
      });

      await timeService.init();

      // Offset should be applied (significant drift)
      expect(Math.abs(timeService.serverTimeOffset)).toBeGreaterThan(60000);
    });

    test('should ignore offset when drift < 60 seconds', async () => {
      // Mock API returning time 30 seconds ahead
      const slightFuture = new Date(Date.now() + 30000);
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockTimeApiResponse,
          dateTime: slightFuture.toISOString()
        })
      });

      await timeService.init();

      // Offset should be ignored (negligible drift)
      expect(timeService.serverTimeOffset).toBe(0);
    });
  });

  describe('Time Methods', () => {
    beforeEach(async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTimeApiResponse
      });
      await timeService.init();
    });

    test('now() should return Date object', () => {
      const now = timeService.now();
      expect(now).toBeInstanceOf(Date);
    });

    test('timestamp() should return milliseconds', () => {
      const ts = timeService.timestamp();
      expect(typeof ts).toBe('number');
      expect(ts).toBeGreaterThan(1700000000000); // After 2023
    });

    test('toISOString() should return valid ISO string', () => {
      const iso = timeService.toISOString();
      expect(typeof iso).toBe('string');
      expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    test('getTodayDate() should return YYYY-MM-DD format', () => {
      const today = timeService.getTodayDate();
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('Timezone Handling', () => {
    test('should detect user timezone', () => {
      expect(timeService.userTimezone).toBeTruthy();
      expect(typeof timeService.userTimezone).toBe('string');
    });

    test('getTimezoneInfo() should return complete info', () => {
      const info = timeService.getTimezoneInfo();
      expect(info).toHaveProperty('timezone');
      expect(info).toHaveProperty('offset');
      expect(info).toHaveProperty('isDST');
      expect(typeof info.offset).toBe('number');
      expect(typeof info.isDST).toBe('boolean');
    });

    test('formatTime should use user timezone', () => {
      const testDate = new Date('2025-03-10T12:00:00Z');
      const formatted = timeService.formatTime(testDate);
      expect(typeof formatted).toBe('string');
      expect(formatted).toContain('M'); // AM/PM indicator
    });

    test('formatDate should use user timezone', () => {
      const testDate = new Date('2025-03-10T12:00:00Z');
      const formatted = timeService.formatDate(testDate);
      expect(typeof formatted).toBe('string');
      expect(formatted.length).toBeGreaterThan(0);
    });
  });

  describe('Duration Calculations', () => {
    test('formatDuration should format seconds to HH:MM:SS', () => {
      expect(timeService.formatDuration(3661)).toBe('01:01:01');
      expect(timeService.formatDuration(0)).toBe('00:00:00');
      expect(timeService.formatDuration(3600)).toBe('01:00:00');
      expect(timeService.formatDuration(59)).toBe('00:00:59');
    });

    test('getElapsedSeconds should calculate correctly', () => {
      const startTime = Date.now() - 5000; // 5 seconds ago
      const elapsed = timeService.getElapsedSeconds(startTime);
      expect(elapsed).toBeGreaterThanOrEqual(5);
      expect(elapsed).toBeLessThan(10);
    });

    test('getElapsedSeconds should handle Date objects', () => {
      const startTime = new Date(Date.now() - 10000); // 10 seconds ago
      const elapsed = timeService.getElapsedSeconds(startTime);
      expect(elapsed).toBeGreaterThanOrEqual(10);
    });
  });

  describe('Midnight Crossing Detection', () => {
    test('should detect midnight crossing correctly', () => {
      const startTime = '2025-03-09T23:00:00Z';
      const endTime = '2025-03-10T01:00:00Z';
      
      expect(timeService.isMidnightCrossing(startTime, endTime)).toBe(true);
    });

    test('should not detect crossing for same-day sessions', () => {
      const startTime = '2025-03-09T10:00:00Z';
      const endTime = '2025-03-09T12:00:00Z';
      
      expect(timeService.isMidnightCrossing(startTime, endTime)).toBe(false);
    });

    test('should handle ongoing sessions (no end time)', () => {
      const startTime = '2025-03-09T23:00:00Z';
      
      // Mock current time to be after midnight
      jest.spyOn(timeService, 'now').mockReturnValue(new Date('2025-03-10T01:00:00Z'));
      
      expect(timeService.isMidnightCrossing(startTime, null)).toBe(true);
    });

    test('getMidnight should return end of day', () => {
      const date = new Date('2025-03-09T15:00:00Z');
      const midnight = timeService.getMidnight(date);
      
      expect(midnight.getHours()).toBe(23);
      expect(midnight.getMinutes()).toBe(59);
      expect(midnight.getSeconds()).toBe(59);
    });
  });

  describe('Time Manipulation Detection', () => {
    test('should detect significant time manipulation', () => {
      timeService.serverTimeOffset = 120000; // 2 minutes difference
      expect(timeService.isTimeManipulated()).toBe(true);
    });

    test('should not flag small differences as manipulation', () => {
      timeService.serverTimeOffset = 30000; // 30 seconds difference
      expect(timeService.isTimeManipulated()).toBe(false);
    });

    test('getTimeWarning should return message when manipulated', () => {
      timeService.serverTimeOffset = 120000;
      const warning = timeService.getTimeWarning();
      expect(warning).toContain('2 minutes');
      // The direction depends on the sign of the offset
      expect(warning).toMatch(/ahead|behind/);
    });

    test('getTimeWarning should return null when not manipulated', () => {
      timeService.serverTimeOffset = 0;
      expect(timeService.getTimeWarning()).toBeNull();
    });
  });

  describe('Resync', () => {
    test('should resync with external time source', async () => {
      const newTime = new Date(Date.now() + 300000);
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockTimeApiResponse,
          dateTime: newTime.toISOString()
        })
      });

      await timeService.resync();

      expect(fetch).toHaveBeenCalled();
    });

    test('should handle resync failure gracefully', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      // Should not throw
      await expect(timeService.resync()).resolves.not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    test('should handle invalid date in formatTime', () => {
      const result = timeService.formatTime('invalid');
      expect(typeof result).toBe('string');
    });

    test('should handle negative elapsed seconds', () => {
      const futureTime = Date.now() + 10000;
      const elapsed = timeService.getElapsedSeconds(futureTime);
      expect(elapsed).toBeLessThan(0);
    });

    test('should handle very large duration values', () => {
      const largeDuration = 86400 * 2; // 2 days in seconds
      const formatted = timeService.formatDuration(largeDuration);
      expect(formatted).toBe('48:00:00');
    });
  });
});
