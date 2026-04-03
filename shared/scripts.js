/**
 * Ever Work - Shared JavaScript
 * Core functionality for the Ever Work PWA
 */

// ============================================
// A. LUCIDE ICON INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  
  // Initialize navigation
  initNavigation();
  
  // Initialize toast container
  initToastContainer();
  
  // Check for reduced motion preference
  checkReducedMotion();
});

// Re-initialize icons after dynamic content changes
window.refreshIcons = function() {
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
};

// ============================================
// B. INDEXEDDB SETUP (Dexie.js) - Optional
// ============================================

let db = null;

if (typeof Dexie !== 'undefined') {
  db = new Dexie('EverWorkDB');
  
  db.version(1).stores({
    jobs: '++id, name, color, hourlyRate, icon, createdAt, totalHoursAccumulated',
    sessions: '++id, jobId, startTime, endTime, duration, date, note, earnings',
    settings: '++id, key, value',
    achievements: '++id, type, unlockedAt'
  });
  
  // Initialize default settings
  db.settings.get('dailyGoal').then(setting => {
    if (!setting) {
      db.settings.add({ key: 'dailyGoal', value: 8 });
    }
  });
  
  db.settings.get('currency').then(setting => {
    if (!setting) {
      db.settings.add({ key: 'currency', value: '$' });
    }
  });
  
  db.settings.get('defaultJob').then(setting => {
    if (!setting) {
      db.settings.add({ key: 'defaultJob', value: null });
    }
  });
} else {
  console.log('[Scripts] Dexie not loaded, skipping local DB setup');
}

// ============================================
// C. UTILITY FUNCTIONS
// ============================================

/**
 * Format seconds to HH:MM:SS
 * @param {number} seconds - Total seconds
 * @returns {string} Formatted time string
 */
function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format seconds to human-readable duration (Xh Ym)
 * @param {number} seconds - Total seconds
 * @returns {string} Formatted duration string
 */
function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    return `${minutes}m`;
  }
}

/**
 * Format decimal hours to human-readable (e.g., 6.5 -> "6h 30m")
 * @param {number} decimalHours - Hours as decimal
 * @returns {string} Formatted duration string
 */
function formatDecimalHours(decimalHours) {
  const hours = Math.floor(decimalHours);
  const minutes = Math.round((decimalHours - hours) * 60);
  
  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    return `${minutes}m`;
  }
}

/**
 * Format amount to currency string
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency symbol (default: '$')
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount, currency = '$') {
  return `${currency}${amount.toFixed(2)}`;
}

/**
 * Format date to readable string
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string (e.g., "Mon, Jan 15")
 */
function formatDate(date) {
  const d = new Date(date);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
}

/**
 * Format date to full readable string
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string (e.g., "Monday, January 15, 2024")
 */
