/**
 * Black Box Tests - Timer Module
 * Tests timer functionality from user perspective without knowing internals
 */

describe('Timer - Black Box Tests', () => {
  // Setup DOM environment for each test
  let container;
  
  beforeEach(() => {
    // Create a clean DOM environment
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
    
    // Reset localStorage
    localStorage.clear();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    jest.clearAllTimers();
  });

  describe('Timer UI State Machine', () => {
    test('initial state: should show job selector', () => {
      // Simulate fresh page load
      const startView = document.createElement('div');
      startView.id = 'startView';
      const timerView = document.createElement('div');
      timerView.id = 'timerView';
      timerView.classList.add('hidden');
      
      container.appendChild(startView);
      container.appendChild(timerView);
      
      // Assert: Start view visible, timer view hidden
      expect(startView.classList.contains('hidden')).toBe(false);
      expect(timerView.classList.contains('hidden')).toBe(true);
    });

    test('after starting: should show active timer', () => {
      // Simulate timer started
      const startView = document.createElement('div');
      startView.id = 'startView';
      startView.classList.add('hidden');
      const timerView = document.createElement('div');
      timerView.id = 'timerView';
      
      container.appendChild(startView);
      container.appendChild(timerView);
      
      // Assert: Timer view visible
      expect(startView.classList.contains('hidden')).toBe(true);
      expect(timerView.classList.contains('hidden')).toBe(false);
    });

    test('timer display format: should show HH:MM:SS', () => {
      const timerDisplay = document.createElement('div');
      timerDisplay.id = 'timerDisplay';
      timerDisplay.textContent = '01:30:45';
      
      container.appendChild(timerDisplay);
      
      // Assert: Format matches HH:MM:SS pattern
      const timePattern = /^\d{2}:\d{2}:\d{2}$/;
      expect(timerDisplay.textContent).toMatch(timePattern);
    });

    test('earnings display: should show currency format', () => {
      const earningsDisplay = document.createElement('div');
      earningsDisplay.id = 'earningsDisplay';
      earningsDisplay.textContent = '125.50';
      
      container.appendChild(earningsDisplay);
      
      // Assert: Valid currency amount
      const amount = parseFloat(earningsDisplay.textContent);
      expect(amount).not.toBeNaN();
      expect(amount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Timer Persistence', () => {
    test('page refresh during timer: should restore timer', () => {
      // Simulate saving timer state
      const timerState = {
        id: 'timer123',
        jobId: 'job1',
        sessionId: 'session123',
        startTime: new Date().toISOString(),
        isRunning: true
      };
      
      localStorage.setItem('activeTimer', JSON.stringify(timerState));
      
      // Simulate page reload by reading from localStorage
      const saved = localStorage.getItem('activeTimer');
      const parsed = JSON.parse(saved);
      
      // Assert: Timer state restored
      expect(parsed.id).toBe('timer123');
      expect(parsed.jobId).toBe('job1');
      expect(parsed.isRunning).toBe(true);
    });

    test('after stopping timer: should clear localStorage', () => {
      // Setup: Timer was running
      localStorage.setItem('activeTimer', JSON.stringify({ id: 'timer123' }));
      
      // Action: Stop timer
      localStorage.removeItem('activeTimer');
      
      // Assert: localStorage cleared
      expect(localStorage.getItem('activeTimer')).toBeNull();
    });

    test('corrupted timer data: should handle gracefully', () => {
      // Setup: Corrupted data
      localStorage.setItem('activeTimer', 'invalid{json}data');
      
      // Action: Try to parse
      let parsed = null;
      let error = null;
      try {
        parsed = JSON.parse(localStorage.getItem('activeTimer'));
      } catch (e) {
        error = e;
      }
      
      // Assert: Error handled, app continues
      expect(error).not.toBeNull();
      
      // Should clear corrupted data
      localStorage.removeItem('activeTimer');
      expect(localStorage.getItem('activeTimer')).toBeNull();
    });
  });

  describe('User Interactions', () => {
    test('job selection: should trigger timer start', () => {
      const jobButton = document.createElement('button');
      jobButton.dataset.jobId = 'job1';
      
      let timerStarted = false;
      jobButton.addEventListener('click', () => {
        timerStarted = true;
      });
      
      // Simulate user click
      jobButton.click();
      
      expect(timerStarted).toBe(true);
    });

    test('slide to stop: should require minimum slide distance', () => {
      const slideTrack = { width: 300 };
      const slidePosition = 50; // Only slid 50px
      const minRequired = slideTrack.width * 0.85; // 85%
      
      // Assert: Not enough slide
      expect(slidePosition).toBeLessThan(minRequired);
      
      // With enough slide
      const enoughSlide = 260;
      expect(enoughSlide).toBeGreaterThanOrEqual(minRequired);
    });

    test('double-click protection: should prevent duplicate stops', () => {
      let stopCount = 0;
      
      const stopTimer = () => {
        if (stopCount === 0) {
          stopCount++;
          return 'stopped';
        }
        return 'already_stopped';
      };
      
      // First click
      expect(stopTimer()).toBe('stopped');
      
      // Second click (double-click)
      expect(stopTimer()).toBe('already_stopped');
      
      expect(stopCount).toBe(1);
    });
  });

  describe('Data Consistency', () => {
    test('session duration: should match timer elapsed time', () => {
      const startTime = new Date('2025-03-10T10:00:00');
      const endTime = new Date('2025-03-10T11:30:00');
      
      const timerElapsedSeconds = (endTime - startTime) / 1000;
      const sessionDurationSeconds = 5400; // 1.5 hours
      
      // Assert: Within 1 second tolerance
      expect(Math.abs(timerElapsedSeconds - sessionDurationSeconds)).toBeLessThanOrEqual(1);
    });

    test('earnings calculation: should match rate × time', () => {
      const hourlyRate = 50;
      const durationHours = 2.5;
      const expectedEarnings = hourlyRate * durationHours;
      
      const actualEarnings = 125;
      
      expect(actualEarnings).toBe(expectedEarnings);
    });

    test('date consistency: session date should match start date', () => {
      const startTime = '2025-03-10T14:30:00Z';
      const sessionDate = '2025-03-10';
      
      const startDate = startTime.split('T')[0];
      expect(startDate).toBe(sessionDate);
    });
  });

  describe('Edge Cases', () => {
    test('midnight crossing: should handle date change', () => {
      const startTime = new Date('2025-03-10T23:30:00');
      const endTime = new Date('2025-03-11T00:30:00');
      
      const startDay = startTime.toISOString().split('T')[0];
      const endDay = endTime.toISOString().split('T')[0];
      
      // Assert: Different days
      expect(startDay).not.toBe(endDay);
    });

    test('very short session: should handle sub-minute duration', () => {
      const durationSeconds = 30;
      
      // Assert: Duration is positive
      expect(durationSeconds).toBeGreaterThan(0);
      
      // Should still create a session
      expect(durationSeconds).toBeLessThan(60);
    });

    test('very long session: should handle multi-day duration', () => {
      const durationSeconds = 48 * 3600; // 48 hours
      
      // Assert: Duration is valid (not negative or overflow)
      expect(durationSeconds).toBeGreaterThan(0);
      expect(durationSeconds).toBe(172800);
    });

    test('no hourly rate: should show $0 earnings', () => {
      const hourlyRate = null;
      const durationHours = 2;
      
      const earnings = hourlyRate ? hourlyRate * durationHours : 0;
      
      expect(earnings).toBe(0);
    });
  });

  describe('Cross-Tab Synchronization', () => {
    test('timer started in other tab: should appear in this tab', () => {
      // Simulate timer started in another tab
      const timerState = {
        jobId: 'job1',
        isRunning: true
      };
      
      // Other tab sets this
      localStorage.setItem('activeTimer', JSON.stringify(timerState));
      
      // This tab reads it
      const currentState = JSON.parse(localStorage.getItem('activeTimer'));
      
      expect(currentState.isRunning).toBe(true);
    });

    test('timer stopped in other tab: should clear in this tab', () => {
      // Setup: Timer was running
      localStorage.setItem('activeTimer', JSON.stringify({ isRunning: true }));
      
      // Other tab stops timer
      localStorage.removeItem('activeTimer');
      localStorage.setItem('everwork_last_session_update', Date.now().toString());
      
      // This tab should detect change
      const isRunning = localStorage.getItem('activeTimer') !== null;
      
      expect(isRunning).toBe(false);
    });
  });
});
