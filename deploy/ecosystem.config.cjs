/**
 * PM2 process file for the Contabo VPS.
 *
 * ONE instance, fork mode — not cluster. Public pages are cached on disk
 * (ISR) and purged after every write (src/lib/public-cache.ts). With several
 * instances each keeps its own cache, and an edit saved on one would stay
 * stale on the others.
 *
 *   pm2 start deploy/ecosystem.config.cjs && pm2 save
 */
module.exports = {
  apps: [
    {
      name: 'houseinmozambique',
      cwd: '/var/www/houseinmozambique',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000 -H 127.0.0.1',
      exec_mode: 'fork',
      instances: 1,
      env: { NODE_ENV: 'production' },
      max_memory_restart: '1500M',
      time: true,
    },
  ],
};
