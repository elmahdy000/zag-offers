# Zag Offers — Store release checklist

## Required secrets and accounts (do not commit)

- Android admin upload keystore and `zag_offers_admin_app/android/key.properties`.
- Apple Developer team, App Store Connect records, distribution certificates, and provisioning profiles.
- Firebase iOS apps matching the three bundle identifiers, configured on the macOS build machine.
- Stable reviewer accounts for customer, vendor, and admin roles. Never put their passwords in Git.

## Google Play Console

- Upload an AAB signed with the permanent upload key and enable Play App Signing.
- Complete App access with working reviewer credentials and navigation notes.
- Complete Data safety from actual backend/app behavior: account identifiers, contact details, location, photos, app activity, and push tokens as applicable.
- Set privacy policy to `https://zagoffers.online/privacy`.
- Set account deletion URL to `https://zagoffers.online/account-deletion` for customer and vendor apps.
- Complete content rating, target audience, ads declaration, store listing, screenshots, feature graphic, and contact details.
- Confirm the uploaded bundle targets API 36 and passes Play's 16 KB page-size check.
- Prefer managed/private distribution for the admin app unless public availability is a business requirement.

## App Store Connect

- Build and archive on macOS using Xcode 26 and the iOS 26 SDK or newer.
- Select the correct Apple Development Team for every Runner target and enable Push Notifications/Background Modes.
- Configure Firebase for each iOS bundle ID and verify APNs on a physical device and TestFlight.
- Complete App Privacy so it matches each bundled `PrivacyInfo.xcprivacy` and the server-side behavior.
- Complete the current age-rating questionnaire, export compliance, support URL, privacy URL, screenshots, review notes, and working reviewer accounts.
- Complete EU DSA trader status if distributing in the EU.
- Run an Archive validation and TestFlight smoke test before submission.

## Release process

- Increase the build number (`+N`) for every new upload; never reuse an uploaded build number.
- Back up upload keys and Apple credentials in an encrypted credential manager.
- Verify login, logout, password reset, push notifications, camera/photos, location permission denial, and account deletion against production-like services.
- Do not upload the admin Android app until it has its own non-debug upload key.
