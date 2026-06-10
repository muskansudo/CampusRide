# CampusRide — Campus Ride Management Platform

A real-time web application that connects **campus passengers** with **e-rickshaw drivers**. Passengers can request rides on a map, track status live, and pay when a trip completes. Drivers manage availability, accept requests, and view analytics. Admins review driver verification before drivers can go online.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Setup Instructions](#3-setup-instructions)
4. [Running the Application](#4-running-the-application)
5. [Feature List](#5-feature-list)

---

## 1. Project Overview

### What is CampusRide?

CampusRide is a **campus mobility platform** built for environments like university campuses (e.g. IIT Roorkee–style). It solves the problem of coordinating short e-rickshaw trips between buildings by giving passengers a simple way to book rides and drivers a dashboard to manage requests in real time.

### Who uses it?


| Role          | Description                                                                                                                   |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Passenger** | Student or campus user who requests rides, tracks active trips, views history, rates drivers, and pays after completion       |
| **Driver**    | E-rickshaw operator who goes online, accepts/rejects requests, runs the ride lifecycle, and views personal + campus analytics |
| **Admin**     | Platform operator who approves or rejects driver verification submissions before drivers can accept rides                     |


### How it works (high level)

```
Passenger requests ride → Online drivers notified (WebSocket)
→ Driver accepts → Start → Complete → Passenger pays & rates
```

The app is a **single-page web application (SPA)** with role-based routes. The backend exposes a REST API and WebSocket server; **PostgreSQL on Supabase** stores users, rides, payments, and sessions. Teammates share the same cloud database so data (rides, UPI IDs, verifications) stays in sync across machines.

### Repository layout

```
CampusRide/
├── backend/           # Node.js API, Socket.IO, Prisma ORM
├── frontend/          # React SPA (Vite)
├── docker-compose.yml # Optional local PostgreSQL (not required with Supabase)
└── README.md          # This file
```

---

## 2. Technology Stack

### Frontend


| Technology           | Purpose                                                 |
| -------------------- | ------------------------------------------------------- |
| **React 19**         | UI components and pages                                 |
| **Vite**             | Dev server and production build                         |
| **TypeScript**       | Type-safe frontend code                                 |
| **Tailwind CSS v4**  | Styling (Luminous Serenity design system)               |
| **React Router v7**  | Client-side routing (`/passenger`, `/driver`, `/admin`) |
| **Zustand**          | Auth, network, and ride state                           |
| **Leaflet**          | Interactive maps (OpenStreetMap tiles)                  |
| **Socket.IO Client** | Real-time ride and driver updates                       |
| **QRCode**           | QR-based payment display in payment modal               |


### Backend


| Technology                              | Purpose                                          |
| --------------------------------------- | ------------------------------------------------ |
| **Node.js + Express 5**                 | REST API                                         |
| **Socket.IO**                           | WebSocket server for live events                 |
| **Prisma**                              | Database ORM and schema management               |
| **PostgreSQL (Supabase)**               | Hosted cloud database — shared by all developers |
| **express-session + connect-pg-simple** | Session-based auth (HTTP-only cookies)           |
| **bcryptjs**                            | Password hashing                                 |
| **Zod**                                 | Request validation                               |


### External services (no API keys required for dev)


| Service           | Purpose                                       |
| ----------------- | --------------------------------------------- |
| **OpenStreetMap** | Map tiles                                     |
| **Nominatim**     | Geocoding (address ↔ coordinates)             |
| **OSRM**          | Road route polylines during in-progress rides |


### Architecture

```
┌─────────────────────┐
│  Browser (React)    │  http://localhost:5173
└─────────┬───────────┘
          │ REST (credentials: include) + WebSocket
┌─────────▼───────────┐
│  Express + Socket.IO  │  http://localhost:3001  (runs locally per developer)
└─────────┬───────────┘
          │
┌─────────▼───────────┐
│  Supabase Postgres  │  Cloud (ap-south-1) — shared database
└─────────────────────┘
```

Each developer runs **backend + frontend locally**, but both connect to the **same Supabase project** so accounts, rides, and payments are shared.

---

## 3. Setup Instructions

Follow these steps **in order** the first time you clone the repository.

### Prerequisites

Install the following before starting:


| Requirement         | Version                          | Notes                                                                                                           |
| ------------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Node.js**         | 18 or higher                     | Check with `node -v`                                                                                            |
| **npm**             | Comes with Node                  | Check with `npm -v`                                                                                             |
| **Supabase access** | —                                | Ask a teammate for `DATABASE_URL` and `DIRECT_URL`, or create a project at [supabase.com](https://supabase.com) |
| **Git**             | Any                              | To clone the repository                                                                                         |
| **Modern browser**  | Chrome, Firefox, Safari, or Edge | For running the web app                                                                                         |


> **Docker is optional.** This project uses **Supabase** for PostgreSQL. You do not need Docker unless you want a fully offline local database (see [Optional: local PostgreSQL](#optional-local-postgresql-via-docker) at the end of setup).

### Step 1 — Clone the repository

```bash
git clone <repository-url>
cd CampusRide
```

### Step 2 — Configure the backend

```bash
cd backend
cp .env.example .env    # only if .env does not exist
npm install
```

Edit `backend/.env` with your Supabase connection strings. Get them from **Supabase Dashboard → Project Settings → Database → Connect → Prisma**, or ask a teammate who already has access.

```env
# Prisma runtime (transaction pooler, port 6543)
DATABASE_URL="postgresql://postgres.amagnhwahbhenulypuqu:[YOUR-PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Migrations, db:push, db:seed, and login sessions (session pooler, port 5432)
DIRECT_URL="postgresql://postgres.amagnhwahbhenulypuqu:[YOUR-PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require"

SESSION_SECRET="change-this-to-a-secure-random-string"
JWT_SECRET="change-this-to-a-secure-random-string"
PORT=3001
CLIENT_URL="http://localhost:5173"
```


| Variable         | Purpose                                                       |
| ---------------- | ------------------------------------------------------------- |
| `DATABASE_URL`   | Prisma queries at runtime (pooler port **6543**)              |
| `DIRECT_URL`     | `db:push`, `db:seed`, and session cookies (port **5432**)     |
| `SESSION_SECRET` | Signs session cookies — change in production                  |
| `CLIENT_URL`     | Frontend origin for CORS (local dev: `http://localhost:5173`) |


Replace `[YOUR-PASSWORD]` with your Supabase **database password** (set when the project was created, or reset under **Database → Reset database password**).

**Never commit `backend/.env` to Git.** Share connection strings with teammates privately (Discord, etc.), not in the repository.

### Step 3 — Initialize the database (first time only)

Still inside `backend/`:

```bash
npm run db:push
npm run db:seed
```


| Command           | What it does                                                            |
| ----------------- | ----------------------------------------------------------------------- |
| `npm run db:push` | Applies the Prisma schema to Supabase and regenerates the Prisma client |
| `npm run db:seed` | Creates test passenger, driver, and admin accounts                      |


> **First teammate** runs both commands once on the shared Supabase project. **Other teammates** only need the same `.env` URLs and can skip `db:seed` unless resetting test data.

> **After pulling new code:** If `backend/prisma/schema.prisma` changed, run `npm run db:push` again and restart the backend.

### Step 4 — Install frontend dependencies

```bash
cd ../frontend
npm install
```

Optional: create `frontend/.env` only if you need custom API URLs:

```env
VITE_API_URL=http://localhost:3001/api
VITE_SOCKET_URL=http://localhost:3001
```

Defaults point to `http://localhost:3001` if these are omitted.

### Optional: local PostgreSQL via Docker

If you prefer **not** to use Supabase (offline-only development), from the project root:

```bash
docker compose up -d
```

Then set in `backend/.env`:

```env
DATABASE_URL="postgresql://campus_ride:campus_ride_secret@localhost:5432/campus_ride_db"
DIRECT_URL="postgresql://campus_ride:campus_ride_secret@localhost:5432/campus_ride_db"
```

Run `npm run db:push` and `npm run db:seed` as above. Data will be **local only** — not shared with teammates.

---

## 4. Running the Application

You need the **backend** and **frontend** running locally. The database runs on **Supabase** in the cloud — no local PostgreSQL required.

### Terminal 1 — Backend

```bash
cd backend
npm run dev
```

Expected output:

```
Server running on http://localhost:3001
```

### Terminal 2 — Frontend

```bash
cd frontend
npm run dev
```

Expected output:

```
➜  Local:   http://localhost:5173/
```

### Open the app

1. Open **[http://localhost:5173](http://localhost:5173)** in your browser.
2. A splash screen appears briefly (~3.5 seconds), then you are redirected to login or your home screen if already signed in.

### Test accounts


| Role      | Email                | Password      | How to sign in                           |
| --------- | -------------------- | ------------- | ---------------------------------------- |
| Passenger | `passenger@test.com` | `password123` | Login → select **Passenger**             |
| Driver    | `driver@test.com`    | `password123` | Login → select **Driver** (pre-verified) |
| Admin     | `admin@test.com`     | `password123` | Login → check **Sign in as admin**       |


### Quick demo (two browser windows)

Use a normal window and an incognito/private window to simulate passenger and driver side by side.

1. **Driver** — Log in as `driver@test.com` → **Go Online** on the dashboard.
2. **Passenger** — Log in as `passenger@test.com` → set pickup and destination → **Request Ride**.
3. **Driver** — Open **Requests** → **Accept** → back on dashboard **Start Ride** → **Complete**.
4. **Passenger** — Complete payment when prompted → rate the ride.

### Driver verification flow (new drivers)

1. **Register** as a driver and fill all fields.
2. Go to **Profile** → submit **license number** and **government ID**.
3. **Admin** — Log in with **Sign in as admin** → approve the driver at `/admin`.
4. **Driver** — Tap **Refresh** on the dashboard → **Go Online** is enabled.

### Sharing data with teammates

Because everyone uses the **same Supabase database**:

- Rides, payments, and verifications created by one person are visible to others (after refresh/login).
- A driver’s **UPI ID** saved on Profile is stored in Supabase — teammates see it when testing payments.
- Each person runs their **own** backend and frontend on `localhost`; only the database is shared.

**Two machines (e.g. your laptop + teammate’s laptop):**

1. Both copy the same `DATABASE_URL` and `DIRECT_URL` into `backend/.env`.
2. Each runs `npm run dev` in `backend/` and `frontend/` on their own machine.
3. Passenger on Machine A requests a ride → saved to Supabase.
4. Driver on Machine B opens **Requests** and taps **Refresh** if needed → accepts the ride.

> **Note:** WebSocket push is per backend instance. Cross-machine demos rely on shared DB + refresh; for instant live updates across two laptops without refresh, deploy one shared backend and point both frontends at it with `VITE_API_URL`.

### Stopping the application

- Press `Ctrl + C` in each terminal running `npm run dev`.

### Production build (optional)

```bash
# Backend
cd backend && npm run build && npm start

# Frontend
cd frontend && npm run build && npm run preview
```

### Troubleshooting


| Problem                                            | Likely cause                           | Fix                                                                                    |
| -------------------------------------------------- | -------------------------------------- | -------------------------------------------------------------------------------------- |
| `PaymentStatus` not exported from `@prisma/client` | Prisma client out of date              | `cd backend && npm run db:push`                                                        |
| `Failed to resolve import "qrcode"`                | Frontend deps not installed            | `cd frontend && npm install`                                                           |
| `Connection refused` on API calls                  | Backend not running                    | Start `npm run dev` in `backend/`                                                      |
| `Authentication required` after db push            | Session table reset on Supabase        | Log in again                                                                           |
| CORS errors                                        | Wrong `CLIENT_URL`                     | Set `CLIENT_URL=http://localhost:5173` in `backend/.env`                               |
| Database connection failed                         | Wrong password or URL in `.env`        | Check Supabase **Connect → Prisma** strings; ensure `?sslmode=require` on `DIRECT_URL` |
| `password authentication failed`                   | Incorrect Supabase password            | Reset under **Project Settings → Database**                                            |
| SSL connection required                            | Missing SSL param                      | Add `?sslmode=require` to `DIRECT_URL`                                                 |
| Teammate doesn’t see my data                       | Using local Docker instead of Supabase | Use the shared `DATABASE_URL` and `DIRECT_URL` in `.env`                               |


### Useful database commands

Run from `backend/` (connects to Supabase via `.env`):

```bash
npm run db:push      # Sync schema to Supabase
npm run db:seed      # Re-create test accounts (resets seed data)
npm run db:studio    # Open Prisma Studio (visual DB browser)
```

View tables directly in **Supabase Dashboard → Table Editor**.

---

## 5. Feature List

### Authentication & accounts

- Email/password registration as **Passenger** or **Driver**
- **Session-based authentication** — HTTP-only cookie (`campusride.sid`), stored server-side in Supabase PostgreSQL
- Auto-login on return visits while session is valid
- Logout with session destroy
- Profile editing (name, phone; vehicle details for drivers)
- Registration validates that **all fields** are filled before submit
- **Sign in as admin** checkbox on login — only admin credentials work when enabled
- Splash screen on first app load (~3.5 seconds)

### Driver verification & admin

- Drivers submit **license number** and **government ID** (text) from Profile
- Verification states: `PENDING`, `VERIFIED`, `REJECTED`
- Admin reviews pending drivers at `/admin` — approve or reject with optional note
- Drivers **cannot go online** until verified (enforced in UI and API)
- Dashboard refresh reloads verification status after admin approval

### Passenger features

- **Request a ride** with pickup and destination
- Map tap, location search (Nominatim), and manual text entry
- **Saved and recent locations** — quick-pick chips and star favorites
- **Schedule rides** — book 15 minutes to 7 days ahead; drivers notified at pickup time
- View **online drivers** count and list
- **Active ride tracking** with live status updates
- **Route polyline** on map when ride is in progress (OSRM)
- **Ride history** with cancellation labels (passenger vs driver)
- **Rate completed rides** (1–5 stars + optional feedback)
- **Simulated payment** after ride completion (UPI, QR code, or cash)
- **Payment history** on ride history screen
- Optional **browser notifications** (enable from Profile)

### Driver features

- **Online / offline toggle** on dashboard (verified drivers only)
- **Incoming requests** — accept or reject pending rides
- **Ride lifecycle** — Start → Complete (or Cancel)
- **Live GPS** — position sent to server every 10s when online
- **Dashboard** — stats, active rides, map with pickup/destination pins
- **Analytics** — personal stats, 7-day ride chart, ratings, activity log
- **Campus demand analytics** — peak hours and pickup/destination hotspots (platform-wide)
- **Payment history** and UPI ID on profile
- Vehicle info edit on Profile

### Real-time & reliability

- **WebSocket** updates for ride requests, acceptance, status changes, cancellations
- Driver online status and location broadcast
- **Offline banner** when browser loses network
- Socket reconnect feedback
- API retry on transient network failure
- **Manual refresh** buttons with glow animation on key screens

### UI / UX

- Responsive layout (mobile-friendly, max-width 600px content)
- Shared **CampusRide** header across auth and app pages
- Bottom navigation for passenger and driver roles
- Luminous Serenity design — glass panels, aurora background, warm palette
- Toast notifications for success and error feedback

### Ride lifecycle

```
REQUESTED → ACCEPTED → IN_PROGRESS → COMPLETED
                ↓           ↓
            CANCELLED   CANCELLED
```

### API overview (reference)

REST endpoints


| Method | Endpoint                           | Description                   |
| ------ | ---------------------------------- | ----------------------------- |
| POST   | `/api/auth/register`               | Register                      |
| POST   | `/api/auth/login`                  | Login                         |
| POST   | `/api/auth/logout`                 | Logout                        |
| GET    | `/api/auth/me`                     | Current user                  |
| PUT    | `/api/auth/profile`                | Update profile                |
| PUT    | `/api/drivers/verification`        | Submit driver verification    |
| PUT    | `/api/drivers/status`              | Toggle online/offline         |
| PUT    | `/api/drivers/vehicle`             | Update vehicle                |
| PUT    | `/api/drivers/location`            | Update GPS                    |
| GET    | `/api/drivers/available`           | List online drivers           |
| GET    | `/api/drivers/dashboard`           | Driver dashboard data         |
| GET    | `/api/drivers/analytics`           | Analytics + campus demand     |
| GET    | `/api/admin/verifications/pending` | Pending verifications (admin) |
| PUT    | `/api/admin/verifications/:userId` | Approve/reject (admin)        |
| POST   | `/api/rides`                       | Create ride                   |
| GET    | `/api/rides/active`                | Active ride                   |
| GET    | `/api/rides/pending`               | Pending requests              |
| GET    | `/api/rides/history`               | Ride history                  |
| PUT    | `/api/rides/:id/accept`            | Accept ride                   |
| PUT    | `/api/rides/:id/reject`            | Reject ride                   |
| PUT    | `/api/rides/:id/start`             | Start ride                    |
| PUT    | `/api/rides/:id/complete`          | Complete ride                 |
| PUT    | `/api/rides/:id/cancel`            | Cancel ride                   |
| POST   | `/api/rides/:id/rate`              | Rate ride                     |
| GET    | `/api/payments/ride/:rideId`       | Payment for a ride            |
| PUT    | `/api/payments/:id/complete`       | Complete payment              |
| GET    | `/api/payments/history`            | Payment history               |




WebSocket events


| Event                  | Direction          | Purpose              |
| ---------------------- | ------------------ | -------------------- |
| `driver:status`        | Client → Server    | Driver online toggle |
| `driver:status:update` | Server → All       | Driver list refresh  |
| `driver:location`      | Server → All       | Live driver position |
| `ride:requested`       | Server → Drivers   | New ride request     |
| `ride:accepted`        | Server → Passenger | Driver assigned      |
| `ride:rejected`        | Server → Drivers   | Request declined     |
| `ride:status:update`   | Server → Both      | Status change        |
| `ride:cancelled`       | Server → Both      | Ride cancelled       |




---

**CampusRide** — Campus mobility, simplified.