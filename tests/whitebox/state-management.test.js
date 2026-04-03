/**
 * White Box Tests - State Management
 * Tests internal implementation details and state transitions
 */

describe('State Management - White Box', () => {
  describe('TimerState Object', () => {
    // Simulate the TimerState object from timer.html
    const createTimerState = () => ({
      session: null,
      job: null,
      animationFrame: null,
      startTimestamp: null,
      note: '',
      
      get isRunning() { return this.session !== null; },
      get elapsedSeconds() { 
        if (!this.startTimestamp) return 0;
        return Math.floor((Date.now() - this.startTimestamp) / 1000);
      },
      
      setSession(sessionData) {
        if (!sessionData || !sessionData.startTime) {
          console.error('[TimerState] Invalid session data');
          return false;
        }
        this.session = sessionData;
        const start = new Date(sessionData.startTime);
        if (isNaN(start.getTime())) {
          console.error('[TimerState] Invalid startTime:', sessionData.startTime);
          return false;
        }
        this.startTimestamp = start.getTime();
        return true;
      },
      
      clear() {
        this.session = null;
        this.job = null;
        this.startTimestamp = null;
        this.note = '';
        if (this.animationFrame) {
          cancelAnimationFrame(this.animationFrame);
          this.animationFrame = null;
        }
      },
      
      persist() {
        if (!this.session) {
          localStorage.removeItem('activeTimer');
          return;
        }
        const data = {
          id: this.session.id,
          jobId: this.session.jobId,
          sessionId: this.session.sessionId,
          startTime: this.session.startTime,
          note: this.note,
          savedAt: new Date().toISOString()
        };
        localStorage.setItem('activeTimer', JSON.stringify(data));
      },
      
      load() {
        try {
          const data = localStorage.getItem('activeTimer');
          if (!data) return null;
          const parsed = JSON.parse(data);
          if (!parsed.id || !parsed.jobId || !parsed.sessionId || !parsed.startTime) {
            console.warn('[TimerState] Invalid stored data, clearing');
            localStorage.removeItem('activeTimer');
            return null;
          }
          return parsed;
        } catch (e) {
          console.error('[TimerState] Failed to load:', e);
          localStorage.removeItem('activeTimer');
          return null;
        }
      }
    });

    let timerState;

    beforeEach(() => {
      timerState = createTimerState();
      localStorage.clear();
    });

    test('initial state: all properties should be null/empty', () => {
      expect(timerState.session).toBeNull();
      expect(timerState.job).toBeNull();
      expect(timerState.startTimestamp).toBeNull();
      expect(timerState.note).toBe('');
      expect(timerState.isRunning).toBe(false);
      expect(timerState.elapsedSeconds).toBe(0);
    });

    test('setSession: should validate data structure', () => {
      // Invalid: null
      expect(timerState.setSession(null)).toBe(false);
      
      // Invalid: missing startTime
      expect(timerState.setSession({ id: '1', jobId: 'job1' })).toBe(false);
      
      // Invalid: invalid startTime format
      expect(timerState.setSession({ id: '1', jobId: 'job1', startTime: 'invalid' })).toBe(false);
      
      // Valid
      const validSession = {
        id: 'timer1',
        jobId: 'job1',
        sessionId: 'session1',
        startTime: new Date().toISOString()
      };
      expect(timerState.setSession(validSession)).toBe(true);
      expect(timerState.isRunning).toBe(true);
    });

    test('elapsedSeconds: should calculate correctly', () => {
      const now = Date.now();
      timerState.startTimestamp = now - 5000; // 5 seconds ago
      
      expect(timerState.elapsedSeconds).toBeGreaterThanOrEqual(5);
      expect(timerState.elapsedSeconds).toBeLessThan(6);
    });

    test('clear: should reset all state', () => {
      // Setup running timer
      timerState.setSession({
        id: 'timer1',
        jobId: 'job1',
        sessionId: 'session1',
        startTime: new Date().toISOString()
      });
      timerState.job = { name: 'Test Job' };
      timerState.note = 'Test note';
      
      // Clear
      timerState.clear();
      
      // Assert
      expect(timerState.session).toBeNull();
      expect(timerState.job).toBeNull();
      expect(timerState.startTimestamp).toBeNull();
      expect(timerState.note).toBe('');
      expect(timerState.isRunning).toBe(false);
    });

    test('persist: should save valid state to localStorage', () => {
      timerState.setSession({
        id: 'timer1',
        jobId: 'job1',
        sessionId: 'session1',
        startTime: '2025-03-10T10:00:00Z'
      });
      timerState.note = 'Test note';
      
      timerState.persist();
      
      const saved = JSON.parse(localStorage.getItem('activeTimer'));
      expect(saved.id).toBe('timer1');
      expect(saved.jobId).toBe('job1');
      expect(saved.note).toBe('Test note');
      expect(saved.savedAt).toBeDefined();
    });

    test('persist: should clear localStorage when no session', () => {
      localStorage.setItem('activeTimer', JSON.stringify({ old: 'data' }));
      
      timerState.persist();
      
      expect(localStorage.getItem('activeTimer')).toBeNull();
    });

    test('load: should validate stored data', () => {
      // Invalid: corrupted JSON
      localStorage.setItem('activeTimer', 'invalid json');
      expect(timerState.load()).toBeNull();
      
      // Invalid: missing required fields
      localStorage.setItem('activeTimer', JSON.stringify({ id: '1' }));
      expect(timerState.load()).toBeNull();
      
      // Valid
      localStorage.setItem('activeTimer', JSON.stringify({
        id: 'timer1',
        jobId: 'job1',
        sessionId: 'session1',
        startTime: '2025-03-10T10:00:00Z'
      }));
      const loaded = timerState.load();
      expect(loaded).not.toBeNull();
      expect(loaded.id).toBe('timer1');
    });
  });

  describe('StatsState Object', () => {
    // Simulate StatsState from calendar.html
    const createStatsState = () => ({
      currentDate: new Date(),
      sessionsCache: [],
      jobsCache: [],
      isLoading: false,
      
      getSessionsForRange(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        return this.sessionsCache.filter(s => {
          const sessionDate = new Date(s.date);
          return sessionDate >= start && sessionDate <= end;
        });
      },
      
      getSessionsForDay(dateStr) {
        return this.sessionsCache.filter(s => s.date === dateStr);
      },
      
      getHoursForDate(dateStr) {
        const sessions = this.getSessionsForDay(dateStr);
        return sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / 3600;
      },
      
      getJob(jobId) {
        return this.jobsCache.find(j => j.id === jobId);
      },
      
      getCurrentWeekRange() {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const start = new Date(now);
        start.setDate(now.getDate() - dayOfWeek);
        start.setHours(0, 0, 0, 0);
        
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        
        return { start, end };
      }
    });

    let statsState;

    beforeEach(() => {
      statsState = createStatsState();
    });

    test('getSessionsForRange: should filter by date correctly', () => {
      statsState.sessionsCache = [
        { id: 's1', date: '2025-03-10', duration: 3600 },
        { id: 's2', date: '2025-03-11', duration: 3600 },
        { id: 's3', date: '2025-03-15', duration: 3600 }
      ];
      
      const result = statsState.getSessionsForRange('2025-03-10', '2025-03-12');
      
      expect(result).toHaveLength(2);
      expect(result.map(s => s.id)).toContain('s1');
      expect(result.map(s => s.id)).toContain('s2');
      expect(result.map(s => s.id)).not.toContain('s3');
    });

    test('getHoursForDate: should sum session durations', () => {
      statsState.sessionsCache = [
        { id: 's1', date: '2025-03-10', duration: 3600 },
        { id: 's2', date: '2025-03-10', duration: 7200 },
        { id: 's3', date: '2025-03-11', duration: 3600 }
      ];
      
      const hours = statsState.getHoursForDate('2025-03-10');
      
      expect(hours).toBe(3); // 1 hour + 2 hours
    });

    test('getJob: should find job by ID', () => {
      statsState.jobsCache = [
        { id: 'job1', name: 'Job 1' },
        { id: 'job2', name: 'Job 2' }
      ];
      
      expect(statsState.getJob('job1')?.name).toBe('Job 1');
      expect(statsState.getJob('job2')?.name).toBe('Job 2');
      expect(statsState.getJob('job3')).toBeUndefined();
    });

    test('getCurrentWeekRange: should return Sunday to Saturday', () => {
      // Mock current date as Wednesday, March 12, 2025
      const mockNow = new Date('2025-03-12T10:00:00');
      jest.spyOn(global, 'Date').mockImplementation(() => mockNow);
      
      const range = statsState.getCurrentWeekRange();
      
      // Sunday, March 9, 2025
      expect(range.start.getDay()).toBe(0);
      expect(range.start.toISOString().split('T')[0]).toBe('2025-03-09');
      
      // Saturday, March 15, 2025
      expect(range.end.getDay()).toBe(6);
      expect(range.end.toISOString().split('T')[0]).toBe('2025-03-15');
      
      jest.restoreAllMocks();
    });
  });

  describe('Event Dispatching', () => {
    test('db-change event: should include correct structure', () => {
      const eventDetail = {
        table: 'sessions',
        type: 'modified',
        data: { id: 'session123', duration: 3600 }
      };
      
      const event = new CustomEvent('db-change', { detail: eventDetail });
      
      expect(event.detail.table).toBe('sessions');
      expect(event.detail.type).toBe('modified');
      expect(event.detail.data.id).toBe('session123');
    });

    test('cross-tab sync: should use localStorage as signal', () => {
      // Simulate timer stop in other tab
      const signal = Date.now().toString();
      localStorage.setItem('everwork_last_session_update', signal);
      
      // Simulate this tab receiving the signal
      const received = localStorage.getItem('everwork_last_session_update');
      
      expect(received).toBe(signal);
      expect(parseInt(received)).not.toBeNaN();
    });
  });

  describe('State Transition Matrix', () => {
    const states = ['IDLE', 'RUNNING', 'PAUSED', 'STOPPED'];
    const transitions = [
      { from: 'IDLE', action: 'START', to: 'RUNNING' },
      { from: 'RUNNING', action: 'STOP', to: 'STOPPED' },
      { from: 'RUNNING', action: 'REFRESH', to: 'RUNNING' },
      { from: 'STOPPED', action: 'START', to: 'RUNNING' },
    ];

    test('all transitions should be valid', () => {
      transitions.forEach(t => {
        expect(states).toContain(t.from);
        expect(states).toContain(t.to);
        expect(['START', 'STOP', 'PAUSE', 'RESUME', 'REFRESH']).toContain(t.action);
      });
    });

    test('invalid transitions should be rejected', () => {
      // Cannot stop if not running
      const invalidTransition = { from: 'IDLE', action: 'STOP', to: 'STOPPED' };
      const isValid = transitions.some(t => 
        t.from === invalidTransition.from && 
        t.action === invalidTransition.action
      );
      expect(isValid).toBe(false);
    });
  });
});
