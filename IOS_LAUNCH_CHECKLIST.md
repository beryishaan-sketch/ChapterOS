# ChapterOS — iOS Launch Checklist

## Status: PWA Ready NOW ✅ | App Store: Needs Mac

---

## Phase 1 — RIGHT NOW (No Mac needed)
Brothers can use ChapterOS TODAY on iPhone via Safari PWA:
- Open the Railway URL in Safari
- Tap Share → Add to Home Screen
- Full-screen app, works offline, push notifications via web
- Zero App Store approval needed

---

## Phase 2 — App Store Submission (Needs Mac + Xcode)

### Prerequisites
- [ ] Mac with Xcode 15+
- [ ] Apple Developer account ($99/year) → developer.apple.com
- [ ] Railway app is LIVE with a real URL
- [ ] `com.chapteros.app` bundle ID registered in Apple Developer portal

### On your Mac:

```bash
# 1. Clone the repo
git clone https://github.com/beryishaan-sketch/ChapterOS.git
cd ChapterOS/frontend

# 2. Install dependencies
npm install

# 3. Update capacitor.config.json with your live Railway URL
# Change server.url to: https://your-app.up.railway.app

# 4. Build the web app
npm run build

# 5. Sync to iOS
npx cap sync ios

# 6. Open in Xcode
npx cap open ios
```

### In Xcode:
- [ ] Select your Apple Developer Team (Signing & Capabilities)
- [ ] Bundle ID: `com.chapteros.app`
- [ ] Add Push Notifications capability
- [ ] Set deployment target: iOS 16.0+
- [ ] Add app icons (1024x1024 PNG for App Store)
- [ ] Product → Archive → Distribute App → App Store Connect

### App Store Connect:
- [ ] Create new app at appstoreconnect.apple.com
- [ ] App name: ChapterOS
- [ ] Category: Business
- [ ] Screenshots: 6.5" iPhone (iPhone 14 Pro Max)
- [ ] Description, keywords, privacy policy URL
- [ ] Submit for review (~24-48h)

---

## App Icons Needed (Create these)
| Size | Usage |
|------|-------|
| 1024x1024 | App Store |
| 180x180 | iPhone home screen (@3x) |
| 120x120 | iPhone home screen (@2x) |
| 60x60 | iPhone home screen (@1x) |

Use: https://appicon.co — upload 1024x1024, download all sizes

---

## Update capacitor.config.json Before Building

```json
{
  "appId": "com.chapteros.app",
  "appName": "ChapterOS",
  "webDir": "dist",
  "server": {
    "url": "https://YOUR-RAILWAY-URL.up.railway.app",
    "cleartext": false
  }
}
```

---

## Timeline Estimate
- Railway live: TODAY
- Brothers using PWA: TODAY (just share the link)
- App Store submission: 1-2 hours on a Mac
- App Store approval: 1-3 days
- Brothers downloading from App Store: ~1 week from now

---

## Bottom Line
You don't need the App Store to launch. Share the Railway URL, brothers add it to their home screen, it works identically to a native app. App Store is just for discoverability.
