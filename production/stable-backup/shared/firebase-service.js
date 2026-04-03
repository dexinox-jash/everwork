/**
 * Ever Work - Firebase Service
 * Handles Firebase Auth, Firestore, and real-time sync
 */

// Fallback showToast if not already defined
defineGlobalShowToast();

function defineGlobalShowToast() {
  if (typeof window !== 'undefined' && typeof window.showToast !== 'function') {
    window.showToast = function(message, type = 'info', duration = 3000) {
      console.log(`[Toast:${type}] ${message}`);
      
      // Create toast element
      const toast = document.createElement('div');
      toast.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        z-index: 9999;
        transition: all 0.3s ease;
        ${type === 'success' ? 'background: #4ADE80; color: #000;' : 
          type === 'error' ? 'background: #F87171; color: #fff;' :
          type === 'warning' ? 'background: #FBBF24; color: #000;' :
          'background: rgba(255,255,255,0.9); color: #000;'}
      `;
      toast.textContent = message;
      document.body.appendChild(toast);
      
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(-20px)';
        setTimeout(() => toast.remove(), 300);
      }, duration);
    };
  }
}

class FirebaseService {
  constructor() {
    this.app = null;
    this.auth = null;
    this.db = null;
    this.currentUser = undefined;  // undefined = not initialized yet, null = explicitly signed out
    this.isOnline = navigator.onLine;
    this.syncInProgress = false;
    this.offlineQueue = [];
    this.unsubscribers = [];
    
    // Local IndexedDB for offline storage
    this.localDb = null;
    
    // Server time offset (for accuracy)
    this.serverTimeOffset = 0;
    
    // Initialization promise - ensures init completes before other operations
    this.initPromise = null;
    this.initComplete = false;
    
    this.init();
  }
  
  async init() {
    if (this.initPromise) return this.initPromise;
    
    this.initPromise = this._doInit();
    return this.initPromise;
  }
  
  async _doInit() {
    try {
      console.log('[Firebase] Initializing...');
      
      // Initialize Firebase
      this.app = firebase.initializeApp({
        apiKey: CONFIG.FIREBASE_API_KEY,
        authDomain: CONFIG.FIREBASE_AUTH_DOMAIN,
        projectId: CONFIG.FIREBASE_PROJECT_ID,
        storageBucket: CONFIG.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: CONFIG.FIREBASE_MESSAGING_SENDER_ID,
        appId: CONFIG.FIREBASE_APP_ID
      });
      
      // Initialize Auth and Firestore
      this.auth = firebase.auth();
      this.db = firebase.firestore();
      
      // Set auth persistence to LOCAL (survives browser restart)
      try {
        await this.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
        console.log('[Firebase] Auth persistence set to LOCAL');
      } catch (err) {
        console.warn('[Firebase] Could not set auth persistence:', err);
      }
      
      // Enable offline persistence
      await this.db.enablePersistence({
        synchronizeTabs: true
      }).catch((err) => {
        if (err.code === 'failed-precondition') {
          console.warn('[Firebase] Persistence failed: Multiple tabs open');
        } else if (err.code === 'unimplemented') {
          console.warn('[Firebase] Persistence not supported');
        }
      });
      
      // Initialize local IndexedDB
      await this.initLocalDb();
      
      // Setup auth state listener - wait for initial auth state before completing init
      await new Promise((resolve) => {
        const unsubscribe = this.auth.onAuthStateChanged((user) => {
          this.currentUser = user;
          this.initComplete = true;
          
          if (user) {
            console.log('[Firebase] User signed in:', user.email);
            this.fullSync();
            this.subscribeToRealtime();
          } else {
            console.log('[Firebase] User signed out');
            this.unsubscribeAll();
          }
          
          unsubscribe();
          resolve();
        });
        
        // Timeout fallback for auth state
        setTimeout(() => {
          unsubscribe();
          this.initComplete = true;
          resolve();
        }, 3000);
      });
      
      // Setup online/offline listeners
      window.addEventListener('online', () => this.handleOnline());
      window.addEventListener('offline', () => this.handleOffline());
      
      // Load offline queue
      await this.loadOfflineQueue();
      
      // Calculate server time offset
      await this.calculateServerTimeOffset();
      
      console.log('[Firebase] Initialization complete');
      
    } catch (error) {
      console.error('[Firebase] Initialization error:', error);
      this.initComplete = true;
    }
  }
  
  async initLocalDb() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('EverWorkFirebase', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.localDb = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        if (!db.objectStoreNames.contains('jobs')) {
          db.createObjectStore('jobs', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('sessions')) {
          db.createObjectStore('sessions', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('active_timer')) {
          db.createObjectStore('active_timer', { keyPath: 'userId' });
        }
        if (!db.objectStoreNames.contains('profile')) {
          db.createObjectStore('profile', { keyPath: 'userId' });
        }
        if (!db.objectStoreNames.contains('offline_queue')) {
          db.createObjectStore('offline_queue', { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  }
  
  // Calculate offset between local and server time
  async calculateServerTimeOffset() {
    try {
      const before = Date.now();
      const serverTime = firebase.firestore.Timestamp.now();
      const after = Date.now();
      
      // Estimate server time as midpoint of request
      const localTime = (before + after) / 2;
      this.serverTimeOffset = serverTime.toMillis() - localTime;
      
      console.log('[Firebase] Server time offset:', this.serverTimeOffset, 'ms');
    } catch (error) {
      console.warn('[Firebase] Could not calculate server time offset');
    }
  }
  
  // Get accurate timestamp
  getServerTimestamp() {
    return new Date(Date.now() + this.serverTimeOffset);
  }
  
  // ==================== AUTH METHODS ====================
  
  async signUp(email, password, displayName) {
    try {
      const { user } = await this.auth.createUserWithEmailAndPassword(email, password);
      
      // Update profile
      await user.updateProfile({ displayName });
      
      // Create user document in Firestore
      await this.db.collection('users').doc(user.uid).set({
        email,
        displayName: displayName || email.split('@')[0],
        dailyGoalHours: 8,
        currency: '$',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      return { success: true, user };
    } catch (error) {
      console.error('[Firebase] Signup error:', error);
      return { success: false, error: this.getAuthErrorMessage(error) };
    }
  }
  
  async signIn(email, password) {
    try {
      const { user } = await this.auth.signInWithEmailAndPassword(email, password);
      return { success: true, user };
    } catch (error) {
      console.error('[Firebase] Signin error:', error);
      return { success: false, error: this.getAuthErrorMessage(error) };
    }
  }
  
  async signOut() {
    try {
      await this.auth.signOut();
      await this.clearLocalData();
      return { success: true };
    } catch (error) {
      console.error('[Firebase] Signout error:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Sign in with Google
  async signInWithGoogle() {
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      
      // Set custom parameters for better UX
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const result = await this.auth.signInWithPopup(provider);
      const user = result.user;
      const isNewUser = result.additionalUserInfo?.isNewUser || false;
      
      // Create/update user profile in Firestore
      const profileRef = this.db.collection('users').doc(user.uid);
      const profileDoc = await profileRef.get();
      
      if (!profileDoc.exists) {
        // New user - create profile
        const profile = {
          email: user.email,
          displayName: user.displayName || user.email.split('@')[0],
          photoURL: user.photoURL || null,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
          dailyGoalHours: 8,
          currency: '$'
        };
        await profileRef.set(profile);
        console.log('[Firebase] New user profile created via Google:', user.email);
      } else {
        // Existing user - update last login
        await profileRef.update({
          lastLoginAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log('[Firebase] Existing user logged in via Google:', user.email);
      }
      
      // Clear guest mode if active
      localStorage.removeItem('everwork_guest_mode');
      localStorage.removeItem('everwork_offline_mode');
      localStorage.removeItem('everwork_guest_id');
      
      return { 
        success: true, 
        user,
        isNewUser
      };
    } catch (error) {
      console.error('[Firebase] Google sign in error:', error);
      
      // Handle specific error codes
      const errorMessages = {
        'auth/popup-closed-by-user': 'Sign in cancelled. Please try again.',
        'auth/popup-blocked': 'Popup was blocked. Please allow popups for this site.',
        'auth/cancelled-popup-request': 'Sign in cancelled.',
        'auth/account-exists-with-different-credential': 'An account already exists with this email using a different sign-in method.'
      };
      
      return { 
        success: false, 
        error: errorMessages[error.code] || error.message 
      };
    }
  }
  
  getCurrentUser() {
    return this.currentUser;
  }
  
  // Wait for auth to be initialized and return current user
  async waitForAuth(timeout = 10000) {
    // First ensure init is complete
    if (!this.initComplete && this.initPromise) {
      console.log('[Firebase] Waiting for initialization...');
      await this.initPromise;
    }
    
    return new Promise((resolve) => {
      // If auth is already determined (not undefined), return immediately
      if (this.currentUser !== undefined) {
        console.log('[Firebase] Auth resolved:', this.currentUser?.email || 'not logged in');
        resolve(this.currentUser);
        return;
      }
      
      // If no auth instance, return null
      if (!this.auth) {
        console.warn('[Firebase] Auth not available');
        resolve(null);
        return;
      }
      
      console.log('[Firebase] Waiting for auth state...');
      
      // Otherwise wait for auth state
      let resolved = false;
      
      const unsubscribe = this.auth.onAuthStateChanged((user) => {
        if (!resolved) {
          resolved = true;
          unsubscribe();
          this.currentUser = user;
          console.log('[Firebase] Auth state resolved:', user?.email || 'not logged in');
          resolve(user);
        }
      });
      
      // Timeout fallback
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          unsubscribe();
          console.warn('[Firebase] Auth wait timeout, current state:', this.currentUser?.email || 'not logged in');
          resolve(this.currentUser);
        }
      }, timeout);
    });
  }
  
  onAuthStateChanged(callback) {
    return this.auth.onAuthStateChanged(callback);
  }
  
  getAuthErrorMessage(error) {
    const messages = {
      'auth/email-already-in-use': 'Email already registered',
      'auth/invalid-email': 'Invalid email address',
      'auth/weak-password': 'Password should be at least 6 characters',
      'auth/user-not-found': 'No account found with this email',
      'auth/wrong-password': 'Incorrect password',
      'auth/invalid-credential': 'Invalid email or password',
      'auth/network-request-failed': 'Network error. Please try again.'
    };
    return messages[error.code] || error.message;
  }
  
  // ==================== PROFILE METHODS ====================
  
  async getProfile() {
    if (this.currentUser === null) return null;
    if (this.currentUser === undefined) {
      console.warn('[Firebase] getProfile called before auth initialized');
      await this.waitForAuth(5000);
      if (!this.currentUser) return null;
    }
    
    try {
      const doc = await this.db.collection('users').doc(this.currentUser.uid).get();
      
      if (doc.exists) {
        const data = { userId: doc.id, ...doc.data() };
        await this.saveToLocal('profile', data);
        return data;
      }
      
      return null;
    } catch (error) {
      console.error('[Firebase] Get profile error:', error);
      return await this.getFromLocal('profile', this.currentUser.uid);
    }
  }
  
  async updateProfile(updates) {
    if (!this.currentUser) {
      if (this.currentUser === undefined) await this.waitForAuth(5000);
      if (!this.currentUser) return { success: false, error: 'Not authenticated' };
    }
    
    try {
      updates.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
      
      // Use set with merge to create document if it doesn't exist
      await this.db.collection('users').doc(this.currentUser.uid)
        .set(updates, { merge: true });
      
      const profile = await this.getProfile();
      return { success: true, profile };
    } catch (error) {
      console.error('[Firebase] Update profile error:', error);
      
      // Queue for later
      await this.addToOfflineQueue('update_profile', updates);
      
      // Update local
      const localProfile = await this.getFromLocal('profile', this.currentUser.uid);
      if (localProfile) {
        Object.assign(localProfile, updates);
        await this.saveToLocal('profile', localProfile);
      }
      
      return { success: true, offline: true };
    }
  }
  
  // ==================== JOB METHODS ====================
  
  normalizeJob(job) {
    // Provide both camelCase and snake_case for backward compatibility
    return {
      id: job.id,
      // CamelCase (Firebase native)
      name: job.name,
      color: job.color,
      icon: job.icon,
      hourlyRate: job.hourlyRate,
      isArchived: job.isArchived,
      totalHoursAccumulated: job.totalHoursAccumulated,
      // Snake_case (legacy compatibility)
      hourly_rate: job.hourlyRate,
      total_hours_accumulated: job.totalHoursAccumulated,
      // Other fields
      createdAt: job.createdAt,
      updatedAt: job.updatedAt
    };
  }
  
  async getJobs(includeArchived = false) {
    if (this.currentUser === null) return [];  // Only return empty if explicitly signed out
    if (this.currentUser === undefined) {
      console.warn('[Firebase] getJobs called before auth initialized');
      // Try to wait for auth
      await this.waitForAuth(5000);
      if (!this.currentUser) return [];
    }
    
    try {
      // Fetch all jobs without filtering to avoid composite index requirement
      const snapshot = await this.db.collection('users').doc(this.currentUser.uid)
        .collection('jobs').get();
      
      let jobs = snapshot.docs.map(doc => this.normalizeJob({ id: doc.id, ...doc.data() }));
      
      // Filter archived jobs locally
      if (!includeArchived) {
        jobs = jobs.filter(job => !job.isArchived);
      }
      
      // Cache locally (store normalized)
      for (const job of jobs) {
        await this.saveToLocal('jobs', job);
      }
      
      return jobs;
    } catch (error) {
      console.error('[Firebase] Get jobs error:', error);
      // Fallback to local cache
      let localJobs = await this.getAllFromLocal('jobs');
      // Normalize any non-normalized jobs
      localJobs = localJobs.map(j => j.hourly_rate ? j : this.normalizeJob(j));
      return includeArchived ? localJobs : localJobs.filter(job => !job.isArchived);
    }
  }
  
  async createJob(jobData) {
    if (!this.currentUser) {
      if (this.currentUser === undefined) await this.waitForAuth(5000);
      if (!this.currentUser) return { success: false, error: 'Not authenticated' };
    }
    
    try {
      const job = {
        name: jobData.name,
        color: jobData.color,
        hourlyRate: jobData.hourlyRate || null,
        icon: jobData.icon || 'briefcase',
        isArchived: false,
        totalHoursAccumulated: 0,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      const docRef = await this.db.collection('users').doc(this.currentUser.uid)
        .collection('jobs').add(job);
      
      const newJob = { id: docRef.id, ...job };
      await this.saveToLocal('jobs', newJob);
      
      return { success: true, job: newJob };
    } catch (error) {
      console.error('[Firebase] Create job error:', error);
      return { success: false, error: error.message };
    }
  }
  
  async updateJob(jobId, updates) {
    if (!this.currentUser) {
      if (this.currentUser === undefined) await this.waitForAuth(5000);
      if (!this.currentUser) return { success: false, error: 'Not authenticated' };
    }
    
    try {
      updates.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
      
      await this.db.collection('users').doc(this.currentUser.uid)
        .collection('jobs').doc(jobId).update(updates);
      
      const localJob = await this.getFromLocal('jobs', jobId);
      if (localJob) {
        Object.assign(localJob, updates);
        await this.saveToLocal('jobs', localJob);
      }
      
      return { success: true };
    } catch (error) {
      console.error('[Firebase] Update job error:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Get a single job by ID
  async getJobById(jobId, forceRefresh = false) {
    if (!this.currentUser) {
      if (this.currentUser === undefined) await this.waitForAuth(5000);
      if (!this.currentUser) return null;
    }
    
    // Normalize jobId (trim whitespace)
    jobId = String(jobId).trim();
    
    try {
      // Try to get from local cache first (unless force refresh)
      if (!forceRefresh) {
        const localJob = await this.getFromLocal('jobs', jobId);
        if (localJob) {
          console.log('[Firebase] Found job in local cache:', jobId);
          return this.normalizeJob(localJob);
        }
      }
      
      // Fetch from Firebase
      console.log('[Firebase] Fetching job from Firebase:', jobId);
      const doc = await this.db.collection('users').doc(this.currentUser.uid)
        .collection('jobs').doc(jobId).get();
      
      if (doc.exists) {
        const jobData = doc.data();
        console.log('[Firebase] Job found in Firebase:', jobId, jobData);
        const job = this.normalizeJob({ id: doc.id, ...jobData });
        // Cache it
        await this.saveToLocal('jobs', job);
        return job;
      }
      
      console.warn('[Firebase] Job not found:', jobId);
      return null;
    } catch (error) {
      console.error('[Firebase] Get job by ID error:', error);
      return null;
    }
  }
  
  async archiveJob(jobId) {
    return await this.updateJob(jobId, { isArchived: true });
  }
  
  async deleteJob(jobId) {
    if (!this.currentUser) {
      if (this.currentUser === undefined) await this.waitForAuth(5000);
      if (!this.currentUser) return { success: false, error: 'Not authenticated' };
    }
    
    try {
      // Delete from Firestore
      await this.db.collection('users').doc(this.currentUser.uid)
        .collection('jobs').doc(jobId).delete();
      
      // Delete from local cache
      await this.deleteFromLocal('jobs', jobId);
      
      // Also delete all sessions for this job
      const sessionsSnapshot = await this.db.collection('users').doc(this.currentUser.uid)
        .collection('sessions').where('jobId', '==', jobId).get();
      
      const batch = this.db.batch();
      sessionsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      
      // Delete sessions from local cache
      const localSessions = await this.getAllFromLocal('sessions');
      for (const session of localSessions) {
        if (session.jobId === jobId) {
          await this.deleteFromLocal('sessions', session.id);
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error('[Firebase] Delete job error:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ==================== SESSION METHODS ====================
  
  normalizeSession(session) {
    // Provide both camelCase and snake_case for backward compatibility
    return {
      id: session.id,
      // CamelCase (Firebase native)
      jobId: session.jobId,
      startTime: session.startTime,
      endTime: session.endTime,
      durationSeconds: session.durationSeconds,
      // Snake_case (legacy compatibility)
      job_id: session.jobId,
      start_time: session.startTime,
      end_time: session.endTime,
      duration_seconds: session.durationSeconds,
      // Additional aliases
      duration: session.durationSeconds,
      // Other fields
      date: session.date,
      note: session.note,
      earnings: session.earnings,
      isManuallyEdited: session.isManuallyEdited,
      createdAt: session.createdAt,
      editedAt: session.editedAt
    };
  }
  
  async getSessions(filters = {}, forceRefresh = false) {
    if (this.currentUser === null) return [];  // Only return empty if explicitly signed out
    if (this.currentUser === undefined) {
      console.warn('[Firebase] getSessions called before auth initialized');
      // Try to wait for auth
      await this.waitForAuth(5000);
      if (!this.currentUser) return [];
    }
    
    try {
      let query = this.db.collection('users').doc(this.currentUser.uid)
        .collection('sessions');
      
      // Get options - force server fetch if refresh requested
      const getOptions = forceRefresh ? { source: 'server' } : {};
      
      if (filters.date) {
        // For date filtering, we need to avoid composite index requirement
        // Fetch all and filter in memory
        console.log('[Firebase] Fetching sessions, forceRefresh:', forceRefresh);
        const snapshot = await query.get(getOptions);
        let sessions = snapshot.docs
          .map(doc => this.normalizeSession({ id: doc.id, ...doc.data() }))
          .filter(s => s.date === filters.date)
          .sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
        
        console.log('[Firebase] Found', sessions.length, 'sessions for date', filters.date);
        
        // Cache locally (store normalized)
        for (const session of sessions) {
          await this.saveToLocal('sessions', session);
        }
        
        return sessions;
      }
      
      // No date filter - can use orderBy
      query = query.orderBy('startTime', 'desc');
      
      const snapshot = await query.get(getOptions);
      const sessions = snapshot.docs.map(doc => this.normalizeSession({ id: doc.id, ...doc.data() }));
      
      // Cache locally
      for (const session of sessions) {
        await this.saveToLocal('sessions', session);
      }
      
      return sessions;
    } catch (error) {
      console.error('[Firebase] Get sessions error:', error);
      
      // Fallback to local
      let sessions = await this.getAllFromLocal('sessions');
      // Normalize any non-normalized sessions
      sessions = sessions.map(s => s.job_id ? s : this.normalizeSession(s));
      if (filters.date) {
        sessions = sessions.filter(s => s.date === filters.date);
      }
      // Sort by startTime desc
      sessions.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
      return sessions;
    }
  }
  
  async createSession(sessionData) {
    if (!this.currentUser) {
      if (this.currentUser === undefined) await this.waitForAuth(5000);
      if (!this.currentUser) return { success: false, error: 'Not authenticated' };
    }
    
    try {
      const session = {
        jobId: sessionData.jobId,
        startTime: sessionData.startTime,
        endTime: sessionData.endTime || null,
        durationSeconds: sessionData.duration || 0,
        date: sessionData.date,
        note: sessionData.note || '',
        earnings: sessionData.earnings || 0,
        isManuallyEdited: false,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      const docRef = await this.db.collection('users').doc(this.currentUser.uid)
        .collection('sessions').add(session);
      
      const newSession = { id: docRef.id, ...session };
      await this.saveToLocal('sessions', newSession);
      
      return { success: true, session: newSession };
    } catch (error) {
      console.error('[Firebase] Create session error:', error);
      return { success: false, error: error.message };
    }
  }
  
  async updateSession(sessionId, updates) {
    if (!this.currentUser) {
      if (this.currentUser === undefined) await this.waitForAuth(5000);
      if (!this.currentUser) return { success: false, error: 'Not authenticated' };
    }
    
    try {
      updates.isManuallyEdited = true;
      updates.editedAt = firebase.firestore.FieldValue.serverTimestamp();
      
      await this.db.collection('users').doc(this.currentUser.uid)
        .collection('sessions').doc(sessionId).update(updates);
      
      const localSession = await this.getFromLocal('sessions', sessionId);
      if (localSession) {
        Object.assign(localSession, updates);
        await this.saveToLocal('sessions', localSession);
      }
      
      return { success: true };
    } catch (error) {
      console.error('[Firebase] Update session error:', error);
      return { success: false, error: error.message };
    }
  }
  
  async deleteSession(sessionId) {
    if (!this.currentUser) {
      if (this.currentUser === undefined) await this.waitForAuth(5000);
      if (!this.currentUser) return { success: false, error: 'Not authenticated' };
    }
    
    try {
      await this.db.collection('users').doc(this.currentUser.uid)
        .collection('sessions').doc(sessionId).delete();
      
      await this.deleteFromLocal('sessions', sessionId);
      
      return { success: true };
    } catch (error) {
      console.error('[Firebase] Delete session error:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ==================== ACTIVE TIMER METHODS ====================
  
  async startTimer(jobId, note = '') {
    if (!this.currentUser) {
      if (this.currentUser === undefined) await this.waitForAuth(5000);
      if (!this.currentUser) return { success: false, error: 'Not authenticated' };
    }
    
    // Prevent concurrent timer starts using lock
    const lockKey = `everwork_timer_lock_${this.currentUser.uid}`;
    if (localStorage.getItem(lockKey)) {
      console.warn('[Firebase] Timer start already in progress');
      return { success: false, error: 'Timer operation in progress. Please wait.' };
    }
    
    // Set lock with 5-second timeout
    localStorage.setItem(lockKey, Date.now().toString());
    const releaseLock = () => localStorage.removeItem(lockKey);
    
    try {
      // STEP 1: Delete ALL existing active timers for this user
      console.log('[Firebase] Cleaning up any existing timers...');
      const existingTimers = await this.db.collection('users').doc(this.currentUser.uid)
        .collection('activeTimers').get();
      
      const deletePromises = existingTimers.docs.map(doc => {
        console.log('[Firebase] Deleting old timer:', doc.id);
        return doc.ref.delete();
      });
      await Promise.all(deletePromises);
      
      // STEP 2: Clear local cache
      await this.deleteFromLocal('active_timer', this.currentUser.uid);
      
      // STEP 3: Create new session with FRESH timestamp
      const now = new Date();
      const serverTimeStr = now.toISOString();
      const today = serverTimeStr.split('T')[0];
      
      console.log('[Firebase] Starting new timer at:', serverTimeStr);
      
      const sessionResult = await this.createSession({
        jobId,
        startTime: serverTimeStr,
        endTime: null,
        duration: 0,
        date: today,
        note,
        earnings: 0
      });
      
      if (!sessionResult.success) {
        throw new Error(sessionResult.error);
      }
      
      // STEP 4: Create active timer with ONLY the essential data
      const timer = {
        jobId,
        sessionId: sessionResult.session.id,
        serverStartTime: serverTimeStr,  // ISO string for consistency
        note: note || '',
        isRunning: true,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      const docRef = await this.db.collection('users').doc(this.currentUser.uid)
        .collection('activeTimers').add(timer);
      
      const activeTimer = { id: docRef.id, ...timer };
      
      // STEP 5: Save to local cache
      await this.saveToLocal('active_timer', {
        ...activeTimer,
        userId: this.currentUser.uid
      });
      
      console.log('[Firebase] Timer started:', activeTimer.id, 'at', serverTimeStr);
      
      releaseLock();
      return { success: true, timer: activeTimer, session: sessionResult.session };
    } catch (error) {
      console.error('[Firebase] Start timer error:', error);
      releaseLock();
      return { success: false, error: error.message };
    }
  }
  
  async stopTimer(timerId, sessionId) {
    if (!this.currentUser) {
      if (this.currentUser === undefined) await this.waitForAuth(5000);
      if (!this.currentUser) return { success: false, error: 'Not authenticated' };
    }
    
    try {
      // Use current local time (simpler and consistent)
      const endTime = new Date();
      
      // Get timer
      const timerDoc = await this.db.collection('users').doc(this.currentUser.uid)
        .collection('activeTimers').doc(timerId).get();
      
      if (!timerDoc.exists) {
        throw new Error('Timer not found');
      }
      
      const timer = timerDoc.data();
      
      // Parse startTime - should be ISO string stored by startTimer
      let startTime;
      if (timer.serverStartTime) {
        startTime = new Date(timer.serverStartTime);
      } else {
        throw new Error('Timer missing serverStartTime');
      }
      
      // Validate start time
      if (isNaN(startTime.getTime())) {
        throw new Error('Invalid start time: ' + timer.serverStartTime);
      }
      
      // Calculate duration with comprehensive safeguards
      let durationMs = endTime.getTime() - startTime.getTime();
      
      // SAFETY CHECK 1: Negative duration (clock skew)
      if (durationMs < 0) {
        console.warn('[Firebase] Negative duration detected (clock skew), using 0');
        durationMs = 0;
      }
      
      // SAFETY CHECK 2: Impossible future duration (> 1 year ahead)
      if (durationMs > 365 * 24 * 60 * 60 * 1000) {
        console.error('[Firebase] Impossible duration (> 1 year), data corruption suspected');
        durationMs = 0;
      }
      
      let durationSeconds = Math.floor(durationMs / 1000);
      
      // SAFETY CHECK 3: Warn on very long sessions (> 24 hours)
      const ONE_DAY = 24 * 60 * 60;
      if (durationSeconds > ONE_DAY) {
        console.warn('[Firebase] Very long session:', Math.floor(durationSeconds / 3600), 'hours');
      }
      
      // SAFETY CHECK 4: Hard cap at 30 days (prevents overflow/display issues)
      const MAX_DURATION = 30 * 24 * 60 * 60;
      if (durationSeconds > MAX_DURATION) {
        console.error('[Firebase] Duration capped at 30 days');
        durationSeconds = MAX_DURATION;
      }
      
      console.log('[Firebase] Stopping timer:', {
        timerId,
        sessionId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        durationSeconds,
        durationMinutes: Math.floor(durationSeconds / 60)
      });
      
      // Check midnight crossing - only split if actually different days
      const startDay = startTime.toISOString().split('T')[0];
      const endDay = endTime.toISOString().split('T')[0];
      
      if (startDay !== endDay && CONFIG.MIDNIGHT_SPLIT_ENABLED) {
        console.log('[Firebase] Midnight crossing detected, splitting session');
        
        // Split at midnight
        const midnight = new Date(startDay + 'T23:59:59.999Z');
        const day1Duration = Math.floor((midnight.getTime() - startTime.getTime()) / 1000) + 1;
        const day2Duration = durationSeconds - day1Duration;
        
        console.log('[Firebase] Split durations:', { day1Duration, day2Duration });
        
        // Update first session
        await this.updateSession(sessionId, {
          endTime: midnight.toISOString(),
          durationSeconds: Math.max(0, day1Duration)
        });
        
        // Create second session
        if (day2Duration > 0) {
          await this.createSession({
            jobId: timer.jobId,
            startTime: new Date(endDay + 'T00:00:00Z').toISOString(),
            endTime: endTime.toISOString(),
            duration: day2Duration,
            date: endDay,
            note: timer.note || '',
            earnings: 0
          });
        }
      } else {
        // Single session - simple update
        console.log('[Firebase] Single session update:', { sessionId, durationSeconds });
        await this.updateSession(sessionId, {
          endTime: endTime.toISOString(),
          durationSeconds: Math.max(0, durationSeconds)
        });
      }
      
      // Delete active timer
      await this.db.collection('users').doc(this.currentUser.uid)
        .collection('activeTimers').doc(timerId).delete();
      
      await this.deleteFromLocal('active_timer', this.currentUser.uid);
      
      // Dispatch event to refresh UI immediately
      window.dispatchEvent(new CustomEvent('db-change', {
        detail: { table: 'sessions', type: 'modified', data: { id: sessionId } }
      }));
      
      // Also dispatch storage event for cross-tab communication
      localStorage.setItem('everwork_last_session_update', Date.now().toString());
      
      return { success: true, duration: durationSeconds };
    } catch (error) {
      console.error('[Firebase] Stop timer error:', error);
      return { success: false, error: error.message };
    }
  }
  
  async getActiveTimer() {
    if (this.currentUser === null) return null;
    if (this.currentUser === undefined) {
      await this.waitForAuth(5000);
      if (!this.currentUser) return null;
    }
    
    try {
      const snapshot = await this.db.collection('users').doc(this.currentUser.uid)
        .collection('activeTimers').where('isRunning', '==', true).get();
      
      if (snapshot.empty) return null;
      
      const doc = snapshot.docs[0];
      const timer = { id: doc.id, ...doc.data() };
      
      // Cache locally
      await this.saveToLocal('active_timer', { ...timer, userId: this.currentUser.uid });
      
      return timer;
    } catch (error) {
      console.error('[Firebase] Get active timer error:', error);
      
      // Fallback to local
      const localTimer = await this.getFromLocal('active_timer', this.currentUser.uid);
      return localTimer || null;
    }
  }
  
  async getElapsedTime(timerId) {
    try {
      const serverTime = this.getServerTimestamp();
      const timer = await this.getActiveTimer();
      
      if (!timer) return 0;
      
      const startTime = timer.serverStartTime.toDate ? 
        timer.serverStartTime.toDate() : 
        new Date(timer.serverStartTime);
      
      return Math.floor((serverTime - startTime) / 1000);
    } catch (error) {
      console.error('[Firebase] Get elapsed time error:', error);
      return 0;
    }
  }
  
  // ==================== REAL-TIME SUBSCRIPTIONS ====================
  
  subscribeToRealtime() {
    if (!this.currentUser) {
      if (this.currentUser === undefined) {
        // Wait for auth and retry
        this.waitForAuth(5000).then(() => {
          if (this.currentUser) this.subscribeToRealtime();
        });
      }
      return;
    }
    
    // Subscribe to jobs
    const jobsUnsub = this.db.collection('users').doc(this.currentUser.uid)
      .collection('jobs')
      .onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
          const job = { id: change.doc.id, ...change.doc.data() };
          
          if (change.type === 'added' || change.type === 'modified') {
            this.saveToLocal('jobs', job);
          } else if (change.type === 'removed') {
            this.deleteFromLocal('jobs', change.doc.id);
          }
          
          // Dispatch event
          window.dispatchEvent(new CustomEvent('db-change', {
            detail: { table: 'jobs', type: change.type, data: job }
          }));
        });
      });
    
    this.unsubscribers.push(jobsUnsub);
    
    // Subscribe to sessions
    const sessionsUnsub = this.db.collection('users').doc(this.currentUser.uid)
      .collection('sessions')
      .onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
          const session = { id: change.doc.id, ...change.doc.data() };
          
          if (change.type === 'added' || change.type === 'modified') {
            this.saveToLocal('sessions', session);
          } else if (change.type === 'removed') {
            this.deleteFromLocal('sessions', change.doc.id);
          }
          
          window.dispatchEvent(new CustomEvent('db-change', {
            detail: { table: 'sessions', type: change.type, data: session }
          }));
        });
      });
    
    this.unsubscribers.push(sessionsUnsub);
  }
  
  unsubscribeAll() {
    for (const unsub of this.unsubscribers) {
      unsub();
    }
    this.unsubscribers = [];
  }
  
  // ==================== SYNC METHODS ====================
  
  handleOnline() {
    this.isOnline = true;
    showToast('Back online', 'success');
    this.syncOfflineQueue();
  }
  
  handleOffline() {
    this.isOnline = false;
    showToast('Offline mode', 'warning');
  }
  
  async fullSync() {
    if (this.currentUser === null) return;
    if (this.currentUser === undefined) {
      await this.waitForAuth(5000);
      if (!this.currentUser) return;
    }
    
    try {
      // Sync jobs
      await this.getJobs(true);
      
      // Sync recent sessions
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      
      const snapshot = await this.db.collection('users').doc(this.currentUser.uid)
        .collection('sessions')
        .where('createdAt', '>=', firebase.firestore.Timestamp.fromDate(ninetyDaysAgo))
        .get();
      
      for (const doc of snapshot.docs) {
        await this.saveToLocal('sessions', { id: doc.id, ...doc.data() });
      }
      
      // Sync profile
      await this.getProfile();
      
      console.log('[Firebase] Full sync complete');
    } catch (error) {
      console.error('[Firebase] Full sync error:', error);
    }
  }
  
  async addToOfflineQueue(action, data) {
    const item = { action, data, timestamp: Date.now(), retryCount: 0 };
    this.offlineQueue.push(item);
    
    const tx = this.localDb.transaction('offline_queue', 'readwrite');
    const store = tx.objectStore('offline_queue');
    await store.add(item);
  }
  
  async loadOfflineQueue() {
    return new Promise((resolve) => {
      const tx = this.localDb.transaction('offline_queue', 'readonly');
      const store = tx.objectStore('offline_queue');
      const req = store.getAll();
      
      req.onsuccess = () => {
        this.offlineQueue = req.result || [];
        resolve();
      };
      req.onerror = () => {
        this.offlineQueue = [];
        resolve();
      };
    });
  }
  
  async syncOfflineQueue() {
    if (!this.isOnline || !this.currentUser || this.syncInProgress || this.offlineQueue.length === 0) {
      return;
    }
    
    this.syncInProgress = true;
    
    try {
      const failed = [];
      
      for (const item of this.offlineQueue) {
        try {
          let result;
          
          switch (item.action) {
            case 'create_job':
              result = await this.createJob(item.data);
              break;
            case 'update_profile':
              result = await this.updateProfile(item.data);
              break;
            default:
              continue;
          }
          
          if (!result.success) {
            item.retryCount++;
            if (item.retryCount < 3) failed.push(item);
          }
        } catch (error) {
          item.retryCount++;
          if (item.retryCount < 3) failed.push(item);
        }
      }
      
      this.offlineQueue = failed;
      
      // Clear and re-save failed items
      const tx = this.localDb.transaction('offline_queue', 'readwrite');
      const store = tx.objectStore('offline_queue');
      await store.clear();
      
      for (const item of failed) {
        await store.add(item);
      }
    } catch (error) {
      console.error('[Firebase] Sync queue error:', error);
    } finally {
      this.syncInProgress = false;
    }
  }
  
  // ==================== LOCAL STORAGE HELPERS ====================
  
  saveToLocal(storeName, data) {
    return new Promise((resolve, reject) => {
      const tx = this.localDb.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(data);
      
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
  
  getFromLocal(storeName, id) {
    return new Promise((resolve) => {
      const tx = this.localDb.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(id);
      
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    });
  }
  
  getAllFromLocal(storeName) {
    return new Promise((resolve) => {
      const tx = this.localDb.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  }
  
  deleteFromLocal(storeName, id) {
    return new Promise((resolve) => {
      const tx = this.localDb.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(id);
      
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  }
  
  async clearLocalData() {
    const stores = ['jobs', 'sessions', 'active_timer', 'profile', 'offline_queue'];
    
    for (const storeName of stores) {
      const tx = this.localDb.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      await store.clear();
    }
  }
  
  /**
   * Clear ALL user data from Firestore and local storage
   */
  async clearAllUserData() {
    if (!this.currentUser) {
      throw new Error('Not authenticated');
    }
    
    const userId = this.currentUser.uid;
    const batch = this.db.batch();
    
    // Delete all jobs
    const jobsSnapshot = await this.db.collection('users').doc(userId).collection('jobs').get();
    jobsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
    
    // Delete all sessions
    const sessionsSnapshot = await this.db.collection('users').doc(userId).collection('sessions').get();
    sessionsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
    
    // Delete all active timers
    const timersSnapshot = await this.db.collection('users').doc(userId).collection('activeTimers').get();
    timersSnapshot.docs.forEach(doc => batch.delete(doc.ref));
    
    // Delete profile and settings
    const profileSnapshot = await this.db.collection('users').doc(userId).collection('profile').get();
    profileSnapshot.docs.forEach(doc => batch.delete(doc.ref));
    
    const settingsSnapshot = await this.db.collection('users').doc(userId).collection('settings').get();
    settingsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
    
    // Commit all deletes
    await batch.commit();
    
    // Clear local data too
    await this.clearLocalData();
    
    return { success: true };
  }
}

// Create global instance
const dbService = new FirebaseService();

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FirebaseService, dbService };
}