function formatDateFull(date) {
  const d = new Date(date);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

/**
 * Format time to 12-hour format
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted time string (e.g., "9:15 AM")
 */
function formatTime12Hour(date) {
  const d = new Date(date);
  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  
  hours = hours % 12;
  hours = hours ? hours : 12;
  
  return `${hours}:${minutes} ${ampm}`;
}

/**
 * Generate a UUID v4
 * @returns {string} UUID string
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Get today's date in YYYY-MM-DD format
 * @returns {string} Date string
 */
function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Calculate earnings from hours and hourly rate
 * @param {number} hours - Hours worked
 * @param {number} hourlyRate - Hourly rate
 * @returns {number} Earnings amount
 */
function calculateEarnings(hours, hourlyRate) {
  return hours * hourlyRate;
}

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function
 * @param {Function} func - Function to throttle
 * @param {number} limit - Limit time in milliseconds
 * @returns {Function} Throttled function
 */
function throttle(func, limit) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// ============================================
// D. ANIMATION HELPERS
// ============================================

// Check for reduced motion preference
let prefersReducedMotion = false;

function checkReducedMotion() {
  prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Animate an element with a specific animation
 * @param {HTMLElement} element - Element to animate
 * @param {string} animation - Animation name (e.g., 'fadeIn', 'slideUp')
 * @param {number} duration - Animation duration in milliseconds
 * @returns {Promise} Resolves when animation completes
 */
function animateElement(element, animation, duration = 300) {
  return new Promise((resolve) => {
    if (prefersReducedMotion) {
      resolve();
      return;
    }
    
    element.style.animation = `${animation} ${duration}ms var(--ease-default) forwards`;
    
    const handleAnimationEnd = () => {
      element.style.animation = '';
      element.removeEventListener('animationend', handleAnimationEnd);
      resolve();
    };
    
    element.addEventListener('animationend', handleAnimationEnd);
  });
}

/**
 * Apply staggered animation to multiple elements
 * @param {NodeList|Array} elements - Elements to animate
 * @param {string} animation - Animation name
 * @param {number} delay - Delay between each element in milliseconds
 */
function staggerAnimation(elements, animation, delay = 50) {
  if (prefersReducedMotion) {
    elements.forEach(el => el.style.opacity = '1');
    return;
  }
  
  elements.forEach((element, index) => {
    setTimeout(() => {
      animateElement(element, animation);
    }, index * delay);
  });
}

/**
 * Setup IntersectionObserver for scroll animations
 * @param {Function} callback - Callback function when element intersects
 * @param {Object} options - IntersectionObserver options
 * @returns {IntersectionObserver} Observer instance
 */
function setupIntersectionObserver(callback, options = {}) {
  const defaultOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };
  
  const observerOptions = { ...defaultOptions, ...options };
  
  return new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        callback(entry.target);
      }
    });
  }, observerOptions);
}

/**
 * Fade in elements on scroll
 * @param {string} selector - CSS selector for elements to animate
 */
function fadeInOnScroll(selector = '.fade-in-scroll') {
  const elements = document.querySelectorAll(selector);
  
  const observer = setupIntersectionObserver((element) => {
    animateElement(element, 'fadeIn');
    observer.unobserve(element);
  });
  
  elements.forEach(el => {
    el.style.opacity = '0';
    observer.observe(el);
  });
}

// ============================================
// E. CONFETTI SYSTEM
// ============================================

/**
 * Trigger a confetti celebration
 * @param {Object} options - Confetti options
 */
function triggerConfetti(options = {}) {
  if (prefersReducedMotion) return;
  
  const defaultOptions = {
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#FF9A56', '#FF6B6B', '#FFD700', '#4ADE80', '#60A5FA'],
    duration: 3000
  };
  
  const config = { ...defaultOptions, ...options };
  
  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.className = 'confetti-canvas';
  canvas.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 600;
  `;
  document.body.appendChild(canvas);
  
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  // Create particles
  const particles = [];
  const particleCount = config.particleCount;
  
  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: canvas.width * config.origin.x + (Math.random() - 0.5) * config.spread * 10,
      y: canvas.height * config.origin.y,
      vx: (Math.random() - 0.5) * 10,
      vy: -Math.random() * 15 - 5,
      gravity: 0.3,
      color: config.colors[Math.floor(Math.random() * config.colors.length)],
      size: Math.random() * 8 + 4,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
      opacity: 1
    });
  }
  
  let animationId;
  let startTime = Date.now();
  
  function animate() {
    const elapsed = Date.now() - startTime;
    
    if (elapsed > config.duration) {
      cancelAnimationFrame(animationId);
      canvas.remove();
      return;
    }
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    particles.forEach((p, index) => {
      // Update position
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.rotation += p.rotationSpeed;
      
      // Fade out
      p.opacity = Math.max(0, 1 - (elapsed / config.duration));
      
      // Draw particle
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    });
    
    animationId = requestAnimationFrame(animate);
  }
  
  animate();
  
  // Handle resize
  const handleResize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  window.addEventListener('resize', handleResize);
  
  // Cleanup
  setTimeout(() => {
    window.removeEventListener('resize', handleResize);
  }, config.duration);
}

// ============================================
// F. TOAST NOTIFICATION SYSTEM
// ============================================

let toastContainer = null;

/**
 * Initialize toast container
 */
function initToastContainer() {
  if (!document.getElementById('toast-container')) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  } else {
    toastContainer = document.getElementById('toast-container');
  }
}

/**
 * Show a toast notification
 * @param {string} message - Toast message
 * @param {string} type - Toast type: 'info', 'success', 'warning', 'error'
 * @param {number} duration - Duration in milliseconds
 */
function showToast(message, type = 'info', duration = 3000) {
  if (!toastContainer) {
    initToastContainer();
  }
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type} toast-enter`;
  
  // Icon based on type
  const icons = {
    info: 'info',
    success: 'check-circle',
    warning: 'alert-triangle',
    error: 'x-circle'
  };
  
  // Add icon bounce animation for success
  const iconClass = type === 'success' ? 'toast-icon toast-icon-bounce' : 'toast-icon';
  
  toast.innerHTML = `
    <i data-lucide="${icons[type]}" class="${iconClass}"></i>
    <span class="toast-message">${message}</span>
    <div class="toast-progress" style="animation-duration: ${duration}ms;"></div>
  `;
  
  toastContainer.appendChild(toast);
  
  // Initialize icon
  if (typeof lucide !== 'undefined') {
    lucide.createIcons({ nodes: [toast] });
  }
  
  // Haptic feedback on mobile
  if (window.interactions && type !== 'info') {
    window.interactions.haptic(type === 'success' ? 'success' : type);
  }
  
  // Auto-dismiss
  setTimeout(() => {
    toast.classList.remove('toast-enter');
    toast.classList.add('toast-exit');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, duration);
}

// ============================================
// G. MODAL SYSTEM
// ============================================

/**
 * Open a modal
 * @param {string} modalId - Modal element ID
 */
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) {
    console.error(`Modal with ID "${modalId}" not found`);
    return;
  }
  
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
  
  // Focus first focusable element
  const focusable = modal.querySelector('button, input, textarea, select, a[href]');
  if (focusable) {
    focusable.focus();
  }
  
  // Setup close handlers
  setupModalCloseHandlers(modal);
}

