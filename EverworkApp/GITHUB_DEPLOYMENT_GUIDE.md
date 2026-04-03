# GitHub Deployment Guide - EverWork Mobile Apps

## Overview
This guide helps you deploy the EverWork mobile apps (Android & iOS) using GitHub Actions for cloud builds.

## Prerequisites

### 1. GitHub Repository
You need a GitHub repository. Two options:

**Option A: Use Existing Repository**
If you already have the web app on GitHub, add the mobile app as a subdirectory.

**Option B: Create New Repository**
Create a new repo specifically for the mobile app.

### 2. Firebase Configuration (REQUIRED)
Download these files from Firebase Console:

#### Android - `google-services.json`
1. Go to https://console.firebase.google.com/project/ever-work-ee664/settings/general
2. Click "Add app" → "Android"
3. Package name: `com.everwork.app`
4. Download `google-services.json`
5. Place at: `android/app/google-services.json`

#### iOS - `GoogleService-Info.plist`
1. Go to https://console.firebase.google.com/project/ever-work-ee664/settings/general
2. Click "Add app" → "iOS"
3. Bundle ID: `com.everwork.app`
4. Download `GoogleService-Info.plist`
5. Place at: `ios/GoogleService-Info.plist`

## Deployment Steps

### Step 1: Commit Firebase Config Files

```bash
cd EverworkApp
git add android/app/google-services.json
git add ios/GoogleService-Info.plist
git commit -m "Add Firebase configuration for Android and iOS"
```

### Step 2: Push to GitHub

```bash
# If using existing repo
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main

# Or if it's a new repo
git push -u origin main
```

### Step 3: Trigger Build

#### Automatic Build
The GitHub Actions will automatically trigger on:
- Push to `main` or `master` branch
- Pull requests to `main` or `master`
- Tag pushes (e.g., `v1.0.0`)

#### Manual Build
1. Go to your GitHub repository
2. Click **Actions** tab
3. Select **Android Build** or **iOS Build**
4. Click **Run workflow**

### Step 4: Download Builds

After build completes:
1. Go to **Actions** tab
2. Click on the completed workflow run
3. Scroll to **Artifacts** section
4. Download:
   - `app-release.apk` for Android
   - `ios-app-release` for iOS

## Build Status

| Platform | Status | Build Time |
|----------|--------|------------|
| Android | Automated via GitHub Actions | ~10-15 minutes |
| iOS | Automated via GitHub Actions | ~15-20 minutes |

## Firebase Integration

All platforms use the same Firebase project:
- **Project ID**: `ever-work-ee664`
- **Web**: https://ever-work-ee664.web.app
- **Android**: Package `com.everwork.app`
- **iOS**: Bundle ID `com.everwork.app`

Data syncs across all platforms automatically!

## Troubleshooting

### Android Build Fails
- Check `google-services.json` is in `android/app/`
- Verify package name matches: `com.everwork.app`

### iOS Build Fails
- Check `GoogleService-Info.plist` is in `ios/`
- Verify bundle ID matches: `com.everwork.app`

### Firebase Not Connecting
- Ensure you downloaded config files from correct Firebase project
- Check that app is registered in Firebase Console

## Security Note

**DO NOT commit Firebase config files to public repos!**

The `.gitignore` already excludes:
- `google-services.json`
- `GoogleService-Info.plist`

For CI/CD, use GitHub Secrets:
1. Go to Settings → Secrets → Actions
2. Add `GOOGLE_SERVICES_JSON` secret
3. Add `GOOGLE_SERVICE_INFO_PLIST` secret
