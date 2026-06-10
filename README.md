# Campus Ride Management Platform

Real-time campus mobility **web application** connecting passengers and e-rickshaw drivers.

## Tech Stack

- **Frontend:** React 19, Vite, TypeScript, Tailwind CSS, Leaflet, Socket.IO Client, Zustand
- **Backend:** Node.js, Express, Socket.IO, Prisma, PostgreSQL
- **Maps & geo:** OpenStreetMap, Nominatim geocoding, OSRM routing
- **Auth:** Session cookies (PostgreSQL-backed, HTTP-only)

## Prerequisites

- Node.js 18+
- PostgreSQL (via Docker Compose, or a local/cloud Postgres instance)
- Modern browser (Chrome, Firefox, Safari, or Edge)

## Quick Start

### 1. Start Database

**Option A — Docker (recommended)**

```bash
docker compose up -d
```

**Option B — Homebrew Postgres (macOS, no Docker)**

```bash
brew services start postgresql@16
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env   # if .env doesn't exist
npm install
npm run db:push        # sync schema — run again after pulling DB changes
npm run db:seed
npm run dev
```

Backend runs at `http://localhost:3001`

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Web app runs at `http://localhost:5173`

## Test Accounts

| Role      | Email               | Password    | Notes                          |
|-----------|---------------------|-------------|--------------------------------|
| Passenger | passenger@test.com  | password123 |                                |
| Driver    | driver@test.com     | password123 | Pre-verified; can go online    |
| Admin     | admin@test.com      | password123 | Use **Sign in as admin** on login |

**Admin login:** On `/login`, check **Sign in as admin**, then sign in with `admin@test.com`. You are taken to `/admin` to approve or reject driver verifications.

## Features

### Core (v1.0)

- User authentication (passenger & driver roles)
- Driver online/offline availability
- Ride request with map tap, location search, and text fallback
- Real-time ride status updates via WebSocket
- Ride lifecycle: Requested → Accepted → In Progress → Completed / Cancelled
- Driver accept / reject requests
- Driver dashboard with stats, live map, and active rides
- Driver analytics (personal stats, 7-day chart, activity & history)
- Passenger history, ratings & feedback
- Profile edit (name, phone, vehicle for drivers)
- Luminous Serenity UI (glass, aurora, warm editorial palette)

### Security & verification (v2.2)

- **Session-based authentication** — HTTP-only cookie (`campusride.sid`), stored in PostgreSQL via `connect-pg-simple`; no JWT in `localStorage`
- **Driver verification** — drivers submit license number and government ID (text) on Profile; admin approves or rejects before the driver can go online
- **Admin verification UI** — `/admin` lists pending drivers; approve/reject with optional rejection note
- **Login UX** — optional **Sign in as admin** checkbox; registration requires all fields; splash screen shows ~3.5s on first load

### Enhancements (v1.1)

- **Saved / recent locations** — quick picks on passenger home (star favorites)
- **Ride scheduling** — book 15 minutes to 7 days ahead; drivers notified at pickup time
- **Route on map** — road route polyline when ride is in progress (passenger & driver)
- **Campus demand analytics** — peak hours and pickup/destination hotspots (all-platform data)
- **Browser notifications** — optional alerts from Profile (when tab is in background)
- **Offline UX** — network banner, socket reconnect feedback, API retry
- **Manual refresh** — glow refresh buttons on home, history, requests, analytics, dashboard
- **Cancellation labels** — history shows “Cancelled by passenger” or “Cancelled by driver”

## Demo Flow

Open two browser windows (or normal + incognito):

1. **Driver:** `driver@test.com` → `/driver` → toggle **Go Online**
2. **Passenger:** `passenger@test.com` → `/passenger` → set pickup & destination → **Request Ride**
3. **Driver:** `/driver/requests` → **Accept** → **Start Ride** → **Complete**
4. **Passenger:** rate the ride when prompted

**Driver verification (new driver):**

