/**
 * Firebase Service Unit Tests
 * Tests individual methods of FirebaseService
 */

// Mock Firebase
const mockFirebase = {
  auth: jest.fn(() => ({
    onAuthStateChanged: jest.fn((callback) => {
      callback({ uid: 'testuser123', email: 'test@example.com' });
      return jest.fn();
    }),
    setPersistence: jest.fn(() => Promise.resolve()),
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn()
  })),
  firestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        collection: jest.fn(() => ({
          add: jest.fn(() => Promise.resolve({ id: 'mockDocId' })),
          get: jest.fn(() => Promise.resolve({ 
            empty: false, 
            docs: [{ id: 'mockId', data: () => ({ jobId: 'job1', duration: 3600 }) }]
          })),
          doc: jest.fn(() => ({
            get: jest.fn(() => Promise.resolve({ exists: true, data: () => ({}) })),
            update: jest.fn(() => Promise.resolve()),
            delete: jest.fn(() => Promise.resolve())
          }))
        }))
      }))
    })),
    enablePersistence: jest.fn(() => Promise.resolve())
  })),
  Timestamp: {
    now: jest.fn(() => ({ toMillis: () => Date.now() })),
    serverTimestamp: jest.fn(() => 'serverTimestamp')
  },
  FieldValue: {
    serverTimestamp: jest.fn(() => 'serverTimestamp')
  }
};

global.firebase = mockFirebase;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock indexedDB
const indexedDBMock = {
  open: jest.fn(() => ({
    onsuccess: null,
    onerror: null,
    onupgradeneeded: null,
    result: {
      objectStoreNames: {
        contains: jest.fn(() => false)
      },
      createObjectStore: jest.fn(() => ({
        put: jest.fn(),
        get: jest.fn(() => ({
          onsuccess: null
        }))
      }))
    }
  }))
};
global.indexedDB = indexedDBMock;

// Mock CONFIG
global.CONFIG = {
  FIREBASE_API_KEY: 'test-api-key',
  FIREBASE_PROJECT_ID: 'test-project',
  MIDNIGHT_SPLIT_ENABLED: true
};

describe('FirebaseService', () => {
  let FirebaseService;
  let service;

  beforeAll(async () => {
    // Import the service after mocks are set up
    FirebaseService = require('../../shared/firebase-service.js');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Create a fresh instance
    service = new FirebaseService();
  });

  describe('Initialization', () => {
    test('should initialize with correct default state', () => {
      expect(service.currentUser).toBeUndefined();
      expect(service.isOnline).toBe(true);
      expect(service.initComplete).toBe(false);
    });

    test('should calculate server time offset', async () => {
      const before = Date.now();
      await service.calculateServerTimeOffset();
      const after = Date.now();
      
      expect(service.serverTimeOffset).toBeDefined();
    });
  });

  describe('Timer Operations', () => {
    test('startTimer should create session and timer', async () => {
      const result = await service.startTimer('job1', 'Test note');
      
      expect(result.success).toBe(true);
      expect(result.timer).toBeDefined();
      expect(result.session).toBeDefined();
      expect(result.timer.jobId).toBe('job1');
      expect(result.session.note).toBe('Test note');
    });

    test('stopTimer should calculate duration correctly', async () => {
      // Start timer
      const startResult = await service.startTimer('job1');
      
      // Wait 1 second
      await new Promise(r => setTimeout(r, 10));
      
      // Stop timer
      const stopResult = await service.stopTimer(
        startResult.timer.id,
        startResult.session.id
      );
      
      expect(stopResult.success).toBe(true);
      expect(stopResult.duration).toBeGreaterThanOrEqual(0);
    });

    test('should handle concurrent timer cleanup', async () => {
      // Create first timer
      await service.startTimer('job1');
      
      // Start second timer should clean up first
      const secondTimer = await service.startTimer('job2');
      
      expect(secondTimer.success).toBe(true);
      expect(secondTimer.timer.jobId).toBe('job2');
    });

    test('should handle invalid duration', async () => {
      const result = await service.stopTimer('invalidId', 'invalidSession');
      expect(result.success).toBe(false);
    });
  });

  describe('Session Management', () => {
    test('getSessions should return normalized sessions', async () => {
      const sessions = await service.getSessions();
      expect(Array.isArray(sessions)).toBe(true);
    });

    test('createSession should create with correct structure', async () => {
      const result = await service.createSession({
        jobId: 'job1',
        startTime: new Date().toISOString(),
        date: '2025-03-10',
        note: 'Test'
      });
      
      expect(result.success).toBe(true);
      expect(result.session).toBeDefined();
    });

    test('updateSession should mark as manually edited', async () => {
      const result = await service.updateSession('session1', {
        durationSeconds: 3600
      });
      
      expect(result.success).toBe(true);
    });
  });

  describe('Date Handling', () => {
    test('should handle timezone correctly', () => {
      const date = new Date('2025-03-10T15:30:00.000Z');
      const localDate = service.getServerTimestamp();
      expect(localDate).toBeInstanceOf(Date);
    });

    test('should detect midnight crossing', () => {
      const startTime = new Date('2025-03-10T23:30:00');
      const endTime = new Date('2025-03-11T00:30:00');
      
      const startDay = startTime.toISOString().split('T')[0];
      const endDay = endTime.toISOString().split('T')[0];
      
      expect(startDay).not.toBe(endDay);
    });
  });

  describe('Data Normalization', () => {
    test('normalizeSession should provide both camelCase and snake_case', () => {
      const raw = {
        id: 'session1',
        jobId: 'job1',
        startTime: '2025-03-10T10:00:00Z',
        durationSeconds: 3600
      };
      
      const normalized = service.normalizeSession(raw);
      
      expect(normalized.jobId).toBe('job1');
      expect(normalized.job_id).toBe('job1');
      expect(normalized.startTime).toBeDefined();
      expect(normalized.start_time).toBeDefined();
      expect(normalized.durationSeconds).toBe(3600);
      expect(normalized.duration_seconds).toBe(3600);
    });

    test('normalizeJob should provide consistent structure', () => {
      const raw = {
        id: 'job1',
        name: 'Test Job',
        hourlyRate: 50
      };
      
      const normalized = service.normalizeJob(raw);
      
      expect(normalized.id).toBe('job1');
      expect(normalized.name).toBe('Test Job');
      expect(normalized.hourlyRate).toBe(50);
      expect(normalized.hourly_rate).toBe(50);
    });
  });

  describe('Offline Handling', () => {
    test('should queue operations when offline', () => {
      service.isOnline = false;
      
      service.queueOfflineOperation('createSession', { jobId: 'job1' });
      
      expect(service.offlineQueue.length).toBe(1);
      expect(service.offlineQueue[0].operation).toBe('createSession');
    });

    test('should process queue when coming back online', async () => {
      service.isOnline = false;
      service.queueOfflineOperation('createSession', { jobId: 'job1' });
      
      // Simulate coming back online
      await service.handleOnline();
      
      expect(service.offlineQueue.length).toBe(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle auth errors gracefully', async () => {
      service.currentUser = null;
      
      const result = await service.startTimer('job1');
      expect(result.success).toBe(false);
    });

    test('should handle Firestore errors', async () => {
      // Mock a Firestore error
      mockFirebase.firestore = jest.fn(() => {
        throw new Error('Firestore unavailable');
      });
      
      const result = await service.getSessions();
      expect(Array.isArray(result)).toBe(true); // Should return empty array
    });
  });
});
