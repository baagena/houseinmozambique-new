# Releasing the iOS app without a Mac

The iOS build is made in the cloud by [Codemagic](https://codemagic.io), using
`codemagic.yaml` at the repository root. Everything below is done in a web
browser from Windows.

## What is different in the iOS build

- **No plans, prices or payment instructions.** Apple rejects apps that show a
  way to pay other than Apple in-app purchase. On iOS the "post a listing" form
  opens directly on the listing details and submits on the free Standard plan.
  The switch is `showsPaidPlans` in `lib/core/utils/store_policy.dart`; Android
  and the website are unchanged.
- **Terms and privacy** must be ticked before an account can be created.
- **Account deletion** is under Profile -> Delete account (asks for the
  password). Apple requires this.

## One-time setup

1. **Apple Developer Program** - enrol at developer.apple.com/programs
   ($99/year). Wait for the approval email.
2. **Register the bundle ID** - developer.apple.com -> Certificates, IDs &
   Profiles -> Identifiers -> "+" -> App IDs -> App ->
   Bundle ID (explicit) `com.houseinmozambique.mobile`.
3. **Create the app** - appstoreconnect.apple.com -> Apps -> "+" -> New App.
   Platform iOS, bundle ID above, SKU e.g. `houseinmozambique-ios`.
   Then open App Information and copy the **Apple ID** (a number).
   Done: the Apple ID is `6815702309` and is set in `codemagic.yaml`.
4. **Create an API key** - App Store Connect -> Users and Access ->
   Integrations tab -> App Store Connect API -> Team Keys. The first time,
   click "Request Access" (Account Holder only). Then "+", any name, role
   **App Manager** -> Generate. Download the `.p8` file (only downloadable
   once). Two values on that page are needed:
   - **Issuer ID** - one ID for the whole Apple account, shown above the
     keys table (looks like `57246542-96fe-1a63-e053-0824d011072a`).
   - **Key ID** - the ID of the key just created, in its row of the table
     (10 characters, e.g. `2X9R4HXF34`).
   The `.p8` is a password: never commit it or send it by chat.
5. **Codemagic** - sign up at codemagic.io with GitHub and add the
   `baagena/houseinmozambique-new` repository (project type Flutter App).
   - Settings -> Integrations -> Developer Portal -> Manage keys -> add
     the key: name it exactly `HouseInMozambique ASC key`, paste the
     Issuer ID and Key ID and upload the `.p8`.

## Each release

1. Make sure the backend is deployed (the app calls
   `DELETE /api/mobile/v1/auth/me` for account deletion, and production needs
   `npx prisma db push` for `Agent.termsAcceptedAt`).
2. Bump `version:` in `mobile/pubspec.yaml` (e.g. `1.2.1+4` -> `1.2.2+5`).
   The build number is set automatically; the version name is what users see.
3. Codemagic -> the app -> Start new build -> workflow **iOS release
   (TestFlight)** -> branch.
4. About 20-30 minutes later the build appears in App Store Connect ->
   TestFlight. Install the TestFlight app on any iPhone and test sign-up,
   posting a listing, and deleting an account.
5. App Store Connect -> the app -> the version -> choose the build ->
   **Add for Review** -> **Submit to App Review**.

## App Store listing

Everything to paste into App Store Connect — name, subtitle, description,
keywords, URLs, age rating, App Privacy answers and the review notes — is in
[app-store/APP_STORE_LISTING.md](app-store/APP_STORE_LISTING.md). The six
store screenshots (iPhone 6.9", 1320 × 2868) are in
`app-store/screenshots/iphone-6.9/`.

The iOS target is iPhone-only (`TARGETED_DEVICE_FAMILY = 1`), so no iPad
screenshots are needed.

To see the iOS behaviour without an iPhone, run the app with
`--dart-define=SIMULATE_IOS=true` (e.g. in Chrome).

## App Store listing checklist

- Screenshots: 6.9" iPhone (1320 x 2868) - can be taken from any iPhone via
  TestFlight, or from the Chrome web build resized.
- Privacy policy URL: `https://www.houseinmozambique.com/privacy`
- Support URL: `https://www.houseinmozambique.com/contact`
- App Privacy: collects name, email, phone number, photos (user content);
  linked to the user; not used for tracking.
- App Review Information: give a **working demo login** (a test agent
  account) and write: "Account deletion: Profile -> Delete account."
- Do not mention prices, plans or paying outside the app anywhere in the
  description, screenshots or review notes.
