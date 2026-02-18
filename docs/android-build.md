# YouPick — Android Build Guide

## Prerequisites

- Node.js 18+
- Android Studio (latest stable)
- Java 17 SDK

---

## Local Setup

```bash
# 1. Export project to GitHub from Lovable, then clone
git clone <YOUR_REPO_URL>
cd <PROJECT_DIR>

# 2. Install dependencies
npm install

# 3. Build the web app (needed for Capacitor sync)
npm run build

# 4. Add Android platform
npx cap add android

# 5. Sync web assets + plugins to native project
npx cap sync android

# 6. Open in Android Studio
npx cap open android
```

---

## Build Debug APK (for internal testing)

1. In Android Studio: **Build → Build Bundle(s) / APK(s) → Build APK(s)**
2. Output: `android/app/build/outputs/apk/debug/app-debug.apk`
3. Install on a device: `adb install app-debug.apk`

## Build Release AAB (for Play Store)

1. In Android Studio: **Build → Generate Signed Bundle / APK**
2. Select **Android App Bundle**
3. Create or select your **upload keystore**
4. Choose **release** build variant
5. Output: `android/app/build/outputs/bundle/release/app-release.aab`

---

## App Icons

After opening the project in Android Studio:

1. Right-click `android/app/src/main/res` → **New → Image Asset**
2. Select **Launcher Icons (Adaptive and Legacy)**
3. For **Foreground Layer**: use `public/app-icon-1024.png`
4. For **Background Layer**: set color `#C96A2B`
5. Adjust padding so the icon looks right in circular/squircle/square masks
6. Click **Next → Finish**

---

## Deep Links

The app is configured to handle `https://youpick.live/*` links.

For verified deep links (auto-open without disambiguation dialog):

1. Build your release AAB or APK
2. Get your signing key SHA-256 fingerprint:
   ```bash
   keytool -list -v -keystore your-keystore.jks -alias your-alias
   ```
3. Replace `REPLACE_WITH_YOUR_SIGNING_KEY_SHA256_FINGERPRINT` in `public/.well-known/assetlinks.json` with the actual fingerprint
4. Publish the updated site so the file is live at `https://youpick.live/.well-known/assetlinks.json`

---

## After Every Code Change

```bash
git pull
npm install
npm run build
npx cap sync android
# Then rebuild in Android Studio
```

---

## Play Console Upload Checklist

- [ ] Create a new app in [Google Play Console](https://play.google.com/console)
- [ ] Set **App name**: YouPick
- [ ] Set **Default language**: English (United States)
- [ ] Select **App** (not Game)
- [ ] Select **Free**
- [ ] Upload the release AAB to **Internal testing** track
- [ ] Fill in **Store listing**:
  - Short description (80 chars max)
  - Full description
  - App icon (512×512) — use `public/app-icon-512.png`
  - Feature graphic (1024×500)
  - Phone screenshots (minimum 2)
- [ ] Set **Privacy policy URL**: `https://youpick.live/privacy`
- [ ] Complete **Content rating** questionnaire
- [ ] Complete **Target audience and content** section
- [ ] Complete **Data safety** section
- [ ] Add signing key SHA-256 to `assetlinks.json` and redeploy
- [ ] **Review and roll out** to internal testers
- [ ] After testing, promote to **Production** track
