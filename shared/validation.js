/**
 * Ever Work - Input Validation & Sanitization
 * Security and data validation utilities
 */

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  if (!text || typeof text !== 'string') return '';
  
  const htmlEscapes = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };
  
  return text.replace(/[&<>"'\/]/g, char => htmlEscapes[char]);
}

/**
 * Sanitize user input for storage
 * @param {string} input - User input
 * @param {Object} options - Sanitization options
 * @returns {string} Sanitized input
 */
function sanitizeInput(input, options = {}) {
  const {
    maxLength = 140,
    allowNewlines = false,
    trim = true
  } = options;
  
  if (!input || typeof input !== 'string') return '';
  
  let sanitized = input;
  
  // Remove potentially dangerous characters
  sanitized = sanitized.replace(/[<>]/g, '');
  
  // Remove newlines unless allowed
  if (!allowNewlines) {
    sanitized = sanitized.replace(/[\r\n]/g, ' ');
  }
  
  // Trim whitespace
  if (trim) {
    sanitized = sanitized.trim();
  }
  
  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
}

/**
 * Validate email address format
 * @param {string} email - Email to validate
 * @returns {boolean} Is valid
 */
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result
 */
function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Password is required' };
  }
  
  if (password.length < 6) {
    return { valid: false, error: 'Password must be at least 6 characters' };
  }
  
  const checks = {
    hasLowercase: /[a-z]/.test(password),
    hasUppercase: /[A-Z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[^a-zA-Z0-9]/.test(password),
    length: password.length
  };
  
  const strength = Object.values(checks).filter(Boolean).length;
  
  return {
    valid: true,
    strength: strength <= 2 ? 'weak' : strength <= 4 ? 'medium' : 'strong',
    checks
  };
}

/**
 * Validate hourly rate
 * @param {number|string} rate - Rate to validate
 * @returns {Object} Validation result
 */
function validateHourlyRate(rate) {
  if (rate === null || rate === undefined || rate === '') {
    return { valid: true, value: null }; // Null rate is valid
  }
  
  const num = parseFloat(rate);
  
  if (isNaN(num)) {
    return { valid: false, error: 'Rate must be a number' };
  }
  
  if (num < 0) {
    return { valid: false, error: 'Rate cannot be negative' };
  }
  
  if (num > 10000) {
    return { valid: false, error: 'Rate cannot exceed $10,000/hr' };
  }
  
  // Round to 2 decimal places
  const rounded = Math.round(num * 100) / 100;
  
  return { valid: true, value: rounded };
}

/**
 * Validate job name
 * @param {string} name - Job name to validate
 * @returns {Object} Validation result
 */
function validateJobName(name) {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Job name is required' };
  }
  
  const trimmed = name.trim();
  
  if (trimmed.length === 0) {
    return { valid: false, error: 'Job name cannot be empty' };
  }
  
  if (trimmed.length > 30) {
    return { valid: false, error: 'Job name must be 30 characters or less' };
  }
  
  // Check for only special characters
  if (!/[a-zA-Z0-9]/.test(trimmed)) {
    return { valid: false, error: 'Job name must contain at least one letter or number' };
  }
  
  return { valid: true, value: trimmed };
}

/**
 * Validate session duration
 * @param {number} seconds - Duration in seconds
 * @returns {Object} Validation result
 */
function validateSessionDuration(seconds) {
  if (!Number.isFinite(seconds)) {
    return { valid: false, error: 'Duration must be a number' };
  }
  
  if (seconds < 0) {
    return { valid: false, error: 'Duration cannot be negative' };
  }
  
  if (seconds > 86400 * 2) { // Max 2 days
    return { valid: false, error: 'Duration cannot exceed 48 hours' };
  }
  
  return { valid: true, value: Math.floor(seconds) };
}

/**
 * Validate date string
 * @param {string} dateStr - Date string (YYYY-MM-DD)
 * @returns {Object} Validation result
 */
function validateDateString(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') {
    return { valid: false, error: 'Date is required' };
  }
  
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) {
    return { valid: false, error: 'Date must be in YYYY-MM-DD format' };
  }
  
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return { valid: false, error: 'Invalid date' };
  }
  
  // Check date is not too far in future (1 year)
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
  if (date > oneYearFromNow) {
    return { valid: false, error: 'Date cannot be more than 1 year in the future' };
  }
  
  return { valid: true, value: dateStr };
}