/**
 * Close a modal
 * @param {string} modalId - Modal element ID
 */
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  
  modal.classList.remove('open');
  document.body.style.overflow = '';
}

/**
 * Setup modal close handlers (backdrop click, escape key)
 * @param {HTMLElement} modal - Modal element
 */
function setupModalCloseHandlers(modal) {
  // Backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }
  });
  
  // Escape key
  const handleEscape = (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) {
      modal.classList.remove('open');
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);
}

// ============================================
// H. BOTTOM SHEET SYSTEM
// ============================================

/**
 * Open a bottom sheet
 * @param {string} sheetId - Bottom sheet element ID
 */
function openBottomSheet(sheetId) {
  const sheet = document.getElementById(sheetId);
  if (!sheet) {
    console.error(`Bottom sheet with ID "${sheetId}" not found`);
    return;
  }
  
  // Create overlay if not exists
  let overlay = document.getElementById(`${sheetId}-overlay`);
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = `${sheetId}-overlay`;
    overlay.className = 'bottom-sheet-overlay';
    document.body.appendChild(overlay);
  }
  
  // Show overlay and sheet
  overlay.classList.add('open');
  sheet.classList.add('open');
  document.body.style.overflow = 'hidden';
  
  // Setup close handlers
  setupBottomSheetCloseHandlers(sheet, overlay);
  
  // Setup swipe to close
  setupSwipeToClose(sheet);
}

/**
 * Close a bottom sheet
 * @param {string} sheetId - Bottom sheet element ID
 */
function closeBottomSheet(sheetId) {
  const sheet = document.getElementById(sheetId);
  const overlay = document.getElementById(`${sheetId}-overlay`);
  
  if (sheet) {
    sheet.classList.remove('open');
  }
  if (overlay) {
    overlay.classList.remove('open');
  }
  document.body.style.overflow = '';
}

/**
 * Setup bottom sheet close handlers
 * @param {HTMLElement} sheet - Bottom sheet element
 * @param {HTMLElement} overlay - Overlay element
 */
function setupBottomSheetCloseHandlers(sheet, overlay) {
  // Overlay click
  overlay.addEventListener('click', () => {
    closeBottomSheet(sheet.id);
  });
  
  // Handle close button if exists
  const closeBtn = sheet.querySelector('[data-close-sheet]');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      closeBottomSheet(sheet.id);
    });
  }
}

