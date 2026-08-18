# House in Mozambique — Mobile App

The official Flutter client for [houseinmozambique.com](https://www.houseinmozambique.com), Mozambique's
property marketplace. Buyers and renters browse listings, save favourites and contact agents; agents
manage their own listings and leads; admins moderate the whole catalogue — all against the same backend
that powers the website.

| | |
| --- | --- |
| Store name | **HouseInMoz** |
| Package / bundle id | `com.houseinmozambique.mobile` |
| Platforms | Android (Google Play) and iOS |
| Languages | English (`en`) and Portuguese (`pt`) |
| Backend | the Next.js app in this repo's root, at `/api/mobile/v1` |

---

## Quick start

```bash
cd mobile
flutter pub get
flutter run          # debug build on the connected device/emulator
```

That's it — a fresh clone runs straight against **production** (`https://www.houseinmozambique.com`),
so you get real listings with no local setup. See [Environments](#environments) to point it elsewhere.

Requires Flutter **3.35.x** stable (Dart SDK `^3.9.2`). Verify with `flutter doctor`.

---

## Who uses the app

The app has three audiences, and the UI it shows depends on who's signed in.

| | Signed in as | What they get |
| --- | --- | --- |
| **Guest** | nobody | Browse everything, save favourites on-device, contact agents |
| **Customer** | `role: CUSTOMER` | The above + favourites synced to their account across devices |
| **Agent** | `role: AGENT` | The above + their own listings, leads inbox, public profile, plans |
| **Admin** | `role: ADMIN` | The above + the moderation dashboard |

Guests are never blocked from browsing. Sign-in is only asked for when an action genuinely needs an
account — and when a guest with saved favourites signs up, those local favourites are merged into the
new account rather than lost (`FavoritesController.mergeLocalIntoServer`).

## Features

**For everyone (no account needed)**
- Home feed with featured and recent listings, plus a rotating ad banner carousel
- Search and filter properties; full-screen property detail with photo gallery
- Favourites — stored on-device for guests, merged into the account on sign-up/sign-in
- Agent directory and individual agent profiles
- Blog / news articles
- Contact form, plus one-tap call, e-mail and WhatsApp links to agents

**For agents**
- Register and sign in as an agent
- Create, edit and remove listings, with photo upload from camera or gallery
- Leads inbox with read tracking
- Editable public agent profile and account settings
- Manual (mobile-money / bank transfer) payment submission for paid plans

**For admins**
- Dashboard covering listing approvals, agents, properties, ads, blog posts, activity log and settings

## Screen map

Routing is `go_router`. The four tabs live inside a `StatefulShellRoute` (each keeps its own navigation
stack); everything else is pushed on top.

```
/splash, /onboarding          first-run flow

  tabs (bottom navigation shell)
    /home                     featured + recent listings, ad banner
    /explore                  search and filters
    /agents                   agent directory
    /profile                  guest / customer / agent view of the same tab
    /my-listings, /my-leads   agent tabs, swapped in when signed in as an agent

/property/:id                 property detail + gallery + contact
/agent/:id                    public agent profile
/favorites                    saved properties
/blog, /blog/:slug            articles
/contact, /settings           contact form, language + account settings
/agent-login, /agent-register auth

/dashboard                    agent area
  /listings, /listings/new, /listings/:id/edit, /leads, /profile

/admin                        admin area
  /approvals, /agents, /properties, /ads, /blog, /activities, /settings
```

## Tech stack

| Concern | Choice |
| --- | --- |
| Framework | Flutter 3.35.x stable (Dart SDK `^3.9.2`) |
| State management | `flutter_riverpod` |
| Navigation | `go_router` with a `StatefulShellRoute` bottom-nav shell |
| Networking | `dio` via `lib/core/network/api_client.dart` |
| Auth storage | `flutter_secure_storage` (JWT — Keychain / EncryptedSharedPreferences) |
| Local prefs | `shared_preferences` (guest favourites, onboarding flag) |
| Localisation | `easy_localization` — `assets/translations/{en,pt}.json` |
| Images | `cached_network_image`, `image_picker`, `shimmer` placeholders |
| Deep links out | `url_launcher` (tel, mailto, WhatsApp, browser) |

### Project layout

```
lib/
  main.dart
  core/         network client + API config, router, theme, secure/local storage, utils
  controllers/  Riverpod controllers (auth, favorites, search)
  repositories/ one per API area (properties, agents, blog, admin, leads, payments, …)
  models/       plain Dart models (property, agent, blog post, lead, ad)
  features/     one folder per screen area (home, search, property_detail, admin, …)
  widgets/      shared UI (app shell, property/agent cards, shimmer loaders, ad banner)
assets/
  translations/ en.json, pt.json
  icon/         launcher icon sources
  images/       logo
  fonts/        Roboto regular / medium / bold
```

The convention: **screens don't call the network.** A screen watches a Riverpod provider, the provider
uses a repository, and the repository is the only thing that knows about endpoints and JSON shapes. Add
a new API area by adding a repository, not by reaching for `dio` inside a widget.

Theme colours in `lib/core/theme/app_theme.dart` are ported 1:1 from the website's Material 3 tokens in
`src/app/globals.css`, so both products read as the same brand.

## Backend

The app talks to the Next.js app in this repository's root — the same database and the same business
rules as the website, exposed through a mobile-specific API namespace:

```
src/app/api/mobile/v1/
  auth/       login, register, me            → JWT bearer token
  home/       featured + recent feed
  properties/ list, detail, agent CRUD
  agents/     directory + profiles
  favorites/  list, toggle, merge-on-signup
  blog/       posts
  agent/      dashboard, listings, leads, profile
  admin/      approvals, agents, properties, ads, blog, activities, settings
```

A few shared public routes (inquiries, payments) sit outside that namespace at the site root, because
the website already exposes them as public JSON — see `ApiConfig.rootUrl` vs `ApiConfig.baseUrl` in
`lib/core/network/api_config.dart`.

`lib/core/network/isrg_root_x1.dart` bundles the Let's Encrypt **ISRG Root X1** certificate into the
`dio` `SecurityContext`. Without it, HTTPS fails on Android devices older than 7.1 — their OS trust
stores predate that root, and a good share of the Mozambican install base is on those devices. Don't
remove it.

## Environments

There is no `.env`. The base URL is a compile-time constant, overridden with `--dart-define`:

```bash
# production (the default — no flag needed)
flutter run

# staging or a preview deployment
flutter run --dart-define=API_BASE_URL=https://staging.example.com

# your local Next.js dev server, from an Android emulator
# (10.0.2.2 is the host machine as seen from the emulator; 3000 is `npm run dev`)
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000
```

Pointing at a plain-`http` local server also needs cleartext traffic enabled — Android blocks it by
default since Android 9. Add `android:usesCleartextTraffic="true"` to the `<application>` tag in
`android/app/src/debug/AndroidManifest.xml` (debug only — never in `main`).

## Localisation

Every user-facing string goes through `easy_localization`. Add the key to **both**
`assets/translations/en.json` and `assets/translations/pt.json`, then use `'my.key'.tr()`. A key present
in only one file falls back to the raw key on screen, which is how missing Portuguese usually shows up.
Portuguese is the primary language for most users — test in `pt` before shipping, not only in `en`.

## Permissions

Deliberately minimal, because every extra permission is another question on the Play data-safety form:

- **Android** — `INTERNET` only. The `<queries>` block declares the browser / dialer / mailto intents
  that `url_launcher` needs under Android 11+ package visibility. Camera and gallery access is handled
  by `image_picker` through the system picker, so no storage permission is declared.
- **iOS** — ⚠️ `NSCameraUsageDescription` and `NSPhotoLibraryUsageDescription` are **not yet in**
  `ios/Runner/Info.plist`. `image_picker` needs both for listing photo upload: without them the picker
  crashes the app on device, and App Store review rejects the build. Add them (in Portuguese and
  English via `InfoPlist.strings`) before the first iOS submission. Android is unaffected.

## Everyday commands

```bash
flutter pub get                    # dependencies
flutter run                        # debug build, hot reload
flutter analyze                    # lints (flutter_lints)
flutter test                       # widget tests
dart run flutter_launcher_icons    # regenerate launcher icons from assets/icon/
```

---

## Release builds

### Signing (Android)

Release signing credentials live in `android/key.properties`, which is **gitignored** along with the
keystore itself (`android/app/*.jks`, `*.keystore`). Keep both in a password manager or secure store —
losing the upload key means you can no longer update the Play listing without Google's key-reset
process.

`android/key.properties` format:

```properties
storePassword=…
keyPassword=…
keyAlias=…
storeFile=/absolute/path/to/upload-keystore.jks
```

Without that file the release build **silently falls back to debug signing** (see
`android/app/build.gradle.kts`), so `flutter run --release` still works on a fresh clone — but that
artifact cannot be uploaded to Play. Always confirm `android/key.properties` is present before building
a store bundle.

### Versioning

Bump `version:` in `pubspec.yaml` before every store upload — `1.0.0+1` is `versionName+versionCode`.
Google Play rejects any bundle whose `versionCode` is not higher than the last one uploaded, **including
builds already consumed by internal or closed testing**.

### Build commands

```bash
# Google Play (App Bundle)
flutter build appbundle --release
# → build/app/outputs/bundle/release/app-release.aab

# Direct-install APK (not for Play)
flutter build apk --release

# iOS (run on macOS, then archive and upload in Xcode)
flutter build ipa --release
```

## Publishing checklist

Before promoting a build from closed testing to production:

1. `flutter analyze` and `flutter test` are clean.
2. `pubspec.yaml` version **and** build number bumped past the last uploaded build.
3. `android/key.properties` present, so the bundle is signed with the upload key.
4. Release build smoke-tested on a physical device in **both** English and Portuguese: sign-up, sign-in,
   search, favourites (guest → account merge), property contact, agent listing create/edit, photo
   upload.
5. Play Console data-safety form matches what the app actually collects — account details, inquiry
   contact details, uploaded photos.
6. Account deletion route live and linked in the listing:
   [houseinmozambique.com/delete-account](https://www.houseinmozambique.com/delete-account). Google Play
   requires this for any app with accounts.
7. Privacy policy and terms reachable:
   [/privacy](https://www.houseinmozambique.com/privacy) and
   [/terms](https://www.houseinmozambique.com/terms).
8. Store listing assets current: icon, feature graphic, phone + tablet screenshots, short and full
   description in English and Portuguese.
9. Production API is the target — no leftover `--dart-define=API_BASE_URL` pointing at staging.
10. iOS only: camera and photo-library usage strings present in `Info.plist` (see
    [Permissions](#permissions) — currently missing).

## Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| Every request fails on an old Android phone | ISRG Root X1 handling was removed or bypassed in `api_client.dart` — restore it |
| Requests fail only against a local dev server | `http://` needs `usesCleartextTraffic` in the debug manifest; from an emulator use `10.0.2.2`, not `localhost` |
| Play upload rejected: "version code already used" | Bump the `+N` build number in `pubspec.yaml` |
| Play upload rejected: "debug signature" | `android/key.properties` was missing at build time |
| A label shows as `some.key.name` on screen | Translation key missing from `en.json` or `pt.json` |
| Icon didn't change after editing `assets/icon/` | Re-run `dart run flutter_launcher_icons`, then rebuild |

## Licence

Proprietary — © House in Mozambique. All rights reserved.
