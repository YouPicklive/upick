# YouPick — iOS Build Guide (Complete Xcode Setup)

## Prerequisites

- **Mac** with macOS 14 (Sonoma) or later
- **Xcode 15+** (free from Mac App Store)
- **Node.js 18+** installed
- **CocoaPods** installed: `sudo gem install cocoapods`
- An **Apple Developer Account** ($99/year) for device testing & App Store

---

## Step 1 — Clone & Build Locally

```bash
# Clone your GitHub repo
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO

# Install dependencies
npm install

# Build the web app
npm run build

# Add iOS platform
npx cap add ios

# Sync web assets + plugins
npx cap sync ios

# Open in Xcode
npx cap open ios
```

---

## Step 2 — Xcode Project Settings

Once Xcode opens, click on the **App** project in the left sidebar, then the **App** target:

### General Tab

| Field | Value |
|---|---|
| **Display Name** | `YouPick` |
| **Bundle Identifier** | `live.youpick.app` |
| **Version** | `1.0.0` |
| **Build** | `1` |
| **Minimum Deployments** | `iOS 16.0` |

### Signing & Capabilities Tab

1. Check **"Automatically manage signing"**
2. Select your **Team** (your Apple Developer account)
3. Xcode will create provisioning profiles automatically

### Add Capabilities (click "+ Capability"):

1. **Associated Domains** — add: `applinks:youpick.live`
   - This enables universal links (deep linking from `youpick.live` URLs)

---

## Step 3 — Info.plist Entries

In Xcode, click on **App → Info** tab (or open `ios/App/App/Info.plist`).

Add these entries if not already present:

### Location Permission (required for the spin/discovery feature)

| Key | Type | Value |
|---|---|---|
| `NSLocationWhenInUseUsageDescription` | String | `YouPick uses your location to discover places near you.` |
| `NSLocationAlwaysAndWhenInUseUsageDescription` | String | `YouPick uses your location to discover places near you.` |

### Camera/Photo (if you add photo features later)

| Key | Type | Value |
|---|---|---|
| `NSCameraUsageDescription` | String | `YouPick needs camera access to take photos of your experiences.` |
| `NSPhotoLibraryUsageDescription` | String | `YouPick needs photo library access to share your experiences.` |

### App Transport Security

This should already be configured by Capacitor, but verify this exists in Info.plist:

```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
</dict>
```

---

## Step 4 — App Icons

1. In Xcode, open **Assets.xcassets → AppIcon**
2. You need a **1024×1024** icon image (use your `public/app-icon-1024.png`)
3. Drag it into the **App Store** slot (Xcode 15+ uses a single 1024×1024 icon and auto-generates all sizes)
4. If Xcode shows multiple size slots, use an icon generator:
   - Go to [appicon.co](https://www.appicon.co/)
   - Upload `app-icon-1024.png`
   - Download the generated icon set
   - Drag the entire `AppIcon.appiconset` folder into your Xcode Assets replacing the existing one

---

## Step 5 — Splash/Launch Screen

Capacitor generates a default `LaunchScreen.storyboard`. To customize:

1. Open `ios/App/App/LaunchScreen.storyboard` in Xcode
2. Set the **background color** to `#F7F1E8` (cream)
3. Optionally add your app icon image centered on screen
4. The storyboard view is:
   - Background: cream `#F7F1E8`
   - Center: Your YouPick logo/icon

---

## Step 6 — Production Build (IMPORTANT)

Before building for TestFlight or App Store, you **MUST** update `capacitor.config.ts` to remove the server URL so the app loads from bundled local files instead of a remote server:

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'live.youpick.app',
  appName: 'YouPick',
  webDir: 'dist',
  // REMOVE or comment out the server block for production:
  // server: {
  //   url: 'https://youpick.live',
  //   cleartext: true,
  // },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: '#F7F1E8',
    },
  },
};

export default config;
```

Then rebuild and sync:

```bash
npm run build
npx cap sync ios
```

> **For development/testing**, keep the `server.url` pointed at `https://youpick.live` so you see live changes. For **App Store submission**, remove it so the app is self-contained.

---

## Step 7 — Build & Run

### On Simulator
1. Select a simulator (e.g., iPhone 15 Pro) from the device dropdown in Xcode
2. Press **⌘R** (or click the Play button)

### On Physical Device
1. Connect your iPhone via USB
2. Select your device from the dropdown
3. Press **⌘R**
4. On first run, go to **Settings → General → VPN & Device Management** on the phone to trust your developer certificate

---

## Step 8 — App Store Submission

### Archive the App
1. Select **"Any iOS Device (arm64)"** as the build target (not a simulator)
2. Go to **Product → Archive**
3. When complete, the **Organizer** window opens

### Upload to App Store Connect
1. In Organizer, click **"Distribute App"**
2. Select **"App Store Connect"**
3. Click **"Upload"**
4. Follow the prompts

### App Store Connect Setup
Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com):

1. **Create a new app**:
   - Platform: iOS
   - Name: `YouPick`
   - Primary Language: English (U.S.)
   - Bundle ID: `live.youpick.app`
   - SKU: `youpick-ios-1`

2. **App Information**:
   - Category: Lifestyle
   - Subcategory: Travel (or Food & Drink)
   - Privacy Policy URL: `https://youpick.live/privacy`

3. **Screenshots** (required):
   - iPhone 6.7" display (iPhone 15 Pro Max): minimum 3 screenshots
   - iPhone 6.5" display (iPhone 14 Plus): minimum 3 screenshots
   - Take screenshots from the simulator: **⌘S** while running

4. **App Description**:
```
When you can't decide what to do — spin the wheel and let fate guide you.

YouPick helps you discover local restaurants, cafés, experiences, and hidden gems through a playful spin mechanic. Receive a place, an action, or a fortune that helps you move forward.

Features:
• Spin the wheel to discover nearby places
• Fortune system with themed packs
• Save your favorite discoveries
• Track your alignment streak
• Share experiences with the community

Stop scrolling. Start moving. Let YouPick guide the way.
```

5. **Keywords** (100 chars max):
```
discover,local,restaurants,spin,fortune,explore,nearby,adventure,spontaneous,guide
```

6. **Support URL**: `https://youpick.live`

7. **Submit for Review**

---

## After Every Code Update

```bash
git pull
npm install
npm run build
npx cap sync ios
# Then rebuild in Xcode (⌘R) or re-archive for App Store
```

---

## Apple-Specific Deep Links (Universal Links)

For universal links to work (tapping a `youpick.live` link opens the app):

1. Add the **Associated Domains** capability in Xcode (Step 2 above)
2. Create an `apple-app-site-association` file at `public/.well-known/apple-app-site-association`:

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appIDs": ["YOUR_TEAM_ID.live.youpick.app"],
        "paths": ["*"]
      }
    ]
  }
}
```

3. Replace `YOUR_TEAM_ID` with your Apple Developer Team ID (found in Apple Developer portal → Membership)
4. Deploy the site so the file is accessible at `https://youpick.live/.well-known/apple-app-site-association`

> **Important:** This file must be served with `Content-Type: application/json` and **no** `.json` extension in the filename.

---

## Troubleshooting

| Issue | Fix |
|---|---|
| "No signing certificate" | Xcode → Settings → Accounts → add Apple ID |
| White screen on launch | Make sure `npm run build` was run before `npx cap sync ios` |
| Location not working | Check Info.plist has the `NSLocation` keys above |
| App rejected for missing privacy | Add all required Info.plist usage descriptions |
| Capacitor plugin not found | Run `npx cap sync ios` again, then `pod install` in `ios/App/` |
