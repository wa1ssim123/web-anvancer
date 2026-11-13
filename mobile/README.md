# HORENOVA Mobile — Android & iOS

STATUS: Pre-release prototype. **NOT SUBMITTED TO APP STORE OR GOOGLE PLAY.**

This branch is separate from the deployed website. Existing HORENOVA public files are bundled into the native app with Capacitor 8. Native enhancements: shortcuts, system share, haptics and network-state notice. A production remote server URL is deliberately absent.

## Android
Requires Node 22, Android Studio and Android 16/API 36 SDK.
From repository root:
1. cd mobile
2. npm install
3. npm run android:init
4. npx cap open android
5. Test with a real Android phone and build a **signed release AAB** using your own signing key when ready.

CI builds an **Android debug APK for testing only**, not a Google Play release. Do not publish debug artifacts.

## iOS
Requires macOS, Apple Developer enrollment, Xcode 26+.
1. cd mobile
2. npm install
3. npm run ios:init
4. npx cap open ios
5. Configure Apple team and signing, run on real iPhone, submit via TestFlight and App Store Connect.

The proposed package/bundle id is com.horenova.mobile — availability NOT checked.

## RELEASE BLOCKERS — MUST BE COMPLETED
- Wix Headless authorization and Render API CORS must work from iOS capacitor://localhost and Android https://localhost. The original app authenticates from horenova.com, so native sign-in IS NOT verified.
- Provide **real account deletion** from the app and an external deletion URL. Synchronize data erasure across Wix, Render, and third parties; do not substitute a fake delete button.
- Publish an accurately verified privacy policy; audit data collection and fill Apple App Privacy and Google Play Data safety honestly.
- Test French, English, Arabic, candidate/recruiter/admin, sign-up, login, image upload, navigation, checkout/quoting, interruptions and back gestures on both platforms.
- Replace placeholder Wix catalogue records before claiming ecommerce readiness. Clear rights and supplier permissions for images and uniforms.
- Review Apple's minimum-functionality rule 4.2: a dressed-up WebView does not guarantee App Store approval; deliver authentic mobile value.
- Get actual App Store Connect / Play Console developer-owner accounts, seller information, signed release builds, support URLs, screenshots, valid app age rating, reviewer demo credentials.
- For new Google Play personal accounts, comply with closed testing requirements before production.
- Ensure Android target SDK >=36 as Google currently requires for new phone apps.

OFFICIAL SOURCES
https://capacitorjs.com/docs/getting-started
https://capacitorjs.com/docs/android/setting-target-sdk
https://developer.apple.com/app-store/review/guidelines/
https://developer.apple.com/help/app-review/guideline-reference/5-1-1-account-deletion/
https://support.google.com/googleplay/android-developer/answer/13327111
https://support.google.com/googleplay/android-developer/answer/14151465

Do not commit release keys, service account credentials or production secrets.
