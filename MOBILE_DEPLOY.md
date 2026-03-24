# ChapterOS — iOS App Store Deployment

## Prerequisites
- Mac with Xcode 15+ installed
- Apple Developer account (you have this)
- Node.js + npm

## Step 1: Build the web app
```bash
cd frontend
npm run build
```

## Step 2: Install Capacitor CLI
```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios
```

## Step 3: Initialize and add iOS
```bash
npx cap init ChapterOS com.chapteros.app --web-dir dist
npx cap add ios
```

## Step 4: Sync and open in Xcode
```bash
npm run build          # rebuild if needed
npx cap sync
npx cap open ios
```

## Step 5: In Xcode
1. Select your Apple Developer team under Signing & Capabilities
2. Set Bundle Identifier: `com.chapteros.app`
3. Add Push Notifications capability
4. Set deployment target: iOS 16.0+
5. Archive: Product → Archive
6. Distribute to App Store via Xcode Organizer

## App Store listing info
- **App name:** ChapterOS
- **Subtitle:** Greek Life Chapter Management
- **Category:** Business / Productivity
- **Keywords:** fraternity, sorority, greek life, chapter management, dues
- **Description:** (use landing page copy)

## Push Notifications
After App Store approval, configure APNs:
1. Generate APNs key in Apple Developer portal
2. Upload to your push notification service
3. Update backend/.env with APNS_KEY_ID, APNS_TEAM_ID

## Android (future)
```bash
npm install @capacitor/android
npx cap add android
npx cap open android
```
Then build APK/AAB in Android Studio and upload to Play Console.
