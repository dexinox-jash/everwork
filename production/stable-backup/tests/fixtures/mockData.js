/**
 * Test Fixtures - Mock Data for Ever Work Tests
 * CommonJS format for Jest compatibility
 */

// Mock Jobs
const mockJobs = [
  {
    id: 'job1',
    name: 'Coffee Shop',
    color: 'linear-gradient(135deg, #FF9A56 0%, #FF6B6B 100%)',
    icon: 'coffee',
    hourlyRate: 15,
    hourly_rate: 15, // snake_case for compatibility
    totalHoursAccumulated: 45.5,
    total_hours_accumulated: 45.5,
    isArchived: false,
    is_archived: false,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  },
  {
    id: 'job2',
    name: 'Freelance Design',
    color: 'linear-gradient(135deg, #4ADE80 0%, #38F9D7 100%)',
    icon: 'palette',
    hourlyRate: 50,
    hourly_rate: 50,
    totalHoursAccumulated: 120.25,
    total_hours_accumulated: 120.25,
    isArchived: false,
    is_archived: false,
    createdAt: new Date('2025-01-15'),
    updatedAt: new Date('2025-01-15')
  },
  {
    id: 'job3',
    name: 'Tutoring',
    color: 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)',
    icon: 'book-open',
    hourlyRate: 25,
    hourly_rate: 25,
    totalHoursAccumulated: 30,
    total_hours_accumulated: 30,
    isArchived: false,
    is_archived: false,
    createdAt: new Date('2025-02-01'),
    updatedAt: new Date('2025-02-01')
  },
  {
    id: 'job4',
    name: 'Old Job (Archived)',
    color: 'linear-gradient(135deg, #9CA3AF 0%, #6B7280 100%)',
    icon: 'briefcase',
    hourlyRate: null,
    hourly_rate: null,
    totalHoursAccumulated: 10,
    total_hours_accumulated: 10,
    isArchived: true,
    is_archived: true,
    createdAt: new Date('2024-12-01'),
    updatedAt: new Date('2024-12-01')
  }
];

// Mock Sessions
const mockSessions = [
  {
    id: 'sess1',
    jobId: 'job1',
    job_id: 'job1',
    startTime: '2025-03-09T08:00:00.000Z',
    start_time: '2025-03-09T08:00:00.000Z',
    endTime: '2025-03-09T09:00:00.000Z',
    end_time: '2025-03-09T09:00:00.000Z',
    duration: 3600,
    durationSeconds: 3600,
    duration_seconds: 3600,
    date: '2025-03-09',
    note: 'Morning shift',
    earnings: 15,
    isManuallyEdited: false,
    is_manually_edited: false,
    createdAt: new Date('2025-03-09')
  },
  {
    id: 'sess2',
    jobId: 'job2',
    job_id: 'job2',
    startTime: '2025-03-09T10:00:00.000Z',
    start_time: '2025-03-09T10:00:00.000Z',
    endTime: '2025-03-09T12:00:00.000Z',
    end_time: '2025-03-09T12:00:00.000Z',
    duration: 7200,
    durationSeconds: 7200,
    duration_seconds: 7200,
    date: '2025-03-09',
    note: 'Logo design project',
    earnings: 100,
    isManuallyEdited: false,
    is_manually_edited: false,
    createdAt: new Date('2025-03-09')
  },
  {
    id: 'sess3',
    jobId: 'job3',
    job_id: 'job3',
    startTime: '2025-03-08T14:00:00.000Z',
    start_time: '2025-03-08T14:00:00.000Z',
    endTime: '2025-03-08T15:30:00.000Z',
    end_time: '2025-03-08T15:30:00.000Z',
    duration: 5400,
    durationSeconds: 5400,
    duration_seconds: 5400,
    date: '2025-03-08',
    note: 'Math tutoring',
    earnings: 37.50,
    isManuallyEdited: true,
    is_manually_edited: true,
    createdAt: new Date('2025-03-08'),
    editedAt: new Date('2025-03-08')
  },
  {
    id: 'sess4',
    jobId: 'job1',
    job_id: 'job1',
    startTime: '2025-03-07T23:30:00.000Z',
    start_time: '2025-03-07T23:30:00.000Z',
    endTime: '2025-03-08T00:30:00.000Z',
    end_time: '2025-03-08T00:30:00.000Z',
    duration: 3600,
    durationSeconds: 3600,
    duration_seconds: 3600,
    date: '2025-03-07',
    note: 'Late night shift crossing midnight',
    earnings: 15,
    isManuallyEdited: false,
    is_manually_edited: false,
    createdAt: new Date('2025-03-07')
  },
  {
    id: 'sess5',
    jobId: 'job1',
    job_id: 'job1',
    startTime: '2025-03-10T08:00:00.000Z',
    start_time: '2025-03-10T08:00:00.000Z',
    endTime: null,
    end_time: null,
    duration: 0,
    durationSeconds: 0,
    duration_seconds: 0,
    date: '2025-03-10',
    note: 'Current session',
    earnings: 0,
    isManuallyEdited: false,
    is_manually_edited: false,
    createdAt: new Date('2025-03-10')
  }
];

