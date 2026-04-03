# Ever Work - Comprehensive Test Plan

## Overview

This document outlines the complete testing strategy for the Ever Work time tracking application, covering both **Blackbox** (functional/end-user) and **Whitebox** (structural/code-level) testing approaches.

---

## Test Categories

### 1. Whitebox Testing (Code-Level)

#### Unit Tests
- **TimeService** - Time calculations, timezone handling, drift detection
- **FirebaseService** - Auth, CRUD operations, offline sync
- **DatabaseService** - Data persistence, querying
- **Utility Functions** - Formatters, validators, helpers

#### Integration Tests
- Service interactions (TimeService + FirebaseService)
- Auth flow (login → data fetch → operations)
- Offline/online transitions
- Data synchronization

#### Code Quality Checks
- Static analysis (ESLint)
- Type checking (if using TypeScript)
- Code coverage reporting

### 2. Blackbox Testing (Functional/E2E)

#### Authentication Flows
- Email/password login
- Google OAuth sign-in
- Guest mode
- Sign out
- Password reset

#### Timer Functionality
- Start timer
- Stop timer (slide to stop)
- Cancel timer
- Background timer persistence
- Midnight crossing detection

#### Job Management
- Create job
- Edit job
- Delete job
- Archive job
- Swipe gestures

#### Session Management
- View sessions
- Edit session
- Delete session
- Add manual session

#### Statistics & Analytics
- Weekly summary
- Monthly heatmap navigation
- Personal records
- Earnings projection

#### Settings
- Update daily goal
- Change currency
- Export data
- Import data
- Clear all data

---

## Test Environments

1. **Local Development** - Jest + JSDOM for unit/integration
2. **Browser Testing** - Playwright for E2E
3. **CI/CD** - Automated test runs on PR/push

---

## Testing Tools

| Category | Tool | Purpose |
|----------|------|---------|
| Unit Testing | Jest | JavaScript unit tests |
| E2E Testing | Playwright | Browser automation |
| Mocking | Jest Mocks | Firebase/mock services |
| Coverage | Jest + Istanbul | Code coverage |
| Assertions | Jest Expect | Test assertions |

---

## Critical Paths (Priority Testing)

1. **Timer Accuracy** - Time must never be lost or incorrect
2. **Data Persistence** - Sessions must survive app crashes
3. **Auth State** - Users must not be incorrectly logged out
4. **Offline Support** - App must work without network
5. **Midnight Crossing** - Sessions crossing midnight must split correctly

---

## Known Issues to Test

Based on codebase analysis:

1. **Timer auto-starting** - "Unknown Job" timer appearing
2. **Calendar navigation** - Month/year buttons not working
3. **Mobile touch targets** - Buttons too small on mobile
4. **Auth race conditions** - Pages loading before auth ready
5. **Stale localStorage** - Old timer data causing issues

---

## Test Data

### Mock Jobs
```javascript
const mockJobs = [
  { id: 'job1', name: 'Coffee Shop', color: '#FF9A56', hourlyRate: 15 },
  { id: 'job2', name: 'Freelance Design', color: '#4ADE80', hourlyRate: 50 },
  { id: 'job3', name: 'Tutoring', color: '#60A5FA', hourlyRate: 25 }
];
```

### Mock Sessions
```javascript
const mockSessions = [
  { id: 'sess1', jobId: 'job1', duration: 3600, date: '2025-03-09' },
  { id: 'sess2', jobId: 'job2', duration: 7200, date: '2025-03-09' }
];
```

---

## Success Criteria

- **Unit Test Coverage**: >80%
- **E2E Critical Paths**: 100% passing
- **No Critical Bugs**: P0/P1 issues
- **Performance**: <2s initial load, <100ms interactions
- **Accessibility**: WCAG 2.1 AA compliance

---

## Run Commands

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run E2E tests
npm run test:e2e

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- time-service.test.js
```
