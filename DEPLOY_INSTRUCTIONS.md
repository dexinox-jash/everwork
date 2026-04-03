# EverworkApp GitHub Deployment Instructions

## ✅ Pre-Deployment Checklist

All code is committed and ready to push:
- ✅ GitHub Actions workflows configured
- ✅ Android build configured
- ✅ iOS build configured  
- ✅ Firebase integration ready
- ✅ All code committed to local Git

## 🚀 Deployment Steps

### Step 1: Add Your GitHub Remote

**Option A: Using HTTPS**
```bash
cd "c:\Users\Dexinox\Documents\kimi code\EverWork\EverworkApp"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
```

**Option B: Using SSH**
```bash
cd "c:\Users\Dexinox\Documents\kimi code\EverWork\EverworkApp"
git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO_NAME.git
```

### Step 2: Push to GitHub

```bash
git push -u origin main
```

If you get an error about "fetch first", use:
```bash
git push -u origin main --force
```

### Step 3: Verify Push

Go to https://github.com/YOUR_USERNAME/YOUR_REPO_NAME
- You should see all files uploaded
- Check the `.github/workflows/` directory exists

### Step 4: Trigger First Build

1. Go to your GitHub repository
2. Click **Actions** tab
3. You should see two workflows:
   - "Android Build"
   - "iOS Build"
4. Click on either workflow
5. Click **Run workflow** → **Run workflow**

### Step 5: Download Your App

After the build completes (10-20 minutes):
1. Go to the completed workflow run
2. Scroll down to **Artifacts**
3. Download your APK/IPA file

## ⚠️ IMPORTANT: Firebase Configuration Required

Before the builds will work, you MUST add your Firebase config files:

### Android
1. Go to https://console.firebase.google.com/project/ever-work-ee664/settings/general
2. Click **Add app** → **Android**
3. Package name: `com.everwork.app`
4. Download `google-services.json`
5. Place at: `android/app/google-services.json`
6. Commit and push:
```bash
git add android/app/google-services.json
git commit -m "Add Android Firebase config"
git push
```

### iOS
1. Same Firebase page
2. Click **Add app** → **iOS`
3. Bundle ID: `com.everwork.app`
4. Download `GoogleService-Info.plist`
5. Place at: `ios/GoogleService-Info.plist`
6. Commit and push:
```bash
git add ios/GoogleService-Info.plist
git commit -m "Add iOS Firebase config"
git push
```

## 🔗 All Platforms Share Firebase

| Platform | ID | Firebase Project |
|----------|-----|------------------|
| Web | ever-work-ee664.web.app | ever-work-ee664 |
| Android | com.everwork.app | ever-work-ee664 |
| iOS | com.everwork.app | ever-work-ee664 |

All data syncs automatically across all platforms!

## 🆘 Troubleshooting

### "Could not resolve host"
Check your internet connection and GitHub URL.

### "Permission denied"
Make sure you have access to the repository. For HTTPS, you may need to use a Personal Access Token instead of password.

### "Failed to push some refs"
The remote repository has changes you don't have locally. Either:
- Pull first: `git pull origin main`
- Or force push: `git push -u origin main --force` (⚠️ Overwrites remote!)

## 📱 After Deployment

Once pushed to GitHub and Firebase configs are added:
- ✅ Android APK will build automatically
- ✅ iOS IPA will build automatically
- ✅ Download from GitHub Actions artifacts
- ✅ Install on devices

The mobile apps will connect to the same Firebase as your web app!