/**
 * Validate daily goal hours
 * @param {number} hours - Hours value
 * @returns {Object} Validation result
 */
function validateDailyGoal(hours) {
  const num = parseFloat(hours);
  
  if (isNaN(num)) {
    return { valid: false, error: 'Daily goal must be a number' };
  }
  
  if (num < 0.5) {
    return { valid: false, error: 'Daily goal must be at least 0.5 hours' };
  }
  
  if (num > 24) {
    return { valid: false, error: 'Daily goal cannot exceed 24 hours' };
  }
  
  return { valid: true, value: num };
}

/**
 * Validate timer data structure
 * @param {Object} timer - Timer object
 * @returns {Object} Validation result
 */
function validateTimerData(timer) {
  if (!timer || typeof timer !== 'object') {
    return { valid: false, error: 'Invalid timer data' };
  }
  
  const required = ['id', 'jobId', 'startTime'];
  const missing = required.filter(field => !timer[field]);
  
  if (missing.length > 0) {
    return { valid: false, error: `Missing required fields: ${missing.join(', ')}` };
  }
  
  // Validate jobId is string
  if (typeof timer.jobId !== 'string') {
    return { valid: false, error: 'jobId must be a string' };
  }
  
  // Validate startTime is valid date
  const startTime = new Date(timer.startTime);
  if (isNaN(startTime.getTime())) {
    return { valid: false, error: 'Invalid startTime' };
  }
  
  // Check if timer is too old (>24 hours)
  const hoursElapsed = (Date.now() - startTime.getTime()) / (1000 * 60 * 60);
  if (hoursElapsed > 24) {
    return { valid: false, error: 'Timer is stale (>24 hours)', stale: true };
  }
  
  return { valid: true, value: timer };
}

/**
 * Validate and sanitize complete session object
 * @param {Object} session - Session object
 * @returns {Object} Validation result with sanitized data
 */
function validateSession(session) {
  const errors = [];
  const sanitized = {};
  
  // jobId
  if (!session.jobId || typeof session.jobId !== 'string') {
    errors.push('jobId is required');
  } else {
    sanitized.jobId = session.jobId;
  }
  
  // startTime
  const startValidation = validateDateString(session.startTime);
  if (!startValidation.valid) {
    errors.push(`startTime: ${startValidation.error}`);
  } else {
    sanitized.startTime = session.startTime;
  }
  
  // endTime (optional)
  if (session.endTime) {
    const endValidation = validateDateString(session.endTime);
    if (!endValidation.valid) {
      errors.push(`endTime: ${endValidation.error}`);
    } else {
      sanitized.endTime = session.endTime;
    }
  }
  
  // duration
  const durationValidation = validateSessionDuration(session.duration || session.durationSeconds);
  if (!durationValidation.valid) {
    errors.push(`duration: ${durationValidation.error}`);
  } else {
    sanitized.duration = durationValidation.value;
    sanitized.durationSeconds = durationValidation.value;
  }
  
  // date
  const dateValidation = validateDateString(session.date);
  if (!dateValidation.valid) {
    errors.push(`date: ${dateValidation.error}`);
  } else {
    sanitized.date = dateValidation.value;
  }
  
  // note (sanitize)
  sanitized.note = sanitizeInput(session.note, { maxLength: 140 });
  
  // earnings (optional)
  if (session.earnings !== undefined && session.earnings !== null) {
    const earnings = parseFloat(session.earnings);
    if (!isNaN(earnings) && earnings >= 0 && earnings < 1000000) {
      sanitized.earnings = Math.round(earnings * 100) / 100;
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    data: sanitized
  };
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    escapeHtml,
    sanitizeInput,
    isValidEmail,
    validatePassword,
    validateHourlyRate,
    validateJobName,
    validateSessionDuration,
    validateDateString,
    validateDailyGoal,
    validateTimerData,
    validateSession
  };
}

// Make available globally for browser
if (typeof window !== 'undefined') {
  window.EverWorkValidation = {
    escapeHtml,
    sanitizeInput,
    isValidEmail,
    validatePassword,
    validateHourlyRate,
    validateJobName,
    validateSessionDuration,
    validateDateString,
    validateDailyGoal,
    validateTimerData,
    validateSession
  };
}
