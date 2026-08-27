# CampusOS

A free, self-hosted **student operating system** for managing academic life — tasks, subjects, deadlines, calendars, and group collaboration. Built to feel like a premium consumer app (think Apple Reminders × Things 3 × Notion) while running entirely on your own hardware.

> No paid services. No AI. No external accounts required. Just your laptop, PostgreSQL, and Docker.

---

## Features

- **Authentication** — register / login / logout, secure `bcrypt` password hashing, protected routes (Auth.js v5, Credentials).
- **Dashboard** — greeting, today & overdue tasks, upcoming deadlines, weekly progress ring, subject overview.
- **Subjects** — color-coded courses with professor, semester, and description.
- **Tasks** — full CRUD with priority, status, deadlines, and one-tap completion.
- **Calendar** — month / week / day views combining tasks and events.
- **Groups** — create/join groups, invite by email, share tasks, and comment.
- **Design system** — Inter typography, light/dark mode, glassmorphism, Framer Motion animations, mobile-first bottom navigation.
- **PWA-ready** — installable via `manifest.webmanifest`.

---

## Tech Stack

| Layer      | Choice                                  |
| ---------- | --------------------------------------- |
| Framework  | Next.js 15 (App Router) + React 19      |
| Language   | TypeScript (strict)                     |
| Styling    | Tailwind CSS v3 + Framer Motion         |
| Database   | PostgreSQL + Prisma                     |
| Auth       | Auth.js v5 (Credentials + JWT)          |
| Validation | Zod                                     |
| Deploy     | Docker + Docker Compose                 |

---

## Quick Start (Docker — recommended)

```bash
# 1. Configure environment
cp .env.example .env
# Generate a secret:  openssl rand -base64 32   and paste into AUTH_SECRET

# 2. Start the stack (Postgres + app)
docker compose up -d --build

# 3. Apply the database schema
docker compose exec app npx prisma migrate deploy

# 4. (Optional) Seed demo data
docker compose exec app npx prisma db seed

# 5. Open http://localhost:3000
```

The app is now running locally at http://localhost:3000.

---

## Internet Access (free, self-hosted, local DB)

CampusOS keeps its **PostgreSQL database on your laptop** and is served by the Docker container, but it is reachable from anywhere via a **Cloudflare Tunnel** — a free, no-port-forwarding, no-static-IP, no-domain-required way to expose a local service over HTTPS. No paid services involved.

### 1. Point Auth.js at your public URL

