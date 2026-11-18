# Push notifications and Google Analytics — setup

The code is done. Firebase stays **switched off** until the steps below are
finished, so the app works exactly as before in the meantime. Everything here
is done in a web browser; no Mac is needed.

You need about 30 minutes. Do the steps in order.

---

## 1. Check whether you already have a Firebase project

1. Open <https://console.firebase.google.com> and sign in with the Google
   account you use for the business (try each one you have — projects belong to
   the account that created them).
2. If you see a project for House in Mozambique, click it, then the gear icon
   → **Project settings** → scroll to **Your apps**.
   - If an **Android** app `com.houseinmozambique.mobile` and an **iOS** app
     `com.houseinmozambique.mobile` are listed, skip to step 4 and download
     their files.
   - If the project exists but the apps don't, skip to step 3.
3. If there is no project, continue with step 2.

## 2. Create the Firebase project

1. Firebase console → **Create a project** (or **Add project**).
2. Name: `House in Mozambique` → Continue.
3. **Enable Google Analytics for this project: ON** → Continue. This is where
   your app usage numbers will appear.
4. Choose or create a Google Analytics account (e.g. `House in Mozambique`),
   location **Mozambique**, accept the terms → **Create project**.

## 3. Add the two apps to the project

**Android**
1. Project overview → **Add app** → Android icon.
2. Android package name: `com.houseinmozambique.mobile` (exactly).
3. App nickname: `House in Mozambique Android` → **Register app**.
4. **Download google-services.json**. Skip the remaining "add SDK" steps — the
   code already does that.

**iOS**
1. Project overview → **Add app** → iOS icon.
2. Apple bundle ID: `com.houseinmozambique.mobile` (exactly).
3. App nickname: `House in Mozambique iOS`; App Store ID: `6815702309` →
   **Register app**.
4. **Download GoogleService-Info.plist**. Skip the remaining steps.

## 4. Put the two files in the project

1. Create the folder `mobile/firebase/` and put both files in it:
   - `mobile/firebase/google-services.json`
   - `mobile/firebase/GoogleService-Info.plist`
2. From the `mobile` folder run:

   ```
   dart run tool/generate_firebase_options.dart
   ```

   It prints `Android: on, iOS: on` and fills in
   `lib/core/firebase/firebase_options.dart`. (Or ask Claude to run it.)

These two files are safe to commit — Google designs them to ship inside the
app. The server key in step 7 is the secret one.

## 5. Apple: switch on push for the app (REQUIRED before the next iOS build)

The iOS build now asks for push notifications. If the App ID does not have the
capability, Codemagic's signing step fails.

1. <https://developer.apple.com/account> → **Certificates, IDs & Profiles** →
   **Identifiers** → click `com.houseinmozambique.mobile`.
2. Tick **Push Notifications** → **Save** → confirm.

## 6. Apple: give Firebase a push key

1. Same site → **Keys** → **+**.
2. Name `House in Mozambique Push`, tick **Apple Push Notifications service (APNs)** →
   Continue → Register.
3. **Download** the `.p8` file (only possible once — keep it safe, never send it
   by chat or commit it). Note the **Key ID** shown, and your **Team ID** (top
   right of the developer site).
4. Firebase console → gear → **Project settings** → **Cloud Messaging** tab →
   **Apple app configuration** → **APNs Authentication Key** → **Upload** →
   choose the `.p8`, enter Key ID and Team ID → Upload.

## 7. The server key (lets the website send the notifications)

1. Firebase console → gear → **Project settings** → **Service accounts** →
   **Generate new private key** → Generate. A `.json` file downloads.
   **This is a password**: never commit it or send it by chat.
2. Vercel → the `houseinmozambique-new` project → **Settings** →
   **Environment Variables** → **Add**:
   - Key: `FIREBASE_SERVICE_ACCOUNT`
   - Value: open the downloaded `.json` in Notepad, copy **everything**, paste.
   - Environment: Production (and Preview if you use it).
3. Redeploy so the server picks it up.

## 8. The database table for phones

Notifications need one new table, `PushDevice`. Run this once against the
**production** database (the one Vercel uses), from the project root:

```
npx prisma db execute --file prisma/migrations/20261113120000_push_devices/migration.sql
```

It only creates the table, so it is safe to re-run. Do **not** use
`prisma db push` on this database (it would drop live Agent columns).

## 9. Store forms

- **App Store Connect** → the app → **App Privacy**: update the answers to
  match the table in `app-store/APP_STORE_LISTING.md` (Device ID, Product
  interaction, Search history, Coarse location — all "not used for tracking").
- **Google Play Console** → **App content** → **Data safety**: add
  *App activity → App interactions* and *In-app search history*, and
  *Device or other IDs*; collected, **not shared** (Google acts as a service
  provider), purposes **Analytics** and **App functionality**.
- Add a sentence to the website's **privacy policy** saying the app uses Google
  Analytics for Firebase to count usage and Firebase Cloud Messaging for
  notifications. Apple compares the policy with the App Privacy answers.

## 10. Release order

1. Deploy the website (with `FIREBASE_SERVICE_ACCOUNT` set) and run step 8.
2. Build and release the app (`version: 1.3.0+6` in `pubspec.yaml`).

---

## What the notifications are

Only signed-in **agents** and **admins** get them, after the phone asks their
permission. Each can turn them off: Profile → **Push notifications**. Tapping a
notification opens the right screen. Text is in the phone's language (pt/en).

| Who | When |
|---|---|
| Agent | A buyer sends them a lead |
| Agent | Their listing is approved, or needs changes |
| Agent | A buyer request is released to them |
| Agent (Android only) | Their payment is confirmed or rejected |
| Admin | A new listing is waiting for approval |
| Admin | A website contact message arrives |
| Admin | A buyer posts a property request |
| Admin | A new agent or customer signs up |
| Admin (Android only) | A payment proof is waiting to be verified |

Payment notifications never go to iPhones: Apple does not allow the iOS app
to show anything about payments made outside the App Store.

## Where to see how many people use the app

Firebase console → your project → **Analytics** (or <https://analytics.google.com>,
same data):

- **Realtime**: people using the app right now (appears within minutes).
- **Dashboard / Reports → Engagement**: daily, weekly and monthly active users,
  new users, Android vs iPhone, app versions, countries. The first full reports
  take about 24 hours.
- **Events**: `view_item` (listing opened), `generate_lead` (contacted an
  agent: form / whatsapp / call / email), `search`, `add_to_wishlist`, `login`,
  `sign_up`, `listing_submitted`.
- To split guests, customers, agents and admins: Google Analytics → **Admin** →
  **Custom definitions** → **Create custom dimension** → scope **User**, user
  property `account_type`. Do the same for `app_language`. They show in reports
  from then on.

No names, emails or phone numbers are sent to Google — only an anonymous
account id, the account type and which screens are used. The advertising ID is
never collected, so there is no tracking prompt on iPhone.
