# Ever Work - Professional Time Tracking PWA

A premium, emotionally resonant time tracking Progressive Web App designed for individuals juggling multiple jobs. Track your hustle, celebrate your grind.

![Version](https://img.shields.io/badge/version-1.0.0-orange)
![License](https://img.shields.io/badge/license-MIT-blue)

## ✨ Features

### Core Functionality
- **⏱️ Precise Time Tracking** - Server-time accurate tracking prevents manipulation
- **🔐 User Accounts** - Secure authentication with Supabase
- **☁️ Cloud Sync** - Automatic synchronization across all devices
- **📴 Offline-First** - Works without internet, syncs when reconnected
- **✏️ Edit Sessions** - Correct forgotten stop times or add manual entries
- **💰 Earnings Calculator** - Track your income per job with hourly rates

### Professional Features
- **📊 Progress Dashboard** - Visual progress circle with daily goals
- **📅 Calendar View** - Monthly heatmap of your work patterns
- **🎯 Job Management** - Color-coded jobs with custom icons
- **🏆 Achievements** - Unlock badges for your milestones
- **📈 Statistics** - Track total hours, sessions, and earnings
- **💾 Data Export/Import** - Backup and restore your data

### Design & UX
- **🎨 Premium UI** - Dark theme with warm sunset gradients
- **📱 PWA Support** - Install as native app on any device
- **⚡ Fast Performance** - Optimized for 60fps animations
- **♿ Accessible** - Keyboard navigation and screen reader support
- **🌙 Reduced Motion** - Respects user preferences

## 🚀 Getting Started

### Prerequisites
- Supabase account (free tier works great)
- Modern web browser
- Web server (for local development)

### 1. Setup Supabase

1. Create a new project at [https://supabase.com](https://supabase.com)
2. Go to the SQL Editor and run the schema from `SUPABASE_SETUP.md`
3. Copy your project URL and anon key from Settings → API

### 2. Configure App

Update `shared/config.js` with your Supabase credentials:

```javascript
const CONFIG = {
  SUPABASE_URL: 'https://your-project.supabase.co',
  SUPABASE_ANON_KEY: 'your-anon-key',
  // ... rest of config
};
```

### 3. Deploy

#### Option A: Static Hosting (Recommended)
Deploy to Vercel, Netlify, GitHub Pages, or any static host:

```bash
# Example: Deploy to Vercel
npm i -g vercel
vercel
```

#### Option B: Local Development

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve .

# Using PHP
php -S localhost:8000
```

Then open http://localhost:8000

## 📱 Installing as PWA

### iOS (Safari)
1. Open the app in Safari
2. Tap Share button
3. Select "Add to Home Screen"

### Android (Chrome)
1. Open the app in Chrome
2. Tap menu (3 dots)
3. Select "Add to Home screen"

### Desktop (Chrome/Edge)
1. Open the app
2. Look for install icon in address bar
3. Click "Install Ever Work"

## 🏗️ Architecture

```
EverWork/
├── index.html              # Entry point with PWA loader
├── manifest.json           # PWA manifest
├── sw.js                   # Service Worker for offline support
├── SUPABASE_SETUP.md       # Database schema
├── pages/
│   ├── auth.html          # Login/Signup
│   ├── dashboard.html     # Main dashboard with progress
│   ├── timer.html         # Full-screen timer
│   ├── jobs.html          # Job management
│   ├── calendar.html      # Analytics view
│   └── settings.html      # Account & preferences
├── shared/
│   ├── config.js          # App configuration
│   ├── db-service.js      # Supabase + IndexedDB service
│   ├── scripts.js         # Shared utilities
│   └── styles.css         # Shared styles
└── icons/                 # PWA icons
```

## 🔧 Technical Stack

| Technology | Purpose |
|------------|---------|
| **Supabase** | Auth, PostgreSQL DB, Real-time subscriptions |
| **IndexedDB** | Local offline storage |
| **Service Worker** | Offline caching, PWA support |
| **Tailwind CSS** | Utility-first styling |
| **Lucide Icons** | Beautiful icon set |
| **Vanilla JS** | No framework dependency |

## 🎯 Key Features Explained

### Server-Time Accurate Tracking
The app uses Supabase's server time for all timing operations. This prevents users from manipulating their device clock to fake hours.

```javascript
// Get accurate server time
const serverTime = await dbService.getServerTime();
```

### Offline-First Architecture
All data is stored locally in IndexedDB first, then synced to Supabase when online:
- Changes queue up when offline
- Automatic sync when connection restored
- Conflict resolution handled automatically

### Edit Sessions
Users can correct mistakes:
- Edit start/end times
- Change job assignment
- Add or modify notes
- Marked with `is_manually_edited` flag for transparency

### Midnight Crossing Detection
Sessions that cross midnight are automatically split into two separate days for accurate daily totals.

## 🔒 Security

- **Row Level Security (RLS)** - Users can only access their own data
- **Secure Auth** - Supabase handles authentication securely
- **No Sensitive Data** - Only email stored, no passwords in code
- **HTTPS Required** - Service Worker requires secure context

## 📝 Environment Variables

For production deployment, set these environment variables:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

## 🧪 Testing

### Manual Testing Checklist
- [ ] Sign up new account
- [ ] Create jobs with different colors
- [ ] Start/stop timer
- [ ] Edit a session
- [ ] Go offline and make changes
- [ ] Come back online and verify sync
- [ ] Export data
- [ ] Import data
- [ ] Install as PWA

### Test on Multiple Devices
- iOS Safari
- Android Chrome
- Desktop Chrome/Edge/Safari

## 🚢 Deployment Checklist

Before going live:

- [ ] Update Supabase credentials in `config.js`
- [ ] Set up custom domain (optional)
- [ ] Configure CSP headers
- [ ] Set up monitoring/analytics
- [ ] Test on real devices
- [ ] Verify SSL certificate
- [ ] Test offline functionality
- [ ] Review RLS policies

## 🤝 Contributing

This is a personal project for tracking work hours. Feel free to fork and customize for your needs.

## 📄 License

MIT License - feel free to use commercially or personally.

---

Made with 💛 for all the hustlers out there.