/**
 * Setup swipe down to close
 * @param {HTMLElement} sheet - Bottom sheet element
 */
function setupSwipeToClose(sheet) {
  let startY = 0;
  let currentY = 0;
  let isDragging = false;
  
  const handle = sheet.querySelector('.bottom-sheet-handle') || sheet;
  
  handle.addEventListener('touchstart', (e) => {
    startY = e.touches[0].clientY;
    isDragging = true;
    sheet.style.transition = 'none';
  }, { passive: true });
  
  handle.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    currentY = e.touches[0].clientY;
    const deltaY = currentY - startY;
    
    if (deltaY > 0) {
      sheet.style.transform = `translateY(${deltaY}px)`;
    }
  }, { passive: true });
  
  handle.addEventListener('touchend', () => {
    if (!isDragging) return;
    isDragging = false;
    sheet.style.transition = '';
    
    const deltaY = currentY - startY;
    if (deltaY > 100) {
      closeBottomSheet(sheet.id);
    } else {
      sheet.style.transform = '';
    }
  });
}

// ============================================
// I. NAVIGATION SYSTEM
// ============================================

/**
 * Initialize navigation
 */
function initNavigation() {
  // Handle nav item clicks
  document.querySelectorAll('.bottom-nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const viewId = item.getAttribute('data-view');
      if (viewId) {
        navigateTo(viewId);
      }
    });
  });
  
  // Handle initial hash
  handleHashChange();
  
  // Listen for hash changes
  window.addEventListener('hashchange', handleHashChange);
}

/**
 * Navigate to a view
 * @param {string} viewId - View ID to navigate to
 */
function navigateTo(viewId) {
  // Update URL hash
  window.location.hash = viewId;
  
  // Update active nav item
  updateActiveNavItem(viewId);
  
  // Show the view
  showView(viewId);
}

/**
 * Handle hash change
 */
function handleHashChange() {
  const hash = window.location.hash.slice(1) || 'dashboard';
  updateActiveNavItem(hash);
  showView(hash);
}

/**
 * Update active nav item
 * @param {string} viewId - Current view ID
 */
function updateActiveNavItem(viewId) {
  document.querySelectorAll('.bottom-nav-item').forEach(item => {
    item.classList.remove('active');
    if (item.getAttribute('data-view') === viewId) {
      item.classList.add('active');
    }
  });
}

/**
 * Show a specific view
 * @param {string} viewId - View ID to show
 */
function showView(viewId) {
  // Hide all views
  document.querySelectorAll('[data-view-container]').forEach(view => {
    view.style.display = 'none';
  });
  
  // Show target view
  const targetView = document.getElementById(`view-${viewId}`);
  if (targetView) {
    targetView.style.display = 'block';
    
    // Animate in
    if (!prefersReducedMotion) {
      animateElement(targetView, 'fadeIn', 300);
    }
  }
}

// ============================================
// J. TIMER STATE MANAGEMENT
// ============================================

const TIMER_STATE_KEY = 'everwork_timer_state';

/**
 * Save timer state to localStorage (for crash recovery)
 * @param {Object} session - Timer session data
 */
