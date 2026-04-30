# Trycoon Trails

Async-multiplayer browser-based tycoon/strategy game. Players sign up, build businesses on a unique tile of a shared world, recruit armies, level up to unlock new powers, and eventually attack/capture other players' territories.

> Full game design lives in [game.md](game.md). This README is for **developers** running the backend.

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend (planned) | Angular 17+, Tailwind, signals |
| Backend | Node.js (ES modules), Express 5, Sequelize 6 |
| Database | MySQL 8 |
| Cache / sessions / leaderboards | Redis |
| Image hosting | Cloudinary |
| Auth | JWT (access + refresh, refresh tokens stored in Redis) |
| Background jobs | `node-schedule` (income tick every minute) |
| API docs | OpenAPI 3 via `swagger-jsdoc` + `swagger-ui-express` |

---

## Prerequisites

- **Node.js 20+** (tested on 24)
- **MySQL 8.x** running locally
- **Redis** running locally (port 6379 by default)
- **Cloudinary** account (free tier is fine — only needed if you want to test avatar upload)

---

## Setup

```bash
# 1. clone & install
cd server
npm install

# 2. create the database
mysql -u root -p
> CREATE DATABASE trycoon_trails CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
> exit

# 3. configure env
cp .env.example .env
# edit .env — fill in DB_PASSWORD, JWT secrets, Cloudinary credentials

# 4. start the server
npm run dev
```

On first boot the server will:
1. Connect to MySQL + Redis (fails fast if either is down)
2. `sync()` all models — creates tables that don't exist yet (existing tables are not altered; see *Schema changes* below)
3. Seed the catalog data: 10 levels, 5 business types, 4 unit types, 14 missions, 2,500-tile world map, 1 admin user
4. Rebuild Redis leaderboards from the DB
5. Start the income tick scheduler (every minute)
6. Listen on `http://localhost:8000`

Check it: visit **http://localhost:8000/api-docs** for the interactive Swagger UI, or hit **http://localhost:8000/health** for a quick liveness ping.

---

## Default credentials

After first boot, an admin user is auto-seeded:

- **Username:** `admin`
- **Email:** `admin@trycoon.local`
- **Password:** value of `ADMIN_PASSWORD` in your `.env` (default `Admin@123now`)

Sign up regular players via `POST /api/v1/auth/signup`.

---

## Project structure

```
Trycoon-Trails/
├── server/
│   ├── src/
│   │   ├── app.js              # Express app, middleware chain, Swagger
│   │   ├── server.js           # Bootstrap: connect DB/Redis, seed, listen
│   │   ├── config/             # env, db, redis, cloudinary, swagger
│   │   ├── models/             # Sequelize models + associations
│   │   ├── controllers/        # Route handlers
│   │   ├── services/           # Business logic (auth, world, business,
│   │   │                       #   army, combat, mission, leaderboard,
│   │   │                       #   notification, admin, economy, xp)
│   │   ├── routes/             # Route definitions + Swagger JSDoc
│   │   ├── middleware/         # auth, role, error, upload
│   │   ├── jobs/               # incomeTick (cron + Redis lock)
│   │   ├── utils/              # ApiError, ApiResponse, asyncHandler,
│   │   │                       #   logger, jwt, validators
│   │   └── db/                 # seeders for catalog + admin
│   ├── public/temp/            # multer scratch space (auto-cleaned)
│   ├── logs/                   # winston file logs (prod)
│   ├── .env.example
│   └── package.json
├── game.md                     # Game design doc
└── README.md
```

---

## Tech overview

**Auth.** JWT-based with refresh tokens. Access tokens are short-lived (15 min default), refresh tokens (7 days) are stored as an allow-list in Redis (`refresh:<userId>:<jti>`) so they can be revoked instantly on logout/ban.

**Roles.** Two roles: `user` (default) and `admin`. Admin-only routes are gated by the `requireAdmin` middleware. Every admin action is recorded in the `admin_audit_log` table.

**Economy.** All resource changes (coins, gems, manpower, reputation, xp) flow through `services/economy.js` `credit()` / `debit()`. Every change writes a row to the `transactions` table with running balance — there is a complete audit trail. The economy service also pushes scores to Redis sorted sets for leaderboards.

**World.** A 50×50 grid (2,500 tiles) seeded once on first boot. Each tile has terrain (plains/forest/mountain/coast/desert) which modifies business capacity, defense bonus, and income multiplier. Land is globally unique — only one owner at a time, enforced by a `(x,y)` unique constraint.

