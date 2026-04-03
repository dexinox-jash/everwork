/**
 * Whitebox Unit Tests - Utility Functions
 * Tests formatters, calculations, and helper functions
 */

const {
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
} = require('../mocks/utilsMock.js');

describe('Utility Functions - Whitebox Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Time Formatters', () => {
    test('formatTime should format seconds to HH:MM:SS', () => {
      expect(formatTime(3661)).toBe('01:01:01');
      expect(formatTime(0)).toBe('00:00:00');
      expect(formatTime(3600)).toBe('01:00:00');
      expect(formatTime(59)).toBe('00:00:59');
    });

    test('formatDuration should format large durations', () => {
      expect(formatDuration(90061)).toBe('25:01:01'); // > 24 hours
    });
  });

  describe('Decimal Hours Formatter', () => {
    test('formatDecimalHours should convert seconds to decimal hours', () => {
      expect(formatDecimalHours(3600)).toBe('1.00');
      expect(formatDecimalHours(1800)).toBe('0.50');
      expect(formatDecimalHours(5400)).toBe('1.50');
      expect(formatDecimalHours(0)).toBe('0.00');
    });

    test('formatDecimalHours should handle edge cases', () => {
      expect(formatDecimalHours(3660)).toBe('1.02');
      expect(formatDecimalHours(1)).toBe('0.00');
    });
  });

  describe('Currency Formatter', () => {
    test('should format currency with default $', () => {
      expect(formatCurrency(15)).toBe('$15.00');
      expect(formatCurrency(15.5)).toBe('$15.50');
    });

    test('should format currency with custom symbol', () => {
      expect(formatCurrency(25, '€')).toBe('€25.00');
      expect(formatCurrency(100, '£')).toBe('£100.00');
    });

    test('should handle zero and negative values', () => {
      expect(formatCurrency(0)).toBe('$0.00');
      expect(formatCurrency(-10)).toBe('-$10.00');
    });
  });

  describe('Date Formatters', () => {
    test('formatDate should format to short readable', () => {
      const result = formatDate('2025-03-09');
      expect(typeof result).toBe('string');
      // Just check it's a valid date string, don't check exact day due to timezone
      expect(result.length).toBeGreaterThan(0);
    });

    test('formatDateFull should format to full readable', () => {
      const result = formatDateFull('2025-03-09');
      expect(typeof result).toBe('string');
      expect(result).toContain('2025'); // Year should be present
    });

    test('should handle invalid dates gracefully', () => {
      expect(formatDate('invalid')).toBe('Invalid Date');
      expect(formatDateFull(null)).toBe('Invalid Date');
    });
  });

  describe('Earnings Calculator', () => {
    test('should calculate earnings correctly', () => {
      expect(calculateEarnings(3600, 50)).toBe(50); // 1 hour at $50/hr
      expect(calculateEarnings(1800, 50)).toBe(25); // 0.5 hour at $50/hr
      expect(calculateEarnings(0, 50)).toBe(0);
    });

    test('should handle zero hourly rate', () => {
      expect(calculateEarnings(3600, 0)).toBe(0);
    });

    test('should round to 2 decimal places', () => {
      // 3661 seconds = 1.0169... hours
      const earnings = calculateEarnings(3661, 33);
      expect(earnings).toBeCloseTo(33.56, 2);
    });
  });

  describe('UUID Generator', () => {
    test('should generate valid v4 UUID format', () => {
      const uuid = generateUUID();
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    test('should generate unique UUIDs', () => {
      const uuid1 = generateUUID();
      const uuid2 = generateUUID();
      expect(uuid1).not.toBe(uuid2);
    });
  });

  describe('Debounce Function', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('should delay function execution', () => {
      const fn = jest.fn();
      const debouncedFn = debounce(fn, 1000);

      debouncedFn();
      expect(fn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1000);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    test('should reset timer on multiple calls', () => {
      const fn = jest.fn();
      const debouncedFn = debounce(fn, 1000);

      debouncedFn();
      jest.advanceTimersByTime(500);
      debouncedFn(); // Reset timer
      jest.advanceTimersByTime(500);
      expect(fn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(500);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    test('should pass correct arguments', () => {
      const fn = jest.fn();
      const debouncedFn = debounce(fn, 1000);

      debouncedFn('arg1', 'arg2');
      jest.advanceTimersByTime(1000);
      expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });

  describe('Throttle Function', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('should limit function execution rate', () => {
      const fn = jest.fn();
      const throttledFn = throttle(fn, 1000);

      throttledFn();
      throttledFn(); // Should be ignored
      throttledFn(); // Should be ignored

      expect(fn).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(1000);
      throttledFn();
      expect(fn).toHaveBeenCalledTimes(2);
    });

    test('should execute immediately on first call', () => {
      const fn = jest.fn();
      const throttledFn = throttle(fn, 1000);

      throttledFn();
      expect(fn).toHaveBeenCalledTimes(1);
    });

    test('should pass correct arguments', () => {
      const fn = jest.fn();
      const throttledFn = throttle(fn, 1000);

      throttledFn('arg1', 'arg2');
      expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });
});
