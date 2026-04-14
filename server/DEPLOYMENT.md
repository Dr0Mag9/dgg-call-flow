# CallFlow API — Ubuntu 24.04 VPS deployment

Target host example: `69.62.79.9`. The API listens on `0.0.0.0` (see `HOST` in `.env`). The React app is built separately (`npm run build` in the project root) and served as static files by Nginx on the same machine.

`server/` is the canonical backend. Root-level `server.ts` and root SQLite files are legacy-only and not used for production deployment.

## 1. Prerequisites

- Node.js 22 LTS (or 20 LTS) via [NodeSource](https://github.com/nodesource/distributions) or `nvm`
- PostgreSQL 16 (`apt install postgresql postgresql-contrib`)
- Nginx (`apt install nginx`)
- Optional: PM2 (`npm i -g pm2`) or use systemd below

## 2. Database

Create a database and user (example):

```sql
CREATE USER callflow WITH PASSWORD 'your-secure-password';
CREATE DATABASE callflow OWNER callflow;
```

Set `DATABASE_URL` in `server/.env`:

```env
DATABASE_URL="postgresql://callflow:your-secure-password@127.0.0.1:5432/callflow"
```

From `server/`:

```bash
npm ci
npx prisma migrate deploy
npm run prisma:seed
npm run build
```

Use `prisma db push` instead of migrate only for a first-time throwaway database (not recommended for production).

## Local development (Ubuntu 24.04)

From repo root:

```bash
npm ci
cd server && npm ci && cd ..
cp server/.env.example server/.env
# Edit server/.env with real DATABASE_URL, JWT_SECRET, and ADMIN_SEED_PASSWORD
npm run prisma:setup:server
npm run dev
```

This starts:

- API at `http://127.0.0.1:3001`
- Vite frontend at `http://127.0.0.1:5173`

Root `vite.config.ts` proxies `/api` and `/socket.io` to `http://127.0.0.1:3001`.

## 3. Environment (`server/.env`)

Copy `server/.env.example` and set at minimum:

- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — long random string (16+ characters)
- `ADMIN_SEED_PASSWORD` — required by seed to create/update `admin@dgg.com` with bcrypt
- `CLIENT_ORIGINS` — comma-separated browser origins, e.g. `http://69.62.79.9,https://69.62.79.9,http://localhost:5173`
- `PORT` — e.g. `3001` (Nginx will proxy to this)
- `HOST` — `0.0.0.0`

Optional:

- `INBOUND_WEBHOOK_SECRET` — if set, `POST /api/calls/inbound` must send header `X-Inbound-Secret: <secret>` or `Authorization: Bearer <secret>` (for a future telephony webhook).

## 4. Process manager

### PM2

```bash
cd /path/to/Call_Flow
pm2 start server/ecosystem.config.cjs --env production
pm2 save
pm2 startup
```

### systemd (alternative)

Create `/etc/systemd/system/callflow-api.service`:

```ini
[Unit]
Description=CallFlow API
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/Call_Flow/server
EnvironmentFile=/path/to/Call_Flow/server/.env
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Then: `sudo systemctl daemon-reload && sudo systemctl enable --now callflow-api`

## 5. Nginx

Build the frontend on the VPS (`npm ci && npm run build` in the repo root). Point `root` to `dist/`. Proxy API and WebSocket to the Node port.

Example server block:

```nginx
server {
    listen 80;
    server_name 69.62.79.9;

    root /path/to/Call_Flow/dist;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /socket.io/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Enable TLS with Certbot when you have a domain (`certbot --nginx`).

## 6. Firewall

Allow SSH, HTTP, HTTPS (e.g. `ufw allow OpenSSH && ufw allow 'Nginx Full' && ufw enable`).

## 7. Migrating from SQLite (old dev DB)

The backend in `server/` uses PostgreSQL. Export/import data with your own ETL or re-seed (`npm run prisma:seed` in `server/`) after `migrate deploy`.

## 8. Health check

`GET /api/health` returns `{ "status": "ok", "timestamp": "..." }`.

## 9. API paths used in deployment

- Auth: `/api/auth/*`
- Admin: `/api/admin/*`
- Agents: `/api/agents/*`
- Clients: `/api/clients/*`
- Calls: `/api/calls/*`
- Tasks: `/api/tasks/*`
- Materials: `/api/materials/*`
- Settings: `/api/settings/*`
- Webhooks: `/api/settings/webhooks/*` and `/api/webhooks/*`