**Income tick.** `node-schedule` cron `* * * * *` (every minute). For each user with territories: regenerates manpower, computes business income (with idle decay 7d/14d/30d), deducts army upkeep, credits net coins. Wrapped in a Redis distributed lock (`tick:income:lock`) so multiple server instances don't double-credit.

**Combat.** Atomic Sequelize transactions: lock attacker + defender army rows, compute strengths (with territory and reputation bonuses), apply losses (25% on win / 75% on loss for attacker; 100% / 10% for defender), transfer ownership if attacker is L8+, set 24h capture cooldown, award reputation/XP, write a battle record with full snapshots.

**Missions.** Three types: daily (resets midnight UTC, lazy-evaluated), story (one-time progression), achievement (long-term). Progress is incremented via `recordEvent(user, goalType, value)` calls sprinkled in business/army/combat/xp services — fully atomic with the triggering action.

**Notifications.** Per-user inbox. Created when a player is attacked, has territory captured, levels up, etc. Polled via `GET /api/v1/notifications` (no push yet).

**Leaderboards.** Redis sorted sets (`lb:coins`, `lb:level`, `lb:reputation`, `lb:battles_won`, etc.). Updated on every credit/debit and battle. Rebuilt from DB on every server boot.

---

## Schema changes (important)

The server boots with `syncDB({ alter: false })` — Sequelize will create new tables but **will not alter existing tables**. This is deliberate: alter-sync was found to leak duplicate indexes on every restart, eventually hitting MySQL's 64-key limit.

**To change a column or add a new column to an existing table:**
- Write a SQL migration script and apply it manually via `mysql -u root -p trycoon_trails < migration.sql`, OR
- Drop the table and let `sync()` recreate it (dev only)

For new tables, just add the model — `sync()` will create it on next boot.

---

## API quick reference

Full Swagger UI at **`/api-docs`**. The OpenAPI JSON is at **`/api-docs.json`** (importable to Postman).

**Public:** `POST /auth/signup`, `POST /auth/login`, `GET /levels`, `GET /businesses/types`, `GET /army/types`, `GET /leaderboards/:kind`

**Authed:** profile, businesses, army, world map, scout, attack, missions, notifications, daily reward, transactions, battles

**Admin only (`/api/v1/admin/*`):** stats, audit log, full CRUD on levels/business-types/unit-types/missions/territories, player list/ban/unban/grant/role

---

## Useful npm scripts

| Script | What it does |
|--------|--------------|
| `npm run dev` | Start with nodemon (auto-restart on file change) |
| `npm start` | Start in production mode |

---

## Environment variables

See `.env.example` for the full list. Key ones:

| Variable | Description |
|----------|-------------|
| `PORT` | HTTP port (default 8000) |
| `DB_*` | MySQL host/port/user/password/db |
| `REDIS_*` | Redis host/port/password |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | **Change these in production.** |
| `JWT_ACCESS_EXPIRY`, `JWT_REFRESH_EXPIRY` | e.g., `15m`, `7d` |
| `CLOUDINARY_*` | Cloudinary credentials for avatar upload |
| `STARTER_COINS`, `STARTER_GEMS`, `STARTER_MANPOWER`, `SHIELD_DAYS` | Tunable starter resources |
| `INCOME_TICK_ENABLED`, `INCOME_TICK_CRON` | Income tick toggle + cron expression |
| `ADMIN_USERNAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | First admin seeded on boot |

---

## Status

- ✅ Phase 1 — Auth (signup, login, refresh, logout, profile, change password, avatar upload)
- ✅ Phase 2 — Levels, XP, daily streak, transaction history
- ✅ Phase 3 — World map (50×50), spawn on signup, scout/attack/capture
- ✅ Phase 4 — Businesses (5 types, buy, upgrade, income tick)
- ✅ Phase 5 — Army (4 unit types, recruit, disband, manpower regen, upkeep)
- ✅ Phase 6 — Combat (instant resolution, last-territory rule, capture cooldown, reputation)
- ✅ Phase 7 — Missions (14 missions, daily/story/achievement, auto progress hooks, claim flow)
- ✅ Phase 8 — Admin (full catalog CRUD, player moderation, audit log, stats)
- ✅ Phase 9 — Polish (leaderboards, notifications, admin stats, README)
- ⏳ Phase 10 — Real-time (WebSocket battle pings, online presence) + Mobile (Ionic/Capacitor)

---

## License

See [LICENSE](LICENSE).
