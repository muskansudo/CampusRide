# Campus Ride Management Platform

Real-time campus mobility platform connecting passengers and e-rickshaw drivers.

## Tech Stack

- **Frontend:** React, Vite, TypeScript, Tailwind CSS, Socket.IO Client
- **Backend:** Node.js, Express, Socket.IO, Prisma, PostgreSQL
- **Auth:** JWT

## Prerequisites

- Node.js 18+
- PostgreSQL (via Docker Compose, or a local/cloud Postgres instance)

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
npm run db:push
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

Frontend runs at `http://localhost:5173`

## Test Accounts

| Role      | Email               | Password    |
|-----------|---------------------|-------------|
| Passenger | passenger@test.com  | password123 |
| Driver    | driver@test.com     | password123 |

## Features

- User authentication (passenger & driver roles)
- Driver online/offline availability
- Ride request with pickup & destination
- Real-time ride status updates via WebSocket
- Ride lifecycle: Requested → Accepted → In Progress → Completed
- Driver dashboard with stats & ratings
- Passenger ratings & feedback
- Ethereal Cinematic UI (glass, aurora, coral palette)

## API Endpoints

- `POST /api/auth/register` — Register
- `POST /api/auth/login` — Login
- `GET /api/auth/me` — Current user
- `PUT /api/drivers/status` — Toggle online/offline
- `GET /api/drivers/available` — List online drivers
- `GET /api/drivers/dashboard` — Driver dashboard
- `POST /api/rides` — Request ride
- `PUT /api/rides/:id/accept` — Accept ride
- `PUT /api/rides/:id/start` — Start ride
- `PUT /api/rides/:id/complete` — Complete ride
- `POST /api/rides/:id/rate` — Rate completed ride

## Project Structure

```
├── backend/          # Express API + Socket.IO
├── frontend/         # React SPA
├── docs/             # SRS, Stitch UI prompt
├── docker-compose.yml
└── README.md
```
