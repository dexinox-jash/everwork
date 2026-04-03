/**
 * Ever Work - Service Worker
 * Provides offline support, caching, and background sync
 */

const CACHE_NAME = 'ever-work-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/pages/dashboard.html',
  '/pages/timer.html',
  '/pages/jobs.html',
  '/pages/calendar.html',
  '/pages/settings.html',
  '/pages/auth.html',
  '/shared/styles.css',
  '/shared/scripts.js',
  '/shared/config.js',
  '/shared/db-service.js'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Installation complete');
        return self.skipWaiting();
      })
      .catch((err) => {
        console.error('[SW] Cache failed:', err);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Activation complete');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip external CDN resources - let them load normally
  const externalHosts = [
    'cdn.jsdelivr.net',
    'unpkg.com',
    'www.gstatic.com',
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'firestore.googleapis.com',
    'identitytoolkit.googleapis.com',
    'securetoken.googleapis.com'
  ];
  
  if (externalHosts.some(host => url.hostname.includes(host))) {
    // Don't intercept external CDN requests
    return;
  }
  
  // Skip Supabase/Firebase API calls
  if (url.hostname.includes('supabase.co') || url.hostname.includes('googleapis.com')) {
    return;
  }
  
  // Only intercept requests to our own domain
  if (url.origin !== self.location.origin) {
    return;
  }
  
  // Strategy: Cache First, then Network (for local assets only)
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached response and update cache in background
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse.ok) {
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(request, networkResponse);
                });
              }
            })
            .catch(() => {
              // Network failed, but we have cache
            });
          
          return cachedResponse;
        }
        
        // Not in cache, fetch from network
        return fetch(request)
          .then((networkResponse) => {
            if (!networkResponse || !networkResponse.ok) {
              throw new Error('Network response was not ok');
            }
            
            // Cache the new response
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
            
            return networkResponse;
          })
          .catch((error) => {
            console.error('[SW] Fetch failed:', error);
            
            // Return offline page for navigation requests
            if (request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            
            throw error;
          });
      })
  );
});

// Background Sync - queue actions when offline
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-sessions') {
    event.waitUntil(syncSessions());
  }
});

async function syncSessions() {
  // This will be handled by the DB service
  // The service worker just triggers it
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({ type: 'SYNC_REQUESTED' });
  });
}

// Push Notifications (for future use)
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  
  const options = {
    body: data.body || 'Time tracking reminder',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: data.tag || 'default',
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || []
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Ever Work', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window' })
      .then((clientList) => {
        if (clientList.length > 0) {
          // Focus existing window
          const client = clientList[0];
          client.focus();
          client.postMessage({ type: 'NOTIFICATION_CLICKED', action: event.action });
        } else {
          // Open new window
          self.clients.openWindow('/');
        }
      })
  );
});

// Message from main thread
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'SYNC_NOW':
      // Trigger background sync
      self.registration.sync.register('sync-sessions')
        .then(() => console.log('[SW] Sync registered'))
        .catch((err) => console.error('[SW] Sync registration failed:', err));
      break;
      
    case 'CACHE_URLS':
      // Cache specific URLs
      if (payload.urls) {
        caches.open(CACHE_NAME).then((cache) => {
          cache.addAll(payload.urls);
        });
      }
      break;
  }
});

// Periodic Background Sync (for daily summaries - future feature)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'daily-summary') {
    event.waitUntil(showDailySummary());
  }
});

async function showDailySummary() {
  // Calculate and show daily summary notification
  // This would require access to the database
  // For now, just a placeholder
  console.log('[SW] Daily summary sync');
}