Auth.js must know the public origin so it issues cookies/redirects correctly. Edit `.env` (and `docker-compose.yml`'s `AUTH_URL`) to your tunnel URL **before** starting/restarting the app:

```bash
# .env  (used for local `npm run dev`)
AUTH_URL="https://campusos.your-domain.com"   # or the *.trycloudflare.com URL
AUTH_SECRET="<a long random string: openssl rand -base64 32>"
```

> `trustHost: true` is already enabled in `src/lib/auth.config.ts`, so Auth.js trusts the
> `x-forwarded-*` headers Cloudflare sends. Without it, login/registration fail in production.

### 2. Install `cloudflared` (free)

- macOS: `brew install cloudflared`
- Windows: `winget install Cloudflare.cloudflared`
- Linux: see https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/

### 3a. Quick tunnel (no account needed, random URL)

```bash
cloudflared tunnel --url http://localhost:3000
```

Cloudflare prints a public `https://xxxx.trycloudflare.com` URL. Open it, create an account, and log in — everything works over the internet. The URL changes each restart, so use option 3b for a stable link.

### 3b. Named tunnel (free Cloudflare account, stable URL / your own domain)

```bash
cloudflared tunnel login            # authenticates; pick a domain or use a free subdomain
cloudflared tunnel create campusos
# Point a DNS record (e.g. campusos.example.com) at the tunnel, then:
cloudflared tunnel run campusos
```

Now `https://campusos.example.com` serves your locally-hosted app with the local database.

### 4. Restart the app so it picks up `AUTH_URL`/`AUTH_SECRET`

```bash
docker compose up -d --build        # (or: npm run dev)
```

Any user can now **register a new account** and **log in** from any device, anywhere.

> Tip: The tunnel is just a network bridge — your data, sessions, and Postgres never leave your machine.
> To stop exposing it, press `Ctrl-C` on `cloudflared` (or `docker compose down` the app).

---

## Auto-start on Boot (survive reboots)

The containers already use `restart: unless-stopped`, so once Docker is up they recover from crashes. These units make the **whole stack** (Docker Compose + Cloudflare Tunnel) come back automatically after a reboot/shutdown. Service files live in `deploy/`:

| OS      | Files                                                            | Install |
| ------- | --------------------------------------------------------------- | ------- |
| Linux   | `deploy/systemd/campusos.service`, `campusos-tunnel.service`    | see below |
| macOS   | `deploy/launchd/com.campusos.server.plist`, `*.tunnel.plist`    | see below |
| Windows | `deploy/windows/install-tasks.ps1`                              | see below |

A health check (`scripts/healthcheck.sh`) pings the local app + public tunnel URL and shows a **local desktop notification** if either drops (no paid service). On Linux, enable it as a timer:
```bash
sudo cp deploy/systemd/campusos-healthcheck.{service,timer} /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now campusos-healthcheck.timer
```
(macOS: schedule via `launchd` or `cron */5 * * * * /opt/campusos/scripts/healthcheck.sh`.)

> Prerequisite for a **stable** URL (so login keeps working after reboot): use a **named** tunnel.
> `cloudflared tunnel login` → `cloudflared tunnel create campusos` → point DNS at it. The services run `cloudflared tunnel run campusos`. A quick tunnel (`--url`) changes URL each boot and will break Auth.js redirects.

### Linux (systemd)
```bash
sudo cp deploy/systemd/campusos.service /etc/systemd/system/
sudo cp deploy/systemd/campusos-tunnel.service /etc/systemd/system/
# edit WorkingDirectory in both to your clone path (default /opt/campusos) and cloudflared path if needed
sudo systemctl daemon-reload
sudo systemctl enable --now docker          # Docker must start on boot
sudo systemctl enable --now campusos.service
sudo systemctl enable --now campusos-tunnel.service
```

### macOS (launchd)
```bash
# place project at /opt/campusos (or edit WorkingDirectory in the plists)
cp deploy/launchd/com.campusos.server.plist ~/Library/LaunchAgents/
cp deploy/launchd/com.campusos.tunnel.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.campusos.server.plist
launchctl load ~/Library/LaunchAgents/com.campusos.tunnel.plist
# enable Docker Desktop "Start at login"
```

### Windows (Task Scheduler)
```powershell
# run once from PowerShell (as admin):
powershell -ExecutionPolicy Bypass -File deploy\windows\install-tasks.ps1
schtasks /Run /TN CampusOS.Server ; schtasks /Run /TN CampusOS.Tunnel
# ensure Docker Desktop is set to start at login
```

### Manual (any OS)
```bash
./scripts/start.sh        # or scripts/start.cmd on Windows
```

---

## Local Development (without Docker)

```bash
npm install
cp .env.example .env          # set DATABASE_URL to your Postgres instance
npx prisma generate
npx prisma migrate dev
npm run dev                   # http://localhost:3000
```

Useful scripts:

```bash
npm run typecheck             # tsc --noEmit
npm run lint                  # next lint
npm run build                 # production build
npm run prisma:seed           # seed demo data
```

---

## Project Structure

```
src/
  app/
    (auth)/login, (auth)/register      # public auth screens
    (app)/                             # protected app (bottom-nav shell)
      page.tsx                         # dashboard
      subjects/ tasks/ calendar/ groups/ profile/
    api/auth/[...nextauth]             # Auth.js handler
  components/  ui/ layout/ tasks/ subjects/ groups/ calendar/ dashboard/ auth/
  features/    auth/ subjects/ tasks/ groups/ calendar/ + shared/validations
  lib/         prisma.ts auth.ts auth.config.ts session.ts utils.ts constants.ts
  middleware.ts                        # route protection (edge-safe)
  types/       next-auth.d.ts
prisma/schema.prisma                   # database models
docker-compose.yml  Dockerfile  .env.example
```

---

## Security

- Passwords hashed with `bcryptjs` (cost 12).
- All mutating server actions call `requireUser()` and re-check ownership/authorization.
- Routes are protected by `middleware.ts`; unauthenticated users are redirected to `/login`.
- Input is validated with Zod on every server action.

---

## Roadmap

- File uploads (local storage layer already abstracted for future S3).
- Push notifications / reminders.
- Public group invite links.
- Exports (ICS / PDF).
