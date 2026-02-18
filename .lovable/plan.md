

# Native Android Wrapper for YouPick

## Overview

This plan adds a Capacitor-based Android wrapper that loads the production YouPick website (https://youpick.live) in a native WebView. No existing app code, pages, or database schema will be changed.

---

## What You'll Get

- A native Android app shell that opens your live website
- Your existing app icon adapted for Android's adaptive icon format
- Deep link support so shared links open inside the app
- Location permission configured for the discovery features
- Build instructions for generating a test APK and a Play Store bundle (AAB)
- A short Play Console upload checklist

---

## Technical Details

### 1. Install Capacitor Dependencies

Add to `package.json`:
- `@capacitor/core`
- `@capacitor/cli` (dev dependency)
- `@capacitor/android`
- `@capacitor/geolocation` (for native location permission handling)

### 2. Create `capacitor.config.ts`

```text
appId:      live.youpick.app
appName:    YouPick
webDir:     dist

server.url:         https://youpick.live
server.cleartext:   true

plugins.SplashScreen:
  launchAutoHide: true
  backgroundColor: #F7F1E8
```

The `server.url` points to the live production site so the Android app is purely a wrapper -- no local build is loaded at runtime.

### 3. Android Project Generation

Running `npx cap add android` creates the `/android` folder. After that, the following files are customized:

#### a. App Icons (Adaptive Icons)

Use the existing `public/app-icon-512.png` and `public/app-icon-1024.png` to generate Android adaptive icon resources:
- `android/app/src/main/res/mipmap-*/ic_launcher.png` (multiple densities)
- Foreground layer: the gold wheel/chopsticks mark
- Background layer: solid `#C96A2B` (burnt orange brand color)

Provide a script or instructions to use Android Studio's Image Asset Studio for final icon generation from the existing 1024px asset.

#### b. Splash Screen

Configure a simple splash using the brand background color (`#F7F1E8`) with the app icon centered. Uses Capacitor's built-in splash screen plugin.

### 4. Deep Links (Intent Filters)

Add to `android/app/src/main/AndroidManifest.xml`:

```text
<intent-filter android:autoVerify="true">
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="https" android:host="youpick.live" />
</intent-filter>
```

This ensures any `https://youpick.live/*` link can open inside the app.

A Digital Asset Links file (`assetlinks.json`) will need to be hosted at `https://youpick.live/.well-known/assetlinks.json` for verified deep links. Instructions will be provided for that step (it's a static JSON file placed in the `public/` folder).

### 5. Permissions

Only the permissions actually used by the app:
- `ACCESS_FINE_LOCATION` and `ACCESS_COARSE_LOCATION` -- used by the geolocation/discovery features
- `INTERNET` -- required for the WebView (default)

No camera permissions needed (the app uses `navigator.share` for image sharing, not camera capture).

### 6. Auth / Session Persistence

Capacitor's WebView uses a persistent `WebView` with cookies and localStorage enabled by default. No special configuration is needed -- login sessions survive app restarts.

### 7. Digital Asset Links File

Create `public/.well-known/assetlinks.json` so Android can verify deep links. This file maps the `live.youpick.app` package to the `youpick.live` domain. The SHA-256 fingerprint will need to be filled in after you generate your signing key.

### 8. Build Instructions (added to README or separate doc)

```text
Step-by-step:
1. Export to GitHub, clone locally
2. npm install
3. npm run build
4. npx cap add android
5. npx cap sync android
6. Open in Android Studio: npx cap open android

Debug APK:
  Android Studio -> Build -> Build Bundle(s)/APK(s) -> Build APK(s)

Release AAB:
  Android Studio -> Build -> Generate Signed Bundle/APK
  Select Android App Bundle (AAB)
  Use your upload keystore
```

### 9. Play Console Upload Checklist

A markdown checklist will be added covering:
- Create app listing in Play Console
- Upload AAB to internal testing track
- Fill in store listing (screenshots, description, privacy policy URL)
- Set content rating questionnaire
- Set target audience and pricing (free)
- Add the signing key SHA-256 to `assetlinks.json`
- Submit for review

---

## Files Created / Modified

| File | Action |
|------|--------|
| `capacitor.config.ts` | Create -- Capacitor configuration |
| `public/.well-known/assetlinks.json` | Create -- Deep link verification |
| `docs/android-build.md` | Create -- Build instructions + Play Console checklist |
| `package.json` | Modify -- Add Capacitor dependencies + sync script |

No existing pages, components, hooks, database tables, or edge functions are modified.

---

## After Approval

Once you approve, I will:
1. Add the Capacitor dependencies to `package.json`
2. Create `capacitor.config.ts` with the production URL configuration
3. Create the deep link verification file
4. Create the build documentation with step-by-step instructions and Play Console checklist
5. You will then need to run the commands locally (export to GitHub, `npm install`, `npx cap add android`, etc.) since the Android project folder is generated by the Capacitor CLI on your machine

