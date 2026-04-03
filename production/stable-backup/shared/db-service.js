/**
 * Ever Work - Database Service
 * Handles Supabase connection, offline sync, and real-time updates
 */

class DatabaseService {
  constructor() {
    this.supabase = null;
    this.isOnline = navigator.onLine;
    this.syncInProgress = false;
    this.offlineQueue = [];
    this.subscriptions = [];
    this.currentUser = null;
    
    // Local IndexedDB for offline storage
    this.localDb = null;
    
    // Initialize
    this.init();
  }
  
  async init() {
    // Check if Supabase client is available
    if (typeof supabase === 'undefined') {
      console.error('Supabase client not loaded');
      return;
    }
    
    // Initialize Supabase
    this.supabase = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
    
    // Initialize local IndexedDB
    await this.initLocalDb();
    
    // Setup online/offline listeners
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
    
    // Load offline queue from storage
    await this.loadOfflineQueue();
    
    // Start periodic sync if online
    if (this.isOnline) {
      this.startPeriodicSync();
    }
  }
  
  async initLocalDb() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('EverWorkLocal', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.localDb = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Store for jobs
        if (!db.objectStoreNames.contains('jobs')) {
          const jobStore = db.createObjectStore('jobs', { keyPath: 'id' });
          jobStore.createIndex('user_id', 'user_id', { unique: false });
          jobStore.createIndex('is_archived', 'is_archived', { unique: false });
        }
        
        // Store for sessions
        if (!db.objectStoreNames.contains('sessions')) {
          const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
          sessionStore.createIndex('user_id', 'user_id', { unique: false });
          sessionStore.createIndex('job_id', 'job_id', { unique: false });
          sessionStore.createIndex('date', 'date', { unique: false });
        }
        
        // Store for active timer
        if (!db.objectStoreNames.contains('active_timer')) {
          db.createObjectStore('active_timer', { keyPath: 'user_id' });
        }
        
        // Store for offline queue
        if (!db.objectStoreNames.contains('offline_queue')) {
          db.createObjectStore('offline_queue', { keyPath: 'id', autoIncrement: true });
        }
        
        // Store for user profile
        if (!db.objectStoreNames.contains('profile')) {
          db.createObjectStore('profile', { keyPath: 'id' });
        }
        
        // Store for sync state
        if (!db.objectStoreNames.contains('sync_state')) {
          db.createObjectStore('sync_state', { keyPath: 'key' });
        }
      };
    });
  }
  
  // ==================== AUTH METHODS ====================
  
  async signUp(email, password, displayName) {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName }
        }
      });
      
      if (error) throw error;
      
      this.currentUser = data.user;
      return { success: true, user: data.user };
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: error.message };
    }
  }
  
  async signIn(email, password) {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      this.currentUser = data.user;
      
      // Sync local data with server
      await this.fullSync();
      
      // Subscribe to real-time updates
      this.subscribeToRealtime();
      
      return { success: true, user: data.user };
    } catch (error) {
      console.error('Signin error:', error);
      return { success: false, error: error.message };
    }
  }
  
  async signOut() {
    try {
      await this.supabase.auth.signOut();
      this.currentUser = null;
      
      // Unsubscribe from real-time
      this.unsubscribeAll();
      
      // Clear local data
      await this.clearLocalData();
      
      return { success: true };
    } catch (error) {
      console.error('Signout error:', error);
      return { success: false, error: error.message };
    }
  }
  
  async getCurrentUser() {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      this.currentUser = user;
      return user;
    } catch (error) {
      return null;
    }
  }
  
  async getSession() {
    try {
      const { data: { session } } = await this.supabase.auth.getSession();
      return session;
    } catch (error) {
      return null;
    }
  }
  
  onAuthStateChange(callback) {
    return this.supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        this.currentUser = session.user;
        this.fullSync();
        this.subscribeToRealtime();
      } else if (event === 'SIGNED_OUT') {
        this.currentUser = null;
        this.unsubscribeAll();
      }
      callback(event, session);
    });
  }
  
  // ==================== SERVER TIME ====================
  
  async getServerTime() {
    try {
      // Try to get server time from Supabase
      const { data, error } = await this.supabase.rpc('get_server_time');
      if (error) throw error;
      return new Date(data);
    } catch (error) {
      // Fallback to local time with offset correction
      console.warn('Using local time, server time unavailable:', error);
      return new Date();
    }
  }
  
  // ==================== PROFILE METHODS ====================
  
  async getProfile() {
    if (!this.currentUser) return null;
    
    try {
      // Try server first
      if (this.isOnline) {
        const { data, error } = await this.supabase
          .from('profiles')
          .select('*')
          .eq('id', this.currentUser.id)
          .single();
        
        if (!error && data) {
          await this.saveToLocal('profile', data);
          return data;
        }
      }
      
      // Fallback to local
      return await this.getFromLocal('profile', this.currentUser.id);
    } catch (error) {
      console.error('Get profile error:', error);
      return await this.getFromLocal('profile', this.currentUser.id);
    }
  }
  
  async updateProfile(updates) {
    if (!this.currentUser) return { success: false, error: 'Not authenticated' };
    
    try {
      if (this.isOnline) {
        const { data, error } = await this.supabase
          .from('profiles')
          .update(updates)
          .eq('id', this.currentUser.id)
          .select()
          .single();
        
        if (error) throw error;
        
        await this.saveToLocal('profile', data);
        return { success: true, profile: data };
      } else {
        // Queue for later
        await this.addToOfflineQueue('update_profile', { updates });
        
        // Update local
        const localProfile = await this.getFromLocal('profile', this.currentUser.id);
        if (localProfile) {
          Object.assign(localProfile, updates);
          await this.saveToLocal('profile', localProfile);
        }
        
        return { success: true, offline: true };
      }
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ==================== JOB METHODS ====================
  
  async getJobs(includeArchived = false) {
    if (!this.currentUser) return [];
    
    try {
      if (this.isOnline) {
        let query = this.supabase
          .from('jobs')
          .select('*')
          .eq('user_id', this.currentUser.id)
          .order('created_at', { ascending: true });
        
        if (!includeArchived) {
          query = query.eq('is_archived', false);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        // Update local cache
        for (const job of data || []) {
          await this.saveToLocal('jobs', job);
        }
        
        return data || [];
      } else {
        // Get from local
        return await this.getAllFromLocal('jobs');
      }
    } catch (error) {
      console.error('Get jobs error:', error);
      return await this.getAllFromLocal('jobs');
    }
  }
  
  async createJob(jobData) {
    if (!this.currentUser) return { success: false, error: 'Not authenticated' };
    
    const job = {
      user_id: this.currentUser.id,
      name: jobData.name,
      color: jobData.color,
      hourly_rate: jobData.hourlyRate || null,
      icon: jobData.icon || 'briefcase',
      is_archived: false,
      total_hours_accumulated: 0
    };
    
    try {
      if (this.isOnline) {
        const { data, error } = await this.supabase
          .from('jobs')
          .insert(job)
          .select()
          .single();
        
        if (error) throw error;
        
        await this.saveToLocal('jobs', data);
        return { success: true, job: data };
      } else {
        // Generate local ID and save
        job.id = this.generateUUID();
        job.created_at = new Date().toISOString();
        job.updated_at = job.created_at;
        
        await this.saveToLocal('jobs', job);
        await this.addToOfflineQueue('create_job', job);
        
        return { success: true, job, offline: true };
      }
    } catch (error) {
      console.error('Create job error:', error);
      return { success: false, error: error.message };
    }
  }
  
  async updateJob(jobId, updates) {
    if (!this.currentUser) return { success: false, error: 'Not authenticated' };
    
    try {
      if (this.isOnline) {
        const { data, error } = await this.supabase
          .from('jobs')
          .update(updates)
          .eq('id', jobId)
          .eq('user_id', this.currentUser.id)
          .select()
          .single();
        
        if (error) throw error;
        
        await this.saveToLocal('jobs', data);
        return { success: true, job: data };
      } else {
        // Update local
        const localJob = await this.getFromLocal('jobs', jobId);
        if (localJob) {
          Object.assign(localJob, updates);
          localJob.updated_at = new Date().toISOString();
          await this.saveToLocal('jobs', localJob);
        }
        
        await this.addToOfflineQueue('update_job', { id: jobId, updates });
        return { success: true, offline: true };
      }
    } catch (error) {
      console.error('Update job error:', error);
      return { success: false, error: error.message };
    }
  }
  
  async archiveJob(jobId) {
    return await this.updateJob(jobId, { is_archived: true });
  }
  
  // ==================== SESSION METHODS ====================
  
  async getSessions(filters = {}) {
    if (!this.currentUser) return [];
    
    try {
      if (this.isOnline) {
        let query = this.supabase
          .from('sessions')
          .select('*')
          .eq('user_id', this.currentUser.id);
        
        if (filters.date) {
          query = query.eq('date', filters.date);
        }
        if (filters.jobId) {
          query = query.eq('job_id', filters.jobId);
        }
        if (filters.startDate && filters.endDate) {
          query = query.gte('date', filters.startDate).lte('date', filters.endDate);
        }
        
        query = query.order('start_time', { ascending: false });
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        // Update local cache
        for (const session of data || []) {
          await this.saveToLocal('sessions', session);
        }
        
        return data || [];
      } else {
        // Get from local with filters
        let sessions = await this.getAllFromLocal('sessions');
        
        if (filters.date) {
          sessions = sessions.filter(s => s.date === filters.date);
        }
        if (filters.jobId) {
          sessions = sessions.filter(s => s.job_id === filters.jobId);
        }
        
        return sessions.sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
      }
    } catch (error) {
      console.error('Get sessions error:', error);
      return await this.getAllFromLocal('sessions');
    }
  }
  
  async createSession(sessionData) {
    if (!this.currentUser) return { success: false, error: 'Not authenticated' };
    
    try {
      if (this.isOnline) {
        const { data, error } = await this.supabase
          .from('sessions')
          .insert({
            user_id: this.currentUser.id,
            job_id: sessionData.jobId,
            start_time: sessionData.startTime,
            end_time: sessionData.endTime,
            duration_seconds: sessionData.duration,
            date: sessionData.date,
            note: sessionData.note || '',
            earnings: sessionData.earnings || 0
          })
          .select()
          .single();
        
        if (error) throw error;
        
        await this.saveToLocal('sessions', data);
        return { success: true, session: data };
      } else {
        // Create locally
        const session = {
          id: this.generateUUID(),
          user_id: this.currentUser.id,
          job_id: sessionData.jobId,
          start_time: sessionData.startTime,
          end_time: sessionData.endTime,
          duration_seconds: sessionData.duration,
          date: sessionData.date,
          note: sessionData.note || '',
          earnings: sessionData.earnings || 0,
          created_at: new Date().toISOString()
        };
        
        await this.saveToLocal('sessions', session);
        await this.addToOfflineQueue('create_session', session);
        
        return { success: true, session, offline: true };
      }
    } catch (error) {
      console.error('Create session error:', error);
      return { success: false, error: error.message };
    }
  }
  
  async updateSession(sessionId, updates) {
    if (!this.currentUser) return { success: false, error: 'Not authenticated' };
    
    try {
      // Mark as manually edited
      updates.is_manually_edited = true;
      updates.edited_at = new Date().toISOString();
      
      if (this.isOnline) {
        const { data, error } = await this.supabase
          .from('sessions')
          .update(updates)
          .eq('id', sessionId)
          .eq('user_id', this.currentUser.id)
          .select()
          .single();
        
        if (error) throw error;
        
        await this.saveToLocal('sessions', data);
        return { success: true, session: data };
      } else {
        // Update local
        const localSession = await this.getFromLocal('sessions', sessionId);
        if (localSession) {
          Object.assign(localSession, updates);
          await this.saveToLocal('sessions', localSession);
        }
        
        await this.addToOfflineQueue('update_session', { id: sessionId, updates });
        return { success: true, offline: true };
      }
    } catch (error) {
      console.error('Update session error:', error);
      return { success: false, error: error.message };
    }
  }
  
  async deleteSession(sessionId) {
    if (!this.currentUser) return { success: false, error: 'Not authenticated' };
    
    try {
      if (this.isOnline) {
        const { error } = await this.supabase
          .from('sessions')
          .delete()
          .eq('id', sessionId)
          .eq('user_id', this.currentUser.id);
        
        if (error) throw error;
        
        await this.deleteFromLocal('sessions', sessionId);
        return { success: true };
      } else {
        await this.deleteFromLocal('sessions', sessionId);
        await this.addToOfflineQueue('delete_session', { id: sessionId });
        return { success: true, offline: true };
      }
    } catch (error) {
      console.error('Delete session error:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ==================== ACTIVE TIMER METHODS ====================
  
  async startTimer(jobId, note = '') {
    if (!this.currentUser) return { success: false, error: 'Not authenticated' };
    
    try {
      const serverTime = await this.getServerTime();
      
      // First create a session
      const sessionResult = await this.createSession({
        jobId,
        startTime: serverTime.toISOString(),
        endTime: null,
        duration: 0,
        date: serverTime.toISOString().split('T')[0],
        note,
        earnings: 0
      });
      
      if (!sessionResult.success) {
        throw new Error(sessionResult.error);
      }
      
      // Then create active timer record
      const activeTimer = {
        user_id: this.currentUser.id,
        job_id: jobId,
        session_id: sessionResult.session.id,
        server_start_time: serverTime.toISOString(),
        client_start_time: new Date().toISOString(),
        note,
        is_running: true
      };
      
      if (this.isOnline) {
        const { data, error } = await this.supabase
          .from('active_timers')
          .insert(activeTimer)
          .select()
          .single();
        
        if (error) throw error;
        
        await this.saveToLocal('active_timer', {
          ...data,
          user_id: this.currentUser.id
        });
        
        return { success: true, timer: data, session: sessionResult.session };
      } else {
        // Save locally
        activeTimer.id = this.generateUUID();
        activeTimer.created_at = new Date().toISOString();
        activeTimer.last_sync_at = activeTimer.created_at;
        
        await this.saveToLocal('active_timer', {
          ...activeTimer,
          user_id: this.currentUser.id
        });
        
        return { success: true, timer: activeTimer, session: sessionResult.session, offline: true };
      }
    } catch (error) {
      console.error('Start timer error:', error);
      return { success: false, error: error.message };
    }
  }
  
  async stopTimer(timerId, sessionId) {
    if (!this.currentUser) return { success: false, error: 'Not authenticated' };
    
    try {
      const serverTime = await this.getServerTime();
      
      // Get the timer to find start time
      const { data: timer, error: timerError } = await this.supabase
        .from('active_timers')
        .select('*')
        .eq('id', timerId)
        .single();
      
      if (timerError && this.isOnline) throw timerError;
      
      const startTime = new Date(timer?.server_start_time || (await this.getFromLocal('active_timer', this.currentUser.id))?.server_start_time);
      const endTime = serverTime;
      const durationSeconds = Math.floor((endTime - startTime) / 1000);
      
      // Check for midnight crossing
      const startDay = startTime.toISOString().split('T')[0];
      const endDay = endTime.toISOString().split('T')[0];
      
      if (startDay !== endDay && CONFIG.MIDNIGHT_SPLIT_ENABLED) {
        // Split into two sessions
        const midnight = new Date(startDay + 'T23:59:59.999Z');
        const day1Duration = Math.floor((midnight - startTime) / 1000) + 1; // +1 to include the last second
        const day2Duration = durationSeconds - day1Duration;
        
        // Update first session
        await this.updateSession(sessionId, {
          end_time: midnight.toISOString(),
          duration_seconds: day1Duration
        });
        
        // Create second session if duration > 0
        if (day2Duration > 0) {
          await this.createSession({
            jobId: timer.job_id,
            startTime: new Date(endDay + 'T00:00:00Z').toISOString(),
            endTime: endTime.toISOString(),
            duration: day2Duration,
            date: endDay,
            note: timer.note || '',
            earnings: 0 // Will be calculated based on job rate
          });
        }
      } else {
        // Normal single session update
        await this.updateSession(sessionId, {
          end_time: endTime.toISOString(),
          duration_seconds: durationSeconds
        });
      }
      
      // Delete active timer
      if (this.isOnline) {
        await this.supabase
          .from('active_timers')
          .delete()
          .eq('id', timerId);
      }
      
      await this.deleteFromLocal('active_timer', this.currentUser.id);
      
      return { success: true, duration: durationSeconds };
    } catch (error) {
      console.error('Stop timer error:', error);
      return { success: false, error: error.message };
    }
  }
  
  async getActiveTimer() {
    if (!this.currentUser) return null;
    
    try {
      if (this.isOnline) {
        const { data, error } = await this.supabase
          .from('active_timers')
          .select('*')
          .eq('user_id', this.currentUser.id)
          .eq('is_running', true)
          .single();
        
        if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
        
        if (data) {
          await this.saveToLocal('active_timer', { ...data, user_id: this.currentUser.id });
          return data;
        }
        
        return null;
      } else {
        // Get from local
        const localTimer = await this.getFromLocal('active_timer', this.currentUser.id);
        if (localTimer && localTimer.is_running) {
          return localTimer;
        }
        return null;
      }
    } catch (error) {
      console.error('Get active timer error:', error);
      return await this.getFromLocal('active_timer', this.currentUser.id);
    }
  }
  
  // Calculate elapsed time based on server time
  async getElapsedTime(timerId) {
    try {
      const serverTime = await this.getServerTime();
      
      let timer;
      if (this.isOnline) {
        const { data, error } = await this.supabase
          .from('active_timers')
          .select('*')
          .eq('id', timerId)
          .single();
        
        if (!error) timer = data;
      }
      
      if (!timer) {
        timer = await this.getFromLocal('active_timer', this.currentUser.id);
      }
      
      if (!timer) return 0;
      
      const startTime = new Date(timer.server_start_time);
      return Math.floor((serverTime - startTime) / 1000);
    } catch (error) {
      console.error('Get elapsed time error:', error);
      return 0;
    }
  }
  
  // ==================== SYNC METHODS ====================
  
  handleOnline() {
    this.isOnline = true;
    showToast('Back online', 'success');
    this.syncOfflineQueue();
    this.startPeriodicSync();
  }
  
  handleOffline() {
    this.isOnline = false;
    showToast('Offline mode', 'warning');
    this.stopPeriodicSync();
  }
  
  async fullSync() {
    if (!this.isOnline || !this.currentUser) return;
    
    try {
      // Sync jobs
      const { data: jobs } = await this.supabase
        .from('jobs')
        .select('*')
        .eq('user_id', this.currentUser.id);
      
      for (const job of jobs || []) {
        await this.saveToLocal('jobs', job);
      }
      
      // Sync recent sessions (last 90 days)
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      
      const { data: sessions } = await this.supabase
        .from('sessions')
        .select('*')
        .eq('user_id', this.currentUser.id)
        .gte('date', ninetyDaysAgo.toISOString().split('T')[0]);
      
      for (const session of sessions || []) {
        await this.saveToLocal('sessions', session);
      }
      
      // Sync profile
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', this.currentUser.id)
        .single();
      
      if (profile) {
        await this.saveToLocal('profile', profile);
      }
      
      console.log('Full sync completed');
    } catch (error) {
      console.error('Full sync error:', error);
    }
  }
  
  startPeriodicSync() {
    if (this.syncInterval) clearInterval(this.syncInterval);
    this.syncInterval = setInterval(() => this.syncOfflineQueue(), CONFIG.SYNC_INTERVAL);
  }
  
  stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
  
  async addToOfflineQueue(action, data) {
    const queueItem = {
      action,
      data,
      timestamp: new Date().toISOString(),
      retry_count: 0
    };
    
    this.offlineQueue.push(queueItem);
    
    // Save to IndexedDB
    const transaction = this.localDb.transaction('offline_queue', 'readwrite');
    const store = transaction.objectStore('offline_queue');
    await store.add(queueItem);
    
    // Limit queue size
    if (this.offlineQueue.length > CONFIG.OFFLINE_QUEUE_MAX_SIZE) {
      this.offlineQueue.shift();
    }
  }
  
  async loadOfflineQueue() {
    return new Promise((resolve) => {
      const transaction = this.localDb.transaction('offline_queue', 'readonly');
      const store = transaction.objectStore('offline_queue');
      const request = store.getAll();
      
      request.onsuccess = () => {
        this.offlineQueue = request.result || [];
        resolve();
      };
      
      request.onerror = () => {
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
      const toSync = [...this.offlineQueue];
      const failed = [];
      
      for (const item of toSync) {
        try {
          let result;
          
          switch (item.action) {
            case 'create_job':
              result = await this.createJob(item.data);
              break;
            case 'update_job':
              result = await this.updateJob(item.data.id, item.data.updates);
              break;
            case 'create_session':
              result = await this.createSession(item.data);
              break;
            case 'update_session':
              result = await this.updateSession(item.data.id, item.data.updates);
              break;
            case 'delete_session':
              result = await this.deleteSession(item.data.id);
              break;
            case 'update_profile':
              result = await this.updateProfile(item.data.updates);
              break;
          }
          
          if (!result.success && !result.offline) {
            item.retry_count++;
            if (item.retry_count < 3) {
              failed.push(item);
            }
          }
        } catch (error) {
          console.error('Sync item error:', error);
          item.retry_count++;
          if (item.retry_count < 3) {
            failed.push(item);
          }
        }
      }
      
      this.offlineQueue = failed;
      
      // Clear synced items from IndexedDB
      const transaction = this.localDb.transaction('offline_queue', 'readwrite');
      const store = transaction.objectStore('offline_queue');
      await store.clear();
      
      // Re-add failed items
      for (const item of failed) {
        await store.add(item);
      }
      
      if (toSync.length > failed.length) {
        console.log(`Synced ${toSync.length - failed.length} items`);
      }
    } catch (error) {
      console.error('Sync queue error:', error);
    } finally {
      this.syncInProgress = false;
    }
  }
  
  // ==================== REAL-TIME SUBSCRIPTIONS ====================
  
  subscribeToRealtime() {
    if (!this.currentUser) return;
    
    // Subscribe to jobs changes
    const jobsSubscription = this.supabase
      .channel('jobs_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'jobs',
        filter: `user_id=eq.${this.currentUser.id}`
      }, (payload) => {
        this.handleRealtimeChange('jobs', payload);
      })
      .subscribe();
    
    this.subscriptions.push(jobsSubscription);
    
    // Subscribe to sessions changes
    const sessionsSubscription = this.supabase
      .channel('sessions_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'sessions',
        filter: `user_id=eq.${this.currentUser.id}`
      }, (payload) => {
        this.handleRealtimeChange('sessions', payload);
      })
      .subscribe();
    
    this.subscriptions.push(sessionsSubscription);
  }
  
  unsubscribeAll() {
    for (const subscription of this.subscriptions) {
      subscription.unsubscribe();
    }
    this.subscriptions = [];
  }
  
  async handleRealtimeChange(table, payload) {
    console.log('Realtime change:', table, payload);
    
    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
      await this.saveToLocal(table, payload.new);
    } else if (payload.eventType === 'DELETE') {
      await this.deleteFromLocal(table, payload.old.id);
    }
    
    // Dispatch custom event for UI updates
    window.dispatchEvent(new CustomEvent('db-change', {
      detail: { table, payload }
    }));
  }
  
  // ==================== LOCAL STORAGE HELPERS ====================
  
  saveToLocal(storeName, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.localDb.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  
  getFromLocal(storeName, id) {
    return new Promise((resolve) => {
      const transaction = this.localDb.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    });
  }
  
  getAllFromLocal(storeName) {
    return new Promise((resolve) => {
      const transaction = this.localDb.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    });
  }
  
  deleteFromLocal(storeName, id) {
    return new Promise((resolve) => {
      const transaction = this.localDb.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);
      
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
    });
  }
  
  async clearLocalData() {
    const stores = ['jobs', 'sessions', 'active_timer', 'profile', 'offline_queue'];
    
    for (const storeName of stores) {
      const transaction = this.localDb.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      await store.clear();
    }
  }
  
  // ==================== UTILITIES ====================
  
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }
}

// Create global instance
const dbService = new DatabaseService();
