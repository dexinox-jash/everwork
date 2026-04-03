/**
 * Production Error Tracking & Monitoring
 * Sentry Integration for Ever Work
 */

// Sentry DSN (Replace with your actual DSN from sentry.io)
const SENTRY_DSN = 'https://YOUR_SENTRY_DSN@sentry.io/YOUR_PROJECT_ID';

/**
 * Error Tracking Configuration
 */
const ErrorTracking = {
  // Initialize error tracking
  init() {
    // Check if Sentry is available (loaded via CDN)
    if (typeof Sentry !== 'undefined') {
      Sentry.init({
        dsn: SENTRY_DSN,
        environment: this.getEnvironment(),
        release: this.getReleaseVersion(),
        
        // Performance monitoring
        tracesSampleRate: 0.1, // 10% of transactions
        
        // Error filtering
        beforeSend(event, hint) {
          // Filter out non-actionable errors
          if (ErrorTracking.shouldIgnoreError(event)) {
            return null;
          }
          
          // Add custom context
          event.tags = {
            ...event.tags,
            app_version: '1.0.0',
            user_agent: navigator.userAgent,
          };
          
          return event;
        },
        
        // Ignore certain errors
        ignoreErrors: [
          // Network errors
          'Network Error',
          'Failed to fetch',
          'NetworkError',
          
          // Browser extensions
          'chrome-extension',
          'moz-extension',
          
          // Third-party scripts
          'Script error',
          
          // Firebase offline errors
          'firestore/unavailable',
          'auth/network-request-failed',
        ],
        
        // Deny URLs from extensions
        denyUrls: [
          /extensions\//i,
          /^chrome:\/\//i,
          /^chrome-extension:\/\//i,
          /^moz-extension:\/\//i,
        ],
      });
      
      console.log('[ErrorTracking] Sentry initialized');
    } else {
      console.warn('[ErrorTracking] Sentry not loaded');
      // Fallback error logging
      this.setupFallbackLogging();
    }
    
    // Setup global error handlers
    this.setupGlobalHandlers();
    
    // Setup performance monitoring
    this.setupPerformanceMonitoring();
  },
  
  // Get current environment
  getEnvironment() {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'development';
    } else if (hostname.includes('staging')) {
      return 'staging';
    }
    return 'production';
  },
  
  // Get release version (from build timestamp or git commit)
  getReleaseVersion() {
    // This should be injected during build process
    return window.APP_VERSION || '1.0.0';
  },
  
  // Determine if error should be ignored
  shouldIgnoreError(event) {
    const errorMessage = event.exception?.values?.[0]?.value || '';
    
    // Ignore specific non-actionable errors
    const ignoredPatterns = [
      /ResizeObserver loop limit exceeded/i,
      /Non-Error promise rejection captured/i,
      /Cannot read property 'removeEventListener' of null/i,
    ];
    
    return ignoredPatterns.some(pattern => pattern.test(errorMessage));
  },
  
  // Setup global error handlers
  setupGlobalHandlers() {
    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.error('[ErrorTracking] Unhandled promise rejection:', event.reason);
      
      if (typeof Sentry !== 'undefined') {
        Sentry.captureException(event.reason);
      }
      
      // Prevent default handling
      event.preventDefault();
    });
    
    // Catch global errors
    window.addEventListener('error', (event) => {
      console.error('[ErrorTracking] Global error:', event.error);
      
      if (typeof Sentry !== 'undefined') {
        Sentry.captureException(event.error);
      }
      
      // Show user-friendly error for critical errors
      if (this.isCriticalError(event.error)) {
        this.showErrorDialog(event.error);
      }
    });
  },
  
  // Setup fallback logging (when Sentry is not available)
  setupFallbackLogging() {
    const originalConsoleError = console.error;
    
    console.error = (...args) => {
      // Log to original console
      originalConsoleError.apply(console, args);
      
      // Send to your own error endpoint
      this.sendToErrorEndpoint({
        level: 'error',
        message: args.join(' '),
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      });
    };
  },
  
  // Send errors to custom endpoint
  async sendToErrorEndpoint(errorData) {
    try {
      // Only send in production
      if (this.getEnvironment() !== 'production') return;
      
      await fetch('https://your-error-endpoint.com/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorData),
        // Don't wait for response
        keepalive: true,
      });
    } catch (e) {
      // Silently fail - don't cause more errors
    }
  },
  
  // Setup performance monitoring
  setupPerformanceMonitoring() {
    // Monitor Core Web Vitals
    if ('web-vitals' in window) {
      // LCP (Largest Contentful Paint)
      webVitals.getLCP((metric) => {
        this.trackPerformanceMetric('LCP', metric.value);
      });
      
      // FID (First Input Delay)
      webVitals.getFID((metric) => {
        this.trackPerformanceMetric('FID', metric.value);
      });
      
      // CLS (Cumulative Layout Shift)
      webVitals.getCLS((metric) => {
        this.trackPerformanceMetric('CLS', metric.value);
      });
    }
    
    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) { // Tasks over 50ms
            this.trackPerformanceMetric('LongTask', entry.duration);
          }
        }
      });
      
      try {
        observer.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        // Browser may not support longtask
      }
    }
  },
  
  // Track performance metrics
  trackPerformanceMetric(name, value) {
    if (typeof Sentry !== 'undefined') {
      Sentry.setTag(`perf_${name}`, value);
    }
    
    // Log slow metrics
    const thresholds = {
      LCP: 2500,    // 2.5 seconds
      FID: 100,     // 100ms
      CLS: 0.1,     // 0.1
      LongTask: 50, // 50ms
    };
    
    if (thresholds[name] && value > thresholds[name]) {
      console.warn(`[Performance] Slow ${name}: ${value}`);
      
      if (typeof Sentry !== 'undefined') {
        Sentry.captureMessage(`Slow ${name}: ${value}`, 'warning');
      }
    }
  },
  
  // Check if error is critical
  isCriticalError(error) {
    if (!error) return false;
    
    const criticalPatterns = [
      /Firebase.*Error/i,
      /auth\//i,
      /firestore\//i,
      /Network.*Error/i,
    ];
    
    const errorMessage = error.message || error.toString();
    return criticalPatterns.some(pattern => pattern.test(errorMessage));
  },
  
  // Show error dialog for critical errors
  showErrorDialog(error) {
    // Only show if not already showing
    if (document.getElementById('critical-error-dialog')) return;
    
    const dialog = document.createElement('div');
    dialog.id = 'critical-error-dialog';
    dialog.innerHTML = `
      <div style="position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 9999; display: flex; align-items: center; justify-content: center;">
        <div style="background: #1A1A1F; padding: 24px; border-radius: 16px; max-width: 400px; text-align: center;">
          <h3 style="color: #F87171; margin-bottom: 12px;">Something went wrong</h3>
          <p style="color: rgba(255,255,255,0.7); margin-bottom: 20px;">We're sorry, but an error occurred. Please try refreshing the page.</p>
          <button onclick="location.reload()" style="padding: 12px 24px; background: linear-gradient(135deg, #FF9A56, #FF6B6B); border: none; border-radius: 8px; color: white; cursor: pointer;">
            Refresh Page
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(dialog);
  },
  
  // Set user context for error tracking
  setUser(userId, email) {
    if (typeof Sentry !== 'undefined') {
      Sentry.setUser({
        id: userId,
        email: email,
      });
    }
  },
  
  // Clear user context on logout
  clearUser() {
    if (typeof Sentry !== 'undefined') {
      Sentry.setUser(null);
    }
  },
  
  // Manual error capture
  captureError(error, context = {}) {
    console.error('[ErrorTracking] Captured error:', error);
    
    if (typeof Sentry !== 'undefined') {
      Sentry.withScope((scope) => {
        Object.entries(context).forEach(([key, value]) => {
          scope.setExtra(key, value);
        });
        Sentry.captureException(error);
      });
    }
  },
  
  // Capture message
  captureMessage(message, level = 'info') {
    if (typeof Sentry !== 'undefined') {
      Sentry.captureMessage(message, level);
    }
  },
};

// Auto-initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => ErrorTracking.init());
} else {
  ErrorTracking.init();
}

// Expose globally
window.ErrorTracking = ErrorTracking;