function saveTimerState(session) {
  try {
    const state = {
      ...session,
      lastUpdate: Date.now()
    };
    localStorage.setItem(TIMER_STATE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save timer state:', error);
  }
}

/**
 * Load timer state from localStorage
 * @returns {Object|null} Saved session or null
 */
function loadTimerState() {
  try {
    const state = localStorage.getItem(TIMER_STATE_KEY);
    if (state) {
      return JSON.parse(state);
    }
  } catch (error) {
    console.error('Failed to load timer state:', error);
  }
  return null;
}

/**
 * Clear timer state from localStorage
 */
function clearTimerState() {
  try {
    localStorage.removeItem(TIMER_STATE_KEY);
  } catch (error) {
    console.error('Failed to clear timer state:', error);
  }
}

/**
 * Check if there's an active timer session
 * @returns {boolean} True if timer is active
 */
function hasActiveTimer() {
  const state = loadTimerState();
  return state && state.isRunning;
}

// ============================================
// K. SETTINGS HELPERS
// ============================================

/**
 * Get a setting value
 * @param {string} key - Setting key
 * @param {*} defaultValue - Default value if not found
 * @returns {Promise<*>} Setting value
 */
async function getSetting(key, defaultValue = null) {
  try {
    const setting = await db.settings.get({ key });
    return setting ? setting.value : defaultValue;
  } catch (error) {
    console.error(`Failed to get setting "${key}":`, error);
    return defaultValue;
  }
}

/**
 * Set a setting value
 * @param {string} key - Setting key
 * @param {*} value - Setting value
 */
async function setSetting(key, value) {
  try {
    const existing = await db.settings.get({ key });
    if (existing) {
      await db.settings.update(existing.id, { value });
    } else {
      await db.settings.add({ key, value });
    }
  } catch (error) {
    console.error(`Failed to set setting "${key}":`, error);
  }
}

// ============================================
// L. DATA EXPORT/IMPORT
// ============================================

/**
 * Export all data as JSON file
 */
async function exportData() {
  try {
    const data = {
      jobs: await db.jobs.toArray(),
      sessions: await db.sessions.toArray(),
      settings: await db.settings.toArray(),
      achievements: await db.achievements.toArray(),
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `everwork-backup-${getTodayDate()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
    showToast('Data exported successfully!', 'success');
  } catch (error) {
    console.error('Failed to export data:', error);
    showToast('Failed to export data', 'error');
  }
}

/**
 * Import data from JSON file
 * @param {File} file - JSON file to import
 */
async function importData(file) {
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    
    // Validate data structure
    if (!data.jobs || !data.sessions) {
      throw new Error('Invalid backup file');
    }
    
    // Clear existing data
    await db.jobs.clear();
    await db.sessions.clear();
    await db.settings.clear();
    await db.achievements.clear();
    
    // Import new data
    if (data.jobs.length) await db.jobs.bulkAdd(data.jobs);
    if (data.sessions.length) await db.sessions.bulkAdd(data.sessions);
    if (data.settings && data.settings.length) await db.settings.bulkAdd(data.settings);
    if (data.achievements && data.achievements.length) await db.achievements.bulkAdd(data.achievements);
    
    showToast('Data imported successfully!', 'success');
    return true;
  } catch (error) {
    console.error('Failed to import data:', error);
    showToast('Failed to import data: ' + error.message, 'error');
    return false;
  }
}

// ============================================
// M. ACHIEVEMENT SYSTEM
// ============================================

/**
 * Unlock an achievement
 * @param {string} type - Achievement type
 */
async function unlockAchievement(type) {
  try {
    // Check if already unlocked
    const existing = await db.achievements.get({ type });
    if (existing) return;
    
    // Unlock achievement
    await db.achievements.add({
      type,
      unlockedAt: new Date().toISOString()
    });
    
    // Trigger celebration
    triggerConfetti({ particleCount: 150 });
    
    // Show toast
    const achievementNames = {
      'first-step': 'First Step',
      'week-warrior': 'Week Warrior',
      'century-club': 'Century Club',
      'night-owl': 'Night Owl',
      'early-bird': 'Early Bird',
      'goal-crusher': 'Goal Crusher'
    };
    
    showToast(`Achievement Unlocked: ${achievementNames[type] || type}!`, 'success', 5000);
  } catch (error) {
    console.error('Failed to unlock achievement:', error);
  }
}

/**
 * Check and unlock achievements based on conditions
 */
async function checkAchievements() {
  try {
    const sessions = await db.sessions.toArray();
    const totalHours = sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / 3600;
    
    // First Step - First session
    if (sessions.length >= 1) {
      unlockAchievement('first-step');
    }
    
    // Century Club - 100 hours
    if (totalHours >= 100) {
      unlockAchievement('century-club');
    }
    
    // Check streak
    const streak = calculateStreak(sessions);
    if (streak >= 7) {
      unlockAchievement('week-warrior');
    }
  } catch (error) {
    console.error('Failed to check achievements:', error);
  }
}

/**
 * Calculate current streak
 * @param {Array} sessions - Array of sessions
 * @returns {number} Streak count
 */
function calculateStreak(sessions) {
  if (!sessions.length) return 0;
  
  const dates = [...new Set(sessions.map(s => s.date))].sort().reverse();
  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  
  for (const dateStr of dates) {
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    
    const diffDays = Math.floor((currentDate - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === streak) {
      streak++;
      currentDate = date;
    } else {
      break;
    }
  }
  
  return streak;
}

// ============================================
// N. HAPTIC FEEDBACK
// ============================================

/**
 * Trigger haptic feedback if supported
 * @param {string} type - Feedback type: 'light', 'medium', 'heavy', 'success', 'error'
 */
function hapticFeedback(type = 'light') {
  if ('vibrate' in navigator) {
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30],
      success: [10, 50, 10],
      error: [30, 50, 30]
    };
    
    navigator.vibrate(patterns[type] || patterns.light);
  }
}

// ============================================
// O. SERVICE WORKER REGISTRATION
// ============================================

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW registered:', registration);
      })
      .catch(error => {
        console.log('SW registration failed:', error);
      });
  });
}

// ============================================
// P. EXPORTS (for module usage)
// ============================================

// Make functions available globally
window.EverWork = {
  // Database
  db,
  
  // Utilities
  formatTime,
  formatDuration,
  formatDecimalHours,
  formatCurrency,
  formatDate,
  formatDateFull,
  formatTime12Hour,
  generateUUID,
  getTodayDate,
  calculateEarnings,
  debounce,
  throttle,
  
  // Animation
  animateElement,
  staggerAnimation,
  setupIntersectionObserver,
  fadeInOnScroll,
  
  // Confetti
  triggerConfetti,
  
  // Toast
  showToast,
  
  // Modal
  openModal,
  closeModal,
  
  // Bottom Sheet
  openBottomSheet,
  closeBottomSheet,
  
  // Navigation
  navigateTo,
  
  // Timer State
  saveTimerState,
  loadTimerState,
  clearTimerState,
  hasActiveTimer,
  
  // Settings
  getSetting,
  setSetting,
  
  // Data
  exportData,
  importData,
  
  // Achievements
  unlockAchievement,
  checkAchievements,
  calculateStreak,
  
  // Haptic
  hapticFeedback,
  
  // Icons
  refreshIcons
};

// ============================================
// Q. ERROR BOUNDARIES & SAFE EXECUTION
// ============================================

/**
 * Safely execute an async function with error handling
 * @param {Function} fn - Async function to execute
 * @param {Object} options - Options for error handling
 * @returns {Promise} Result or fallback
 */
async function safeAsync(fn, options = {}) {
  const {
    fallback = null,
    errorMessage = 'An error occurred',
    showError = true,
    context = ''
  } = options;
  
  try {
    return await fn();
  } catch (error) {
    console.error(`[${context}] Error:`, error);
    
    if (showError && typeof showToast === 'function') {
      showToast(errorMessage, 'error');
    }
    
    return fallback;
  }
}

/**
 * Wrap a function with error boundary
 * @param {Function} fn - Function to wrap
 * @param {Object} options - Error handling options
 * @returns {Function} Wrapped function
 */
function withErrorBoundary(fn, options = {}) {
  const {
    fallback = null,
    errorMessage = 'Something went wrong',
    context = ''
  } = options;
  
  return async function(...args) {
    return safeAsync(() => fn.apply(this, args), {
      fallback,
      errorMessage,
      context,
      showError: true
    });
  };
}

/**
 * Global error handler for unhandled promise rejections
 */
window.addEventListener('unhandledrejection', (event) => {
  console.error('[Global] Unhandled promise rejection:', event.reason);
  
  // Don't show toast for network errors (too noisy)
  if (event.reason?.message?.includes('network')) return;
  if (event.reason?.code?.includes('network')) return;
  
  if (typeof showToast === 'function') {
    showToast('Something went wrong. Please try again.', 'error');
  }
});

/**
 * Global error handler for uncaught errors
 */
window.addEventListener('error', (event) => {
  console.error('[Global] Uncaught error:', event.error);
  
  // Prevent default browser error display
  event.preventDefault();
  
  if (typeof showToast === 'function') {
    showToast('An unexpected error occurred', 'error');
  }
});

// Add to EverWork namespace
window.EverWork.safeAsync = safeAsync;
window.EverWork.withErrorBoundary = withErrorBoundary;