// Mock User Profile
const mockProfile = {
  userId: 'user123',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: null,
  dailyGoalHours: 8,
  daily_goal_hours: 8,
  currency: '$',
  timezone: 'America/New_York',
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01')
};

// Mock Active Timer
const mockActiveTimer = {
  id: 'timer1',
  jobId: 'job1',
  job_id: 'job1',
  sessionId: 'sess5',
  serverStartTime: '2025-03-10T08:00:00.000Z',
  server_start_time: '2025-03-10T08:00:00.000Z',
  clientStartTime: '2025-03-10T08:00:00.000Z',
  client_start_time: '2025-03-10T08:00:00.000Z',
  note: 'Current session',
  isRunning: true,
  is_running: true,
  createdAt: new Date('2025-03-10')
};

// Mock Time API Response
const mockTimeApiResponse = {
  year: 2025,
  month: 3,
  day: 10,
  hour: 12,
  minute: 0,
  seconds: 0,
  dateTime: '2025-03-10T12:00:00.0000000'
};

// Mock Settings
const mockSettings = {
  dailyGoal: 8,
  currency: '$',
  notifications: true,
  darkMode: true
};

// Edge Cases Data
const edgeCaseSessions = [
  // Session exactly at midnight
  {
    id: 'midnight_sess',
    jobId: 'job1',
    startTime: '2025-03-09T23:59:59.000Z',
    endTime: '2025-03-10T00:00:01.000Z',
    duration: 2,
    date: '2025-03-09'
  },
  // Very long session (12 hours)
  {
    id: 'long_sess',
    jobId: 'job2',
    startTime: '2025-03-09T08:00:00.000Z',
    endTime: '2025-03-09T20:00:00.000Z',
    duration: 43200,
    date: '2025-03-09'
  },
  // Session with no earnings (null rate)
  {
    id: 'no_earnings_sess',
    jobId: 'job4',
    startTime: '2025-03-09T10:00:00.000Z',
    endTime: '2025-03-09T11:00:00.000Z',
    duration: 3600,
    date: '2025-03-09'
  },
  // Session with special characters in note
  {
    id: 'special_chars_sess',
    jobId: 'job1',
    startTime: '2025-03-09T09:00:00.000Z',
    endTime: '2025-03-09T10:00:00.000Z',
    duration: 3600,
    date: '2025-03-09',
    note: 'Special chars: <script>alert("xss")</script> & "quotes"'
  }
];

// Helper to create a date string in YYYY-MM-DD format
const getDateString = (date) => {
  return date.toISOString().split('T')[0];
};

// Helper to create a date with offset
const createDateWithOffset = (baseDate, offsetHours) => {
  const date = new Date(baseDate);
  date.setHours(date.getHours() + offsetHours);
  return date;
};

module.exports = {
  mockJobs,
  mockSessions,
  mockProfile,
  mockActiveTimer,
  mockTimeApiResponse,
  mockSettings,
  edgeCaseSessions,
  getDateString,
  createDateWithOffset
};
