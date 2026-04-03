# Ever Work - Firebase Setup Guide

Complete guide to set up Ever Work on Firebase with Authentication, Firestore, and Hosting.

## 1. Create Firebase Project

1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Click "Create a project"
3. Enter project name: `ever-work-app`
4. Enable Google Analytics (optional)
5. Click "Create Project"

## 2. Enable Authentication

1. Go to **Authentication** → **Get Started**
2. Enable **Email/Password** provider
3. (Optional) Enable Google Sign-in
4. Save

## 3. Setup Firestore Database

1. Go to **Firestore Database** → **Create Database**
2. Choose **Start in production mode**
3. Select a location closest to your users (e.g., `us-central`)
4. Click **Enable**

### Firestore Security Rules

Go to Firestore Database → Rules and paste:

```rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check authentication
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    // User profiles
    match /users/{userId} {
      allow read: if isAuthenticated() && isOwner(userId);
      allow write: if isAuthenticated() && isOwner(userId);
    }
    
    // Jobs collection
    match /users/{userId}/jobs/{jobId} {
      allow read: if isAuthenticated() && isOwner(userId);
      allow create, update, delete: if isAuthenticated() && isOwner(userId);
    }
    
    // Sessions collection
    match /users/{userId}/sessions/{sessionId} {
      allow read: if isAuthenticated() && isOwner(userId);
      allow create, update, delete: if isAuthenticated() && isOwner(userId);
    }
    
    // Active timers
    match /users/{userId}/activeTimers/{timerId} {
      allow read: if isAuthenticated() && isOwner(userId);
      allow create, update, delete: if isAuthenticated() && isOwner(userId);
    }
    
    // Achievements
    match /users/{userId}/achievements/{achievementId} {
      allow read: if isAuthenticated() && isOwner(userId);
      allow create, update, delete: if isAuthenticated() && isOwner(userId);
    }
  }
}
```

Click **Publish**.

## 4. Get Firebase Config

1. Go to **Project Settings** (gear icon)
2. Under **Your Apps**, click **</>** to add a web app
3. Register app with nickname: `Ever Work Web`
4. Check "Also set up Firebase Hosting" (optional)
5. Click **Register App**
6. Copy the Firebase config object

It looks like this:
```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

## 5. Update App Configuration

Replace the contents of `shared/config.js` with your Firebase config:

```javascript
const CONFIG = {
  // Firebase Configuration
  FIREBASE_API_KEY: 'your-api-key',
  FIREBASE_AUTH_DOMAIN: 'your-project.firebaseapp.com',
  FIREBASE_PROJECT_ID: 'your-project',
  FIREBASE_STORAGE_BUCKET: 'your-project.appspot.com',
  FIREBASE_MESSAGING_SENDER_ID: '123456789',
  FIREBASE_APP_ID: '1:123456789:web:abcdef123456',
  
  // App Configuration
  APP_NAME: 'Ever Work',
  APP_VERSION: '1.0.0',
  
  // Sync Configuration
  SYNC_INTERVAL: 30000,
  OFFLINE_QUEUE_MAX_SIZE: 1000,
  
  // Timer Configuration
  MAX_SESSION_DURATION_HOURS: 24,
  MIDNIGHT_SPLIT_ENABLED: true,
  
  // Feature Flags
  ENABLE_OFFLINE_MODE: true,
  ENABLE_REAL_TIME_SYNC: true,
  ENABLE_ACHIEVEMENTS: true
};
```

## 6. Install Firebase CLI (for deployment)

```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init
```

## 7. Initialize Firebase Project

```bash
# In your project folder
firebase init

# Select these features:
# [ ] Firestore
# [ ] Functions
# [x] Hosting
# [ ] Storage
# [ ] Emulators

# Choose your project
# Use existing project: select your project

# Hosting setup:
# What do you want to use as your public directory? . (current directory)
# Configure as a single-page app? No
# Set up automatic builds and deploys with GitHub? No
```

## 8. Deploy to Firebase Hosting

```bash
# Deploy everything
firebase deploy

# Or deploy only hosting
firebase deploy --only hosting

# Or deploy only functions
firebase deploy --only functions
```

## 9. Cloud Function for Server Time (Optional but Recommended)

For accurate time tracking, create a Cloud Function:

```bash
firebase init functions
```

Then in `functions/index.js`:

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.getServerTime = functions.https.onCall((data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
  }
  
  return { timestamp: admin.firestore.Timestamp.now() };
});
```

Deploy:
```bash
firebase deploy --only functions
```

## 10. Test Your Deployment

1. Visit your hosting URL: `https://your-project.web.app`
2. Test authentication
3. Test offline functionality
4. Verify data syncs across devices

## Firebase Pricing (Free Tier)

**Spark Plan (Free):**
- Authentication: 10,000 users/month
- Firestore: 50,000 reads/day, 20,000 writes/day
- Hosting: 1GB storage, 10GB/month bandwidth
- Functions: 125,000 invocations/month

This is more than enough for personal use or small teams.

## Troubleshooting

### CORS Issues
If you see CORS errors, your hosting is working but firestore rules might be wrong. Check security rules.

### Offline Not Working
Make sure:
1. Service Worker is registered
2. `ENABLE_OFFLINE_MODE` is `true` in config
3. Browser supports Service Workers (Chrome, Firefox, Safari, Edge)

### Auth Not Persisting
Firebase Auth persists by default. If not working:
- Check browser cookies are enabled
- Check `firebase.auth.Auth.Persistence.LOCAL` is set (default)

---

Your app is now live on Firebase! 🚀
