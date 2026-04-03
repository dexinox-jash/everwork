/**
 * Production Security Headers Configuration
 * AAA-grade security for Ever Work
 */

const SECURITY_CONFIG = {
  // Content Security Policy - Strict
  contentSecurityPolicy: {
    defaultSrc: ["'self'"],
    scriptSrc: [
      "'self'",
      "'unsafe-inline'", // Required for inline event handlers (temporary)
      "https://www.gstatic.com", // Firebase
      "https://cdn.jsdelivr.net", // Tailwind
      "https://unpkg.com", // Lucide
    ],
    styleSrc: [
      "'self'",
      "'unsafe-inline'", // Required for dynamic styles
      "https://fonts.googleapis.com",
      "https://cdn.jsdelivr.net",
    ],
    fontSrc: [
      "'self'",
      "https://fonts.gstatic.com",
      "data:",
    ],
    imgSrc: [
      "'self'",
      "data:",
      "blob:",
      "https:",
    ],
    connectSrc: [
      "'self'",
      "https://*.firebaseio.com", // Firebase Realtime DB
      "https://*.googleapis.com", // Firestore
      "https://identitytoolkit.googleapis.com", // Auth
      "https://securetoken.googleapis.com", // Auth tokens
    ],
    frameSrc: ["'none'"], // No iframes allowed
    objectSrc: ["'none'"], // No Flash/Java
    baseUri: ["'self'"],
    formAction: ["'self'"],
    upgradeInsecureRequests: true,
  },

  // HTTP Headers
  headers: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  },

  // Firebase-specific security
  firebase: {
    // Firestore Security Rules - Applied in Firebase Console
    firestoreRules: `
      rules_version = '2';
      service cloud.firestore {
        match /databases/{database}/documents {
          // Helper functions
          function isAuthenticated() {
            return request.auth != null;
          }
          
          function isOwner(userId) {
            return isAuthenticated() && request.auth.uid == userId;
          }
          
          function isValidJob() {
            return request.resource.data.name is string
              && request.resource.data.name.size() > 0
              && request.resource.data.name.size() < 100
              && request.resource.data.hourlyRate is number
              && request.resource.data.hourlyRate >= 0
              && request.resource.data.hourlyRate < 10000;
          }
          
          function isValidSession() {
            return request.resource.data.jobId is string
              && request.resource.data.startTime is string
              && request.resource.data.durationSeconds is number
              && request.resource.data.durationSeconds >= 0
              && request.resource.data.durationSeconds < 2592000; // Max 30 days
          }
          
          // Users collection
          match /users/{userId} {
            allow read, write: if isOwner(userId);
            
            // Jobs subcollection
            match /jobs/{jobId} {
              allow read: if isOwner(userId);
              allow create, update: if isOwner(userId) && isValidJob();
              allow delete: if isOwner(userId);
            }
            
            // Sessions subcollection
            match /sessions/{sessionId} {
              allow read: if isOwner(userId);
              allow create, update: if isOwner(userId) && isValidSession();
              allow delete: if isOwner(userId);
            }
            
            // Active timers subcollection
            match /activeTimers/{timerId} {
              allow read: if isOwner(userId);
              allow create, update, delete: if isOwner(userId);
            }
          }
        }
      }
    `,

    // Authentication settings
    auth: {
      // Only allow specific domains (configure in Firebase Console)
      allowedDomains: ['ever-work-ee664.web.app'],
      
      // Session settings
      sessionDuration: 2 * 60 * 60 * 1000, // 2 hours
      
      // Password policy
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
      }
    }
  }
};

// Generate CSP header string
function generateCSPHeader(policy) {
  const directives = [];
  
  for (const [key, values] of Object.entries(policy)) {
    if (key === 'upgradeInsecureRequests') {
      if (values) directives.push('upgrade-insecure-requests');
      continue;
    }
    
    const directiveName = key.replace(/([A-Z])/g, '-$1').toLowerCase();
    const valueStr = Array.isArray(values) ? values.join(' ') : values;
    directives.push(`${directiveName} ${valueStr}`);
  }
  
  return directives.join('; ');
}

// Apply headers to response (for Firebase Hosting)
const securityHeaders = {
  'Content-Security-Policy': generateCSPHeader(SECURITY_CONFIG.contentSecurityPolicy),
  ...SECURITY_CONFIG.headers
};

// Export for use in Firebase hosting config
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SECURITY_CONFIG, securityHeaders, generateCSPHeader };
}
