# Testing the app on your phone (before the stores)

The phone runs the app straight from this PC, against a **local copy** of the
database. Nothing you do while testing touches the live site, real listings
or real customers, and **no email is ever sent** — emails are printed in the
server window instead.

## Once: prepare the phone (Android)

1. **Settings → About phone** → tap **Build number** 7 times ("You are now a
   developer"). On some phones it's under *Software information*.
2. **Settings → Developer options** → turn on **USB debugging**.
3. Plug the phone into this PC with a USB cable that carries data (some
   charge-only cables don't). On the phone, tap **Allow** on "Allow USB
   debugging?" and tick "Always allow from this computer".
4. Uninstall the Play Store version of House in Mozambique (the test build is
   signed differently, so Android refuses to install it over the store one).

## Every time: start the three parts

Open three terminals in the project folder.

**1. The local database** (skip if it is already running):

```
"C:\Program Files\PostgreSQL\17\bin\pg_ctl.exe" -D ..\local-pg\data -l ..\local-pg\server.log start
```

**2. The local website + API** (leave it running; emails appear here):

```
npm run dev:local
```

**3. The app on the phone** (from the `mobile` folder):

```
adb reverse tcp:3005 tcp:3005
flutter run --dart-define=API_BASE_URL=http://localhost:3005
```

`adb reverse` lets the phone reach this PC's server through the cable. The
first run takes a few minutes; then the app opens on the phone.

**If the app says "No internet" while your Wi-Fi works:** the cable link was
wiped. Android clears it whenever the USB connection drops and reconnects
(a loose cable is enough). Run `adb reverse tcp:3005 tcp:3005` again and pull
down to refresh. The app's data travels through the cable, not Wi-Fi; Wi-Fi
is only needed for photos.

## Changing things while it runs

Edit any file under `mobile/lib`, save, and in terminal 3 press:

- **r** — hot reload: the change appears on the phone in a second or two
- **R** — hot restart: restarts the app (use after bigger changes)
- **q** — quit

Website/API changes (`src/…`) reload by themselves in terminal 2.

## Signing in

Test accounts (local copy only — they do not exist on the live site):

| Role | Email | Password |
|---|---|---|
| Admin | `admin@houseinmoz.test` | `Test@2026` |
| Agent | `agent@houseinmoz.test` | `Test@2026` |
| Private owner | `owner@houseinmoz.test` | `Test@2026` |
| Customer | `customer@houseinmoz.test` | `Test@2026` |

Every real account in the copy (as of 12 November 2026) also has the password
`Test@2026` locally — only in the copy; the live site is unchanged. The local
server signs logins with its own keys, so a test sign-in never works against
the live API.

Resetting the copy (below) brings back the real password hashes and removes
the test accounts. To start from a clean copy again:

```
"C:\Program Files\PostgreSQL\17\bin\dropdb.exe" -h localhost -p 5433 -U postgres house_local
"C:\Program Files\PostgreSQL\17\bin\createdb.exe" -h localhost -p 5433 -U postgres house_local
"C:\Program Files\PostgreSQL\17\bin\pg_restore.exe" -h localhost -p 5433 -U postgres -d house_local --no-owner --no-privileges ..\db-dumps\houseinmozambique_2026-11-12.dump
npx prisma db execute --file prisma/migrations/20261113120000_push_devices/migration.sql
```

(the last line needs `DATABASE_URL=postgresql://postgres@localhost:5433/house_local`
set in that terminal first: `set DATABASE_URL=postgresql://postgres@localhost:5433/house_local`).

## Good to know

- This is a **debug** build: it is slower than the store version and shows a
  small "DEBUG" banner. That is normal.
- Photos you upload still go to the real Cloudinary account (so they display);
  payments, push notifications and the website's Google Analytics are off.
- Debug builds allow plain `http` to reach this PC; store builds never do.
