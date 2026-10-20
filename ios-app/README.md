# DEAD STOP for iPhone

This folder is a thin iOS shell around the web game. The game you play is still `deadstop.html` at the top of the repo. Nothing here was signed, uploaded to TestFlight, or sent to App Store Connect.

## Open it on your Mac

1. Install Xcode from the Mac App Store and open it once so it can finish installing.
2. Copy this whole `ios-app` folder to the Mac (or clone the repo and switch to the `cursor/dead-stop-13aa` branch).
3. Open Terminal, then:

```
cd ios-app
npm install
npx cap sync ios
```

If that says CocoaPods is not installed, install it with `brew install cocoapods` and run `npx cap sync ios` again. The iPhone project is already in this folder. That command downloads the small library Xcode needs. Until it finishes, Xcode will say the pods are missing.

4. In Finder, open `ios-app/ios/App/App.xcworkspace`. Use the white workspace icon, not the blue project icon.
5. In the left sidebar, click the blue **App** project, then the **App** target.
6. Open **Signing & Capabilities**. Check **Automatically manage signing**. Set **Team** to your Apple ID. If you have no paid account, a free Apple ID can still run the app on your own phone.
7. If Xcode says the bundle id is taken, change **Bundle Identifier** from `com.beryishaan.deadstop` to something only you use, like `com.yourname.deadstop`.
8. Plug in your iPhone, pick it in the device menu at the top, and press the Run button. The first launch may ask you to trust the developer in Settings → General → VPN & Device Management.

## Send it to the App Store yourself

1. In Xcode, set the destination to **Any iOS Device (arm64)**.
2. Menu **Product → Archive**.
3. In the organizer, **Distribute App** and follow Apple’s screens. You need a paid Apple Developer account ($99 a year) for the store.
4. Screenshots, the privacy answers, and the submit button are all in App Store Connect. This repo does not do that step.

When the web game changes, run `npm run sync` inside `ios-app` before you archive again. That copies the latest `deadstop.html` into the app.

## App Store review risk

Apple’s Guideline 4.2 (Minimum Functionality) is a real risk. Reviewers reject apps that are only a website inside a web view, especially a single button mechanic.

What you can point to if they ask:

- A new daily target every day, with a streak.
- Two-player VS on one phone.
- A rank ladder and themes that stay on the device.
- It plays with no account and no network once it is installed, because the game files are inside the app.

That may still not be enough. Apple can reject it. The link in your bio (Add to Home Screen) does not need their approval and is the sure way people play.

Haptics from the web game do not fire inside the iOS app. `navigator.vibrate` is ignored by the iPhone web view. Sound works after the first tap.
