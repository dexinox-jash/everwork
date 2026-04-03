/**
 * Ever Work - Firebase Configuration
 * Replace these values with your actual Firebase project credentials
 */

const CONFIG = {
  // ============================================
  // FIREBASE CONFIGURATION - UPDATE THESE VALUES
  // ============================================
  
  // Firebase API Key
  FIREBASE_API_KEY: 'AIzaSyBzGdURq68HEri4Y5S8TX28lChc-d9nLAE',
  
  // Firebase Auth Domain
  FIREBASE_AUTH_DOMAIN: 'ever-work-ee664.firebaseapp.com',
  
  // Firebase Project ID
  FIREBASE_PROJECT_ID: 'ever-work-ee664',
  
  // Firebase Storage Bucket
  FIREBASE_STORAGE_BUCKET: 'ever-work-ee664.firebasestorage.app',
  
  // Firebase Messaging Sender ID
  FIREBASE_MESSAGING_SENDER_ID: '308449238576',
  
  // Firebase App ID
  FIREBASE_APP_ID: '1:308449238576:web:cfc5bb106950abe40717f5',
  
  // ============================================
  // APP CONFIGURATION
  // ============================================
  
  APP_NAME: 'Ever Work',
  APP_VERSION: '1.0.0',
  
  // Sync interval in milliseconds (30 seconds)
  SYNC_INTERVAL: 30000,
  
  // Maximum offline queue size
  OFFLINE_QUEUE_MAX_SIZE: 1000,
  
  // ============================================
  // TIMER CONFIGURATION
  // ============================================
  
  // Maximum session duration (24 hours)
  MAX_SESSION_DURATION_HOURS: 24,
  
  // Automatically split sessions that cross midnight
  MIDNIGHT_SPLIT_ENABLED: true,
  
  // ============================================
  // FEATURE FLAGS
  // ============================================
  
  // Enable offline mode with IndexedDB
  ENABLE_OFFLINE_MODE: true,
  
  // Enable real-time sync across devices
  ENABLE_REAL_TIME_SYNC: true,
  
  // Enable achievements system
  ENABLE_ACHIEVEMENTS: true,
  
  // Enable confetti celebrations
  ENABLE_CELEBRATION: true,
  
  // ============================================
  // SECURITY
  // ============================================
  
  // Require authentication for cloud features
  REQUIRE_AUTH: true,
  
  // Enable email verification
  EMAIL_VERIFICATION: false
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
