# Deploy Ever Work to Firebase

Complete step-by-step guide to deploy Ever Work as a Firebase Dynamic Web App.

## Prerequisites

1. Node.js installed (v16+ recommended)
2. Google account
3. Your Ever Work project files

---

## Step 1: Install Firebase CLI

Open terminal/command prompt and run:

```bash
npm install -g firebase-tools
```

Verify installation:
```bash
firebase --version
```

---

## Step 2: Login to Firebase

```bash
firebase login
```

This opens a browser window. Sign in with your Google account and grant permissions.

---

## Step 3: Initialize Firebase Project

Navigate to your Ever Work folder:

```bash
cd path/to/EverWork
```

Initialize Firebase:

```bash
firebase init
```

### Select Features:

Use arrow keys and spacebar to select:
```
? Which Firebase features do you want to set up for this directory? 
  (Press <space> to select, <a> to toggle all, <i> to invert selection)
 ❯◉ Firestore: Configure security rules and indexes files for Firestore
  ◉ Hosting: Configure files for Firebase Hosting and (optionally) set up GitHub Action deploys
```

### Firestore Setup:
```
? What file should be used for Firestore Rules? (firestore.rules)
# Press Enter to accept default

? What file should be used for Firestore indexes? (firestore.indexes.json)
# Press Enter to accept default
```

### Project Setup:
```
? Please select an option: 
  (Use arrow keys)
 ❯ Use an existing project 
  Create a new project
  Add Firebase to an existing Google Cloud Platform project
  Don't set up a default project
```

Select **"Use an existing project"** and choose your Firebase project.

### Hosting Setup:
```
? What do you want to use as your public directory? .
# Type . (dot) for current directory

? Configure as a single-page app (rewrite all urls to /index.html)? No
# Type N

? Set up automatic builds and deploys with GitHub? No
# Type N
```

---

## Step 4: Update Configuration

Edit `shared/config.js` with your Firebase credentials:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click gear icon ⚙️ → Project settings
4. Scroll down to "Your apps" section
5. Click `</>` (web icon)
6. Copy the config values

Update `shared/config.js`:

```javascript
const CONFIG = {
  FIREBASE_API_KEY: 'AIzaSy...',
  FIREBASE_AUTH_DOMAIN: 'your-project.firebaseapp.com',
  FIREBASE_PROJECT_ID: 'your-project-id',
  FIREBASE_STORAGE_BUCKET: 'your-project.appspot.com',
  FIREBASE_MESSAGING_SENDER_ID: '123456789',
  FIREBASE_APP_ID: '1:123456789:web:abcdef123456',
  // ... rest of config
};
```

Also update `.firebaserc`:

```json
{
  "projects": {
    "default": "your-project-id"
  }
}
```

---

## Step 5: Deploy to Firebase

### First Deployment:

```bash
firebase deploy
```

This deploys:
- Firestore rules
- Hosting files

### Subsequent Deployments:

```bash
# Deploy everything
firebase deploy

# Deploy only hosting
firebase deploy --only hosting

# Deploy only Firestore rules
firebase deploy --only firestore:rules
```

---

## Step 6: Verify Deployment

1. Visit your hosting URL shown after deployment:
   ```
   Hosting URL: https://your-project.web.app
   ```

2. Test the app:
   - Create an account
   - Log in
   - Create a job
   - Start/stop timer
   - Check data persists after refresh

---

## Firebase Console Features

### Authentication
- View registered users
- Enable/disable sign-in methods
- Set up email templates

### Firestore Database
- View all stored data
- Manually edit documents
- View security rules

### Hosting
- View deployment history
- Rollback to previous versions
- Connect custom domain

---

## Connecting a Custom Domain (Optional)

1. Go to Firebase Console → Hosting
2. Click "Add custom domain"
3. Enter your domain (e.g., `everwork.yourdomain.com`)
4. Follow DNS configuration instructions
5. Wait for SSL certificate (usually instant)

---

## Troubleshooting

### "Permission Denied" Errors
Your Firestore rules aren't set up correctly. Make sure you deployed:
```bash
firebase deploy --only firestore:rules
```

### App Not Loading
1. Check browser console for errors
2. Verify all Firebase config values are correct
3. Make sure Firebase project is active

### Auth Not Working
1. Check Authentication is enabled in Firebase Console
2. Verify Email/Password provider is enabled
3. Check browser console for auth errors

### Changes Not Syncing
1. Check internet connection
2. Verify Firestore rules allow writes
3. Check browser console for errors

---

## Updating Your App

After making changes:

```bash
# Test locally (optional)
firebase emulators:start

# Deploy updates
firebase deploy
```

---

## Free Tier Limits

Firebase Spark Plan (Free):
- **Authentication**: 10,000 users/month
- **Firestore**: 50K reads/day, 20K writes/day, 1GB storage
- **Hosting**: 1GB storage, 10GB/month bandwidth

These limits are more than enough for personal use!

---

## Next Steps

1. ✅ Test all features on the deployed app
2. ✅ Share the URL with your friend
3. ✅ Add app to home screen on mobile
4. (Optional) Set up Google Analytics
5. (Optional) Add Push Notifications

---

Your app is now live on Firebase! 🚀

**Your URL**: `https://your-project.web.app`

Share it and start tracking time!