1. Register as driver → **Profile** → submit license number and government ID
2. **Admin:** `/login` → check **Sign in as admin** → `admin@test.com` → approve the driver
3. **Driver:** dashboard **Refresh** updates verified status → **Go Online**

**Optional — scheduled ride:** On passenger home, check **Schedule for later**, pick a time, submit. Drivers receive the request when that time arrives.

**Optional — notifications:** Profile → **Enable notifications**, then background the tab during a ride.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register (creates session) |
| POST | `/api/auth/login` | Login (creates session) |
| POST | `/api/auth/logout` | Destroy session |
| GET | `/api/auth/me` | Current user (session required) |
| PUT | `/api/auth/profile` | Update name / phone |
| PUT | `/api/drivers/verification` | Submit driver verification (driver) |
| PUT | `/api/drivers/status` | Toggle online/offline (verified drivers only) |
| PUT | `/api/drivers/vehicle` | Update vehicle info |
| GET | `/api/admin/verifications/pending` | List pending verifications (admin) |
| PUT | `/api/admin/verifications/:userId` | Approve or reject driver (admin) |
| PUT | `/api/drivers/location` | Update driver GPS |
| GET | `/api/drivers/available` | List online drivers |
| GET | `/api/drivers/dashboard` | Driver dashboard |
| GET | `/api/drivers/analytics` | Driver analytics + campus demand |
| POST | `/api/rides` | Request ride (optional `scheduledAt` ISO datetime) |
| GET | `/api/rides/active` | Current active ride |
| GET | `/api/rides/pending` | Pending requests (driver) |
| GET | `/api/rides/history` | Ride history |
| PUT | `/api/rides/:id/accept` | Accept ride |
| PUT | `/api/rides/:id/reject` | Reject ride |
| PUT | `/api/rides/:id/start` | Start ride |
| PUT | `/api/rides/:id/complete` | Complete ride |
| PUT | `/api/rides/:id/cancel` | Cancel ride |
| POST | `/api/rides/:id/rate` | Rate completed ride |

## WebSocket Events

| Event | Direction | Purpose |
|-------|-----------|---------|
| `driver:status` | Client → Server | Driver toggle |
| `driver:status:update` | Server → All | Refresh driver list |
| `driver:location` | Server → All | Live driver position |
| `ride:requested` | Server → Drivers | New request (immediate or scheduled activation) |
| `ride:accepted` | Server → Passenger | Driver assigned |
| `ride:rejected` | Server → Drivers | Driver declined |
| `ride:status:update` | Server → Both | Lifecycle change |
| `ride:cancelled` | Server → Both | Ride cancelled |

## Project Structure

```
├── backend/          # Express API + Socket.IO + Prisma
├── frontend/         # React web SPA
├── SRS.md            # Requirements spec (v2.2)
├── docker-compose.yml
└── README.md
```

## Environment Variables

**Backend** (`backend/.env`):

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | Secret for signing session cookies (change in production) |
| `JWT_SECRET` | Legacy fallback if `SESSION_SECRET` unset (optional) |
| `PORT` | API port (default 3001) |
| `CLIENT_URL` | Frontend origin for CORS (default `http://localhost:5173`) |

API and Socket.IO requests from the frontend use `credentials: 'include'` so the session cookie is sent automatically.

**Frontend** (`frontend/.env`):

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API base (default `http://localhost:3001/api`) |
| `VITE_SOCKET_URL` | Optional Socket.IO URL (defaults from API URL) |

## Database

| Command | Purpose |
|---------|---------|
| `npm run db:push` | Apply Prisma schema to Postgres |
| `npm run db:seed` | Create test passenger, driver & admin accounts |
| `npm run db:studio` | Open Prisma Studio GUI |

After pulling these changes that modify `backend/prisma/schema.prisma`, run `npm run db:push` and restart the backend.

## Documentation

See [SRS.md](./SRS.md) for full requirements, feature status (v2.2), and navigation model.
