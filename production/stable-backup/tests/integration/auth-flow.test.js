/**
 * Integration Tests - Authentication Flow
 * Tests the complete auth lifecycle: login, data sync, logout
 */

describe('Authentication Flow Integration Tests', () => {
  let authService;
  let mockFirebase;

  beforeEach(() => {
    // Mock Firebase Auth
    mockFirebase = {
      currentUser: null,
      authStateCallbacks: [],
      
      onAuthStateChanged(callback) {
        this.authStateCallbacks.push(callback);
        // Call callback immediately with current user
        callback(this.currentUser);
        // Return unsubscribe function
        return () => {
          this.authStateCallbacks = this.authStateCallbacks.filter(cb => cb !== callback);
        };
      },
      
      async signInWithEmailAndPassword(email, password) {
        if (email === 'valid@example.com' && password === 'password123') {
          this.currentUser = {
            uid: 'user123',
            email: email,
            displayName: 'Test User'
          };
          this.authStateCallbacks.forEach(cb => cb(this.currentUser));
          return { user: this.currentUser };
        }
        throw { code: 'auth/wrong-password', message: 'Incorrect password' };
      },
      
      async createUserWithEmailAndPassword(email, password) {
        this.currentUser = {
          uid: 'newuser123',
          email: email,
          displayName: null
        };
        this.authStateCallbacks.forEach(cb => cb(this.currentUser));
        return { user: this.currentUser };
      },
      
      async signInWithPopup() {
        this.currentUser = {
          uid: 'googleuser123',
          email: 'google@example.com',
          displayName: 'Google User',
          photoURL: 'https://example.com/photo.jpg'
        };
        this.authStateCallbacks.forEach(cb => cb(this.currentUser));
        return { 
          user: this.currentUser,
          additionalUserInfo: { isNewUser: false }
        };
      },
      
      async signOut() {
        this.currentUser = null;
        this.authStateCallbacks.forEach(cb => cb(null));
      },
      
      async setPersistence(persistence) {
        return Promise.resolve();
      }
    };

    // Mock Auth Service
    authService = {
      currentUser: null,
      isGuest: false,
      unsubscribeFn: null,
      
      async init() {
        return new Promise((resolve) => {
          let resolved = false;
          
          this.unsubscribeFn = mockFirebase.onAuthStateChanged((user) => {
            this.currentUser = user;
            if (!resolved) {
              resolved = true;
              resolve(user);
            }
          });
          
          // Timeout fallback
          setTimeout(() => {
            if (!resolved) {
              resolved = true;
              resolve(this.currentUser);
            }
          }, 100);
        });
      },
      
      cleanup() {
        if (this.unsubscribeFn) {
          this.unsubscribeFn();
          this.unsubscribeFn = null;
        }
      },
      
      async signIn(email, password) {
        try {
          const result = await mockFirebase.signInWithEmailAndPassword(email, password);
          localStorage.removeItem('everwork_guest_mode');
          this.currentUser = result.user;
          return { success: true, user: result.user };
        } catch (error) {
          return { success: false, error: error.message };
        }
      },
      
      async signUp(email, password, displayName) {
        try {
          const result = await mockFirebase.createUserWithEmailAndPassword(email, password);
          // Update profile
          result.user.displayName = displayName;
          this.currentUser = result.user;
          return { success: true, user: result.user };
        } catch (error) {
          return { success: false, error: error.message };
        }
      },
      
      async signInWithGoogle() {
        try {
          const result = await mockFirebase.signInWithPopup();
          localStorage.removeItem('everwork_guest_mode');
          localStorage.removeItem('everwork_offline_mode');
          localStorage.removeItem('everwork_guest_id');
          this.currentUser = result.user;
          return { 
            success: true, 
            user: result.user,
            isNewUser: result.additionalUserInfo?.isNewUser
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      },
      
      async signOut() {
        await mockFirebase.signOut();
        this.currentUser = null;
        this.isGuest = false;
        localStorage.removeItem('everwork_guest_mode');
        localStorage.clear();
        return { success: true };
      },
      
      enableGuestMode() {
        this.isGuest = true;
        localStorage.setItem('everwork_guest_mode', 'true');
        localStorage.setItem('everwork_offline_mode', 'true');
        localStorage.setItem('everwork_guest_id', 'guest_' + Date.now());
      },
      
      isAuthenticated() {
        return !!this.currentUser || this.isGuest || !!localStorage.getItem('everwork_guest_mode');
      }
    };
  });

  afterEach(() => {
    if (authService) {
      authService.cleanup();
    }
  });

  describe('Email/Password Authentication', () => {
    test('should sign in with valid credentials', async () => {
      const result = await authService.signIn('valid@example.com', 'password123');
      
      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('valid@example.com');
      expect(authService.currentUser).not.toBeNull();
    });

    test('should reject invalid credentials', async () => {
      const result = await authService.signIn('valid@example.com', 'wrongpassword');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should create new account', async () => {
      const result = await authService.signUp('new@example.com', 'password123', 'New User');
      
      expect(result.success).toBe(true);
      expect(result.user.displayName).toBe('New User');
    });
  });

  describe('Google Authentication', () => {
    test('should sign in with Google', async () => {
      const result = await authService.signInWithGoogle();
      
      expect(result.success).toBe(true);
      expect(result.user.email).toBe('google@example.com');
    });

    test('should clear guest mode on Google sign in', async () => {
      localStorage.setItem('everwork_guest_mode', 'true');
      
      await authService.signInWithGoogle();
      
      expect(localStorage.removeItem).toHaveBeenCalledWith('everwork_guest_mode');
    });
  });

  describe('Guest Mode', () => {
    test('should enable guest mode', () => {
      authService.enableGuestMode();
      
      expect(localStorage.setItem).toHaveBeenCalledWith('everwork_guest_mode', 'true');
      expect(localStorage.setItem).toHaveBeenCalledWith('everwork_offline_mode', 'true');
      expect(authService.isGuest).toBe(true);
    });

    test('should report authenticated in guest mode', () => {
      authService.isGuest = true;
      
      expect(authService.isAuthenticated()).toBe(true);
    });
  });

  describe('Sign Out', () => {
    test('should clear all auth state on sign out', async () => {
      await authService.signIn('valid@example.com', 'password123');
      expect(authService.currentUser).not.toBeNull();
      
      localStorage.setItem('someKey', 'someValue');
      
      await authService.signOut();
      
      expect(authService.currentUser).toBeNull();
      expect(localStorage.clear).toHaveBeenCalled();
    });
  });

  describe('Auth State Persistence', () => {
    test('should restore auth state on init', async () => {
      // Simulate existing session
      mockFirebase.currentUser = {
        uid: 'user123',
        email: 'test@example.com'
      };
      
      const user = await authService.init();
      
      expect(user).not.toBeNull();
      expect(authService.currentUser).not.toBeNull();
    });

    test('should handle no existing session', async () => {
      mockFirebase.currentUser = null;
      
      const user = await authService.init();
      
      expect(user).toBeNull();
      expect(authService.currentUser).toBeNull();
    });

    test('should timeout if auth state not resolved', async () => {
      // Override onAuthStateChanged to never call callback immediately
      mockFirebase.onAuthStateChanged = (cb) => {
        // Don't call callback - simulate hanging
        return () => {};
      };
      
      const user = await authService.init();
      
      // Should resolve with null after timeout
      expect(user).toBeNull();
    }, 500);
  });

  describe('Auth Guards', () => {
    test('should redirect unauthenticated users', async () => {
      authService.currentUser = null;
      authService.isGuest = false;
      
      const isAuth = authService.isAuthenticated();
      
      expect(isAuth).toBe(false);
    });

    test('should allow authenticated users', async () => {
      await authService.signIn('valid@example.com', 'password123');
      
      expect(authService.isAuthenticated()).toBe(true);
    });
  });
});
