// Jest Setup File
// This runs before each test file

// Mock fetch for time service tests
global.fetch = jest.fn();

// Spy on localStorage methods
// Note: In jsdom environment, localStorage exists but we need to mock it properly
const localStorageMethods = ['getItem', 'setItem', 'removeItem', 'clear'];
const sessionStorageMethods = ['getItem', 'setItem', 'removeItem', 'clear'];

// Create mock implementations that use an in-memory store
function createMockStorage() {
  const store = {};
  return {
    getItem: jest.fn((key) => store[key] ?? null),
    setItem: jest.fn((key, value) => {
      store[key] = String(value);
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
    _store: store
  };
}

// Initialize mocks
const localStorageMock = createMockStorage();
const sessionStorageMock = createMockStorage();

// Replace global localStorage with our mock
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true
});

Object.defineProperty(global, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true,
  configurable: true
});

// Also set on window
if (!global.window) {
  global.window = {};
}
Object.defineProperty(global.window, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true
});
Object.defineProperty(global.window, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true,
  configurable: true
});

// Mock navigator
global.navigator = {
  onLine: true,
  vibrate: jest.fn()
};

// Mock window.matchMedia
global.matchMedia = jest.fn().mockImplementation(query => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn()
}));

// Ensure window.location exists
if (!global.window.location) {
  global.window.location = {
    href: '',
    replace: jest.fn(),
    hash: ''
  };
}

// Mock document methods
global.document = global.document || {};
global.document.addEventListener = jest.fn();
global.document.removeEventListener = jest.fn();
global.document.createElement = jest.fn(() => ({
  setAttribute: jest.fn(),
  getAttribute: jest.fn(),
  appendChild: jest.fn(),
  removeChild: jest.fn(),
  classList: {
    add: jest.fn(),
    remove: jest.fn(),
    contains: jest.fn(),
    toggle: jest.fn()
  },
  style: {},
  innerHTML: ''
}));
global.document.getElementById = jest.fn();
global.document.querySelector = jest.fn();
global.document.querySelectorAll = jest.fn(() => []);
global.document.body = global.document.body || {
  appendChild: jest.fn(),
  removeChild: jest.fn(),
  style: {}
};

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn()
};

// Increase timeout for async tests
jest.setTimeout(10000);
