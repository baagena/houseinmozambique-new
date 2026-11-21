# Hosting houseinmozambique.com on the VPS (Docker)

The site runs in Docker on the same Contabo VPS as RoadReady, behind nginx:

```
internet → nginx (80/443, Let's Encrypt) → 127.0.0.1:3010 → container "houseinmozambique" (Next.js)
```

RoadReady keeps port 3000; this site uses 3010. Files: `Dockerfile`,
`docker-compose.yml`, `deploy.sh`, `nginx/houseinmozambique.conf`,
`.env.production.example`, `.github/workflows/deploy-vps.yml`.

Run every command below **on the VPS** (`ssh root@<server-ip>`).

## 1. First install (once)

```bash
# Docker and nginx are already there for RoadReady; check:
docker --version && docker compose version && nginx -v

# Get the code (the repository is private: use a deploy key or a GitHub token)
sudo mkdir -p /var/www && cd /var/www
git clone https://github.com/baagena/houseinmozambique-new.git houseinmozambique
cd houseinmozambique
chmod +x deploy.sh
```

## 2. Settings (once)

```bash
cp .env.production.example .env.production
nano .env.production     # paste the values from Vercel → Settings → Environment Variables
chmod 600 .env.production
```

- `DATABASE_URL`: the database the site uses today (Neon). Neon is separate from
  Vercel and still works.
- `JWT_SECRET` / `SESSION_SECRET`: **exactly** Vercel's values, or everyone is signed out.
- `FIREBASE_SERVICE_ACCOUNT`: the Firebase key JSON on **one line** (optional).

## 3. Build and start

```bash
./deploy.sh
curl -s http://127.0.0.1:3010/api/health     # → {"ok":true,"db":"up"}
```

The first build takes 5–10 minutes.

## 4. nginx + HTTPS

```bash
sudo cp nginx/houseinmozambique.conf /etc/nginx/sites-available/houseinmozambique.conf
sudo ln -sf /etc/nginx/sites-available/houseinmozambique.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Then point the domain at the server (step 5), and once it resolves:

```bash
sudo apt-get install -y certbot python3-certbot-nginx   # if not installed
sudo certbot --nginx -d houseinmozambique.com -d www.houseinmozambique.com --redirect
```

## 5. DNS (Namecheap)

Namecheap → Domain List → houseinmozambique.com → **Advanced DNS**:

| Type | Host | Value | TTL |
|---|---|---|---|
| A Record | `@` | the VPS IP | Automatic |
| A Record | `www` | the VPS IP | Automatic |

Delete the old Vercel records (A `@` 76.76.21.21 / 216.198.79.x, CNAME `www`
→ `cname.vercel-dns.com`). Changes usually apply within minutes, at most an hour.

## 6. Automatic deploys (optional, like RoadReady)

GitHub → the repository → Settings → Secrets and variables → Actions → add
`VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`. From then on every push to `master`
runs `deploy.sh` on the server.

## Everyday commands

```bash
cd /var/www/houseinmozambique
./deploy.sh                                   # update to the latest master
docker compose ps                             # is it running / healthy?
docker compose logs -f --tail=100             # live logs
docker compose restart                        # restart without rebuilding
```
