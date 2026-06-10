# Software Requirements Specification (SRS)

## CampusRide — Web Application


| Field                | Value                                                |
| -------------------- | ---------------------------------------------------- |
| **Document Version** | 2.2                                                  |
| **Date**             | June 10, 2026                                        |
| **Project**          | Real-Time Campus Mobility & Ride Management Platform |
| **Platform**         | Web (responsive SPA)                                 |
| **Status**           | Active                                               |


---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Feature Scope Decision](#2-feature-scope-decision)
3. [Overall Description](#3-overall-description)
4. [User Roles & Personas](#4-user-roles--personas)
5. [Functional Requirements](#5-functional-requirements)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [System Interfaces](#7-system-interfaces)
8. [Data Requirements](#8-data-requirements)
9. [Assumptions & Constraints](#9-assumptions--constraints)
10. [Release Plan](#10-release-plan)
11. [User Flow & Navigation](#11-user-flow--navigation)
12. [Appendix](#12-appendix)

---

## 1. Introduction

### 1.1 Purpose

This Software Requirements Specification defines the functional and non-functional requirements for **CampusRide** — a responsive web application that connects campus passengers with e-rickshaw drivers in real time.

The web client consumes the CampusRide backend (REST API + WebSocket) for the IIT Roorkee–style campus mobility challenge, providing map-based ride requests, live ride tracking, and role-based passenger/driver workflows in the browser.

### 1.2 Scope

**In scope (Web v1.0 + v1.1 + v2.2 — implemented):**

- All **Must Have** features (F-01 – F-17)
- All **Should Have** features (F-18 – F-23)
- **Could Have** enhancements: ride scheduling (F-24), campus demand analytics (F-26)
- **v2.2:** Session-based auth, driver verification (text), admin verification review UI
- Passenger, driver, and admin flows in a single role-based SPA
- Interactive maps, routing, real-time updates, profile management

**Out of scope:**

- Native mobile apps (iOS / Android)
- Full admin panel (beyond driver verification review)
- Real payment gateway integration
- ML demand forecasting
- Multi-campus / multi-tenant support
- Simulated payments, biometric login, document file upload, in-app chat

### 1.3 Definitions


| Term              | Definition                                                      |
| ----------------- | --------------------------------------------------------------- |
| **Passenger**     | Campus user requesting a ride                                   |
| **Driver**        | E-rickshaw operator registered on the platform                  |
| **Admin**         | Platform operator who reviews driver verification submissions   |
| **Ride**          | A transportation request from pickup to destination             |
| **Online**        | Driver availability state — visible and able to accept rides    |
| **Active Ride**   | A ride in Requested, Accepted, or In Progress state             |
| **Analytics Tab** | Driver page for ride history, ratings, statistics, and charts   |
| **SRS**           | Software Requirements Specification                             |


### 1.4 References

- Real-Time Campus Mobility and Ride Management Platform (Problem Statement PDF)
- Luminous Serenity Design System (Warm Editorial)

---

## 2. Feature Scope Decision

Features are classified for **Web v1.0** based on competition mandatory requirements and existing backend support.

### 2.1 Must Have — Web v1.0


| ID   | Feature                                                                        | Status        |
| ---- | ------------------------------------------------------------------------------ | ------------- |
| F-01 | User registration & login (Passenger / Driver)                                 | Implemented   |
| F-02 | Session-based authentication (HTTP-only cookie, PostgreSQL store)              | Implemented   |
| F-03 | Driver profile & vehicle info                                                  | Implemented   |
| F-04 | Driver online/offline toggle                                                   | Implemented   |
| F-05 | View available drivers (passenger)                                             | Implemented   |
| F-06 | Request ride with pickup & destination                                         | Implemented   |
| F-07 | Map-based location picker + search                                             | Implemented   |
| F-08 | Driver incoming request list                                                   | Implemented   |
| F-09 | Accept / reject ride (driver)                                                  | Implemented   |
| F-10 | Ride lifecycle (Requested → Accepted → In Progress → Completed / Cancelled)    | Implemented   |
| F-11 | Real-time status updates (WebSocket)                                           | Implemented   |
| F-12 | Push / browser notifications (critical events)                                 | Implemented   |
| F-13 | Driver dashboard (online toggle, quick stats, active rides)                    | Implemented   |
| F-14 | Passenger ride history; Driver analytics tab                                   | Implemented   |
| F-15 | Rate completed ride + optional feedback                                        | Implemented   |
| F-16 | Cancel ride (passenger / driver)                                               | Implemented   |
| F-17 | Luminous Serenity web UI                                                       | Implemented   |


### 2.2 Should Have — Web v1.0


| ID   | Feature                                  | Status      |
| ---- | ---------------------------------------- | ----------- |
| F-18 | Driver live location broadcast on map    | Implemented |
| F-19 | Saved / recent locations                 | Implemented |
| F-20 | In-app toast notifications               | Implemented |
| F-21 | Profile edit (name, phone, vehicle)      | Implemented |
| F-22 | Manual refresh on lists                  | Implemented |
| F-23 | Offline / poor-network graceful handling | Implemented |


### 2.3 Could Have — Web v1.1


| ID   | Feature                                                           | Status      |
| ---- | ----------------------------------------------------------------- | ----------- |
| F-24 | Ride scheduling (future time slots)                               | Implemented |
| F-26 | Campus demand analytics (peak hours, hotspots) on Analytics tab   | Implemented |


### 2.4 Won't Have


| Feature                             | Reason                   |
| ----------------------------------- | ------------------------ |
| Native mobile app                   | Web-only product scope   |
| Full admin panel                    | Out of current scope     |
| ML demand forecasting               | Complexity; defer        |
| Real / simulated payment (F-25)     | Out of current scope     |
| Biometric login (F-27)              | Out of current scope     |
| Driver document file upload (F-28)  | Text verification implemented; file attachments deferred |
| In-app chat (F-29)                  | Out of current scope     |
| Passenger-to-passenger ride sharing | Out of problem statement |


---

## 3. Overall Description

### 3.1 Product Perspective

```
┌─────────────────────┐
│  Web SPA            │  ← This SRS (React + Vite)
│  (Browser)          │
└─────────┬───────────┘
          │ REST + WebSocket
┌─────────▼───────────┐
│  Backend API        │  Node.js + Express + Socket.IO
└─────────┬───────────┘
          │
┌─────────▼───────────┐
│  PostgreSQL         │
└─────────────────────┘
```

### 3.2 Technology Stack


| Layer      | Technology                          | Notes                              |
| ---------- | ----------------------------------- | ---------------------------------- |
| Frontend   | React 19, Vite, TypeScript          | Single-page application            |
| Styling    | Tailwind CSS v4                     | Luminous Serenity tokens           |
| Routing    | React Router v7                     | Role-based routes                  |
| Maps       | Leaflet + OpenStreetMap             | Tap-to-set + Nominatim geocoding   |
| Routing    | OSRM (public API)                   | Road route polyline when ride starts |
| Real-time  | socket.io-client                    | Ride and driver status events      |
| State      | Zustand                             | Auth, toast, and network stores    |
| Backend    | Express, Prisma, PostgreSQL         | REST + WebSocket                   |
| Auth       | express-session + connect-pg-simple | HTTP-only cookie, 7-day session    |


### 3.3 Operating Environment

- **Browsers:** Chrome, Firefox, Safari, Edge (last 2 major versions)
- **Devices:** Desktop and mobile browsers (responsive layout)
- **Network:** Wi-Fi or mobile data; campus network compatible
- **Permissions:** Geolocation (when in use, for driver GPS and map)

### 3.4 Design & UX Principles

- Responsive web layout; mobile-friendly bottom navigation
- Warm editorial aesthetic (Luminous Serenity v2)
- Glass/aurora visual language with Playfair Display + Montserrat
- Real-time feedback without manual page refresh
- Minimal steps to request a ride

---

## 4. User Roles & Personas

### 4.1 Passenger — Priya (Student)

- Needs quick rides between campus buildings
- Uses phone or laptop browser
- Expects live updates when driver accepts
- Rates ride after completion

### 4.2 Driver — Ramesh (E-Rickshaw Operator)

- Uses browser on phone or tablet during shift
- Submits license number and government ID for verification before first shift
- Toggles online when starting shift (only after admin approval)
- Manages accept → start → complete flow
- Reviews performance on the Analytics page

### 4.3 Admin — Campus Operations

- Signs in via **Sign in as admin** on the login page
- Reviews pending driver verification submissions
- Approves or rejects with an optional rejection note
- Rejected drivers may resubmit from Profile

---

## 5. Functional Requirements

### 5.1 Authentication & Profile (F-01 – F-03)


| Req ID | Requirement                                         | Priority |
| ------ | --------------------------------------------------- | -------- |
| FR-1.1 | App shall allow registration as Passenger or Driver | Must     |
| FR-1.2 | Driver registration shall collect vehicle info    | Must     |
| FR-1.3 | App shall authenticate via email and password with server-side session | Must     |
| FR-1.4 | App shall persist session via HTTP-only cookie (`credentials: include`) | Must     |
| FR-1.5 | App shall auto-login on load if valid session exists   | Must     |
| FR-1.6 | App shall support logout (session destroy)            | Must     |
| FR-1.7 | App shall display user profile                      | Should   |
| FR-1.8 | Driver shall view and edit vehicle info on profile  | Must     |
| FR-1.9 | Registration shall require all fields (passenger and driver) | Implemented |
| FR-1.10 | Login shall offer optional **Sign in as admin** mode; only `ADMIN` role may sign in when enabled | Implemented |
| FR-1.11 | Driver shall submit license number and government ID (text) for verification | Implemented |
| FR-1.12 | Admin shall approve or reject driver verification; rejected drivers see reason on Profile | Implemented |
| FR-1.13 | Driver shall not go online until `verificationStatus` is `VERIFIED` | Implemented |


### 5.2 Driver Availability (F-04 – F-05)


| Req ID | Requirement                                                | Priority |
| ------ | ---------------------------------------------------------- | -------- |
| FR-2.1 | Driver shall toggle Online / Offline from dashboard        | Must     |
| FR-2.1a | Unverified drivers shall be blocked from going online (UI + API) | Implemented |
| FR-2.2 | Offline drivers shall not receive new ride requests        | Must     |
| FR-2.3 | Passenger shall see count of online drivers                | Must     |
| FR-2.4 | Passenger shall see list of online drivers                 | Must     |
| FR-2.5 | Online status change shall broadcast in real time          | Must     |
| FR-2.6 | App shall set driver offline on explicit logout            | Should   |


### 5.3 Ride Request (F-06 – F-07)


| Req ID | Requirement                                              | Priority |
| ------ | -------------------------------------------------------- | -------- |
| FR-3.1 | Passenger shall create ride with pickup and destination  | Must     |
| FR-3.2 | Passenger shall select locations via map tap or search   | Must     |
| FR-3.3 | Passenger shall enter location as text (fallback)        | Must     |
| FR-3.4 | System shall prevent multiple active rides per passenger | Must     |
| FR-3.5 | App shall send lat/lng when available                    | Must     |
| FR-3.6 | New ride shall notify online drivers in real time        | Must     |
| FR-3.7 | Passenger may schedule a ride 15 min – 7 days ahead (F-24) | Could  |
| FR-3.8 | Scheduled rides shall notify drivers when pickup time arrives | Could |


### 5.4 Ride Assignment (F-08 – F-09)


| Req ID | Requirement                                                       | Priority |
| ------ | ----------------------------------------------------------------- | -------- |
| FR-4.1 | Driver shall view list of pending ride requests                   | Must     |
| FR-4.2 | Each request shall show passenger name, pickup, destination, time | Must     |
| FR-4.3 | Driver shall accept a request with one action                     | Must     |
| FR-4.4 | Driver shall reject a request (ride stays open for others)        | Must     |
| FR-4.5 | Only one driver shall be assigned per ride (server-enforced)      | Must     |
| FR-4.6 | Busy driver shall not accept new rides                            | Must     |
| FR-4.7 | Offline driver shall not accept rides                             | Must     |


### 5.5 Ride Lifecycle (F-10, F-16)


| Req ID | Requirement                                                         | Priority |
| ------ | ------------------------------------------------------------------- | -------- |
| FR-5.1 | Ride states: Requested, Accepted, In Progress, Completed, Cancelled | Must     |
| FR-5.2 | Driver shall start ride when passenger is picked up                 | Must     |
| FR-5.3 | Driver shall complete ride at destination                           | Must     |
| FR-5.4 | Passenger or assigned driver may cancel before completion           | Must     |
| FR-5.5 | UI shall show visual progress through ride states                   | Must     |
| FR-5.6 | History shall indicate whether a cancelled ride was cancelled by passenger or driver | Should |


### 5.6 Real-Time Updates (F-11)


| Req ID | Requirement                                                                         | Priority |
| ------ | ----------------------------------------------------------------------------------- | -------- |
| FR-6.1 | App shall maintain WebSocket connection when authenticated                          | Must     |
| FR-6.2 | App shall receive ride:requested, ride:accepted, ride:status:update, ride:cancelled | Must     |
| FR-6.3 | App shall receive driver:status:update and driver:location                            | Must     |
| FR-6.4 | UI shall update without manual refresh on socket events                             | Must     |
| FR-6.5 | App shall reconnect after network loss                                              | Should   |


### 5.7 Notifications (F-12)


| Req ID | Requirement                                    | Priority |
| ------ | ---------------------------------------------- | -------- |
| FR-7.1 | In-app toasts for success and error events     | Must     |
| FR-7.2 | Browser push notifications for critical events (tab in background) | Implemented |
| FR-7.3 | User may enable/disable notifications from Profile               | Implemented |


### 5.8 Driver Dashboard (F-13)


| Req ID | Requirement                                                                               | Priority |
| ------ | ----------------------------------------------------------------------------------------- | -------- |
| FR-8.1 | Dashboard shall provide Online / Offline toggle                                           | Must     |
| FR-8.2 | Dashboard shall show quick summary cards (completed, active, avg rating)                  | Must     |
| FR-8.3 | Dashboard shall show active ride details with Start / Complete / Cancel actions           | Must     |
| FR-8.4 | Dashboard shall display vehicle info                                                      | Must     |
| FR-8.5 | Dashboard shall refresh stats in real time via WebSocket                                  | Must     |
| FR-8.6 | Dashboard manual refresh shall also reload user verification status from `/api/auth/me`     | Implemented |
| FR-8.7 | Dashboard shall show verification pending/required banner when not verified               | Implemented |


### 5.9 Passenger History & Ratings (F-14, F-15)


| Req ID | Requirement                                                               | Priority |
| ------ | ------------------------------------------------------------------------- | -------- |
| FR-9.1 | Passenger shall view past rides on History page                           | Must     |
| FR-9.2 | Passenger shall rate completed ride (1–5 stars)                           | Must     |
| FR-9.3 | Passenger shall submit optional text feedback                             | Must     |
| FR-9.4 | Rating shall only be allowed once per completed ride                      | Must     |
| FR-9.5 | App shall prompt for rating after ride completion                         | Must     |


### 5.10 Driver Analytics Tab (F-14)


| Req ID  | Requirement                                                                                     | Priority |
| ------- | ----------------------------------------------------------------------------------------------- | -------- |
| FR-10.1 | Analytics page shall show extended summary cards                                                | Must     |
| FR-10.2 | Analytics page shall display a ride activity table                                              | Must     |
| FR-10.3 | Analytics page shall display full ride history list                                             | Must     |
| FR-10.4 | Analytics page shall display ratings received                                                   | Must     |
| FR-10.5 | Analytics page shall include at least one chart (rides per day)                                 | Must     |
| FR-10.6 | Analytics shall show campus-wide peak demand hours (F-26)                                       | Implemented |
| FR-10.7 | Analytics shall show campus-wide pickup and destination hotspots (F-26)                        | Implemented |
| FR-10.8 | Recent Activity shall list the driver's 10 most recent completed/cancelled rides                | Implemented |
| FR-10.9 | Full History shall list up to 50 of the driver's completed/cancelled rides                       | Implemented |


### 5.11 Maps & Location (F-07, F-18)


| Req ID  | Requirement                                                   | Priority |
| ------- | ------------------------------------------------------------- | -------- |
| FR-11.1 | App shall use browser geolocation for driver position         | Should   |
| FR-11.2 | Map shall display campus area with pickup/destination markers | Must     |
| FR-11.3 | Passenger shall set pickup via map tap or search              | Must     |
| FR-11.4 | In-progress ride shall show road route between pickup and destination | Implemented |
| FR-11.5 | Driver location shall update periodically when online         | Should   |
| FR-11.6 | Passenger may use saved/recent location quick picks (F-19)    | Implemented |


### 5.12 Network & Resilience (F-23)


| Req ID  | Requirement                                              | Priority    |
| ------- | -------------------------------------------------------- | ----------- |
| FR-12.1 | App shall show offline banner when browser loses network | Implemented |
| FR-12.2 | App shall show reconnecting state for WebSocket           | Implemented |
| FR-12.3 | API shall retry once on transient network failure         | Implemented |
| FR-12.4 | Manual refresh buttons on list/map screens (F-22)         | Implemented |


---

## 6. Non-Functional Requirements

### 6.1 Performance

| Req ID  | Requirement                                     |
| ------- | ----------------------------------------------- |
| NFR-1.1 | First contentful paint ≤ 3 seconds              |
| NFR-1.2 | Ride request API response perceived ≤ 2 seconds |
| NFR-1.3 | Real-time update latency ≤ 1 second           |
| NFR-1.4 | Map initial render ≤ 2 seconds                |

### 6.2 Security

| Req ID  | Requirement                                        |
| ------- | -------------------------------------------------- |
| NFR-3.1 | Session cookie HTTP-only; `SESSION_SECRET` in production; HTTPS recommended |
| NFR-3.2 | Role-based routing — no cross-role access (PASSENGER, DRIVER, ADMIN) |
| NFR-3.3 | CORS restricted to configured frontend origin with `credentials: true` |
| NFR-3.4 | Admin API routes require `ADMIN` role via session middleware |

### 6.3 Compatibility

| Req ID  | Requirement                                      |
| ------- | ------------------------------------------------ |
| NFR-5.1 | Responsive layout: mobile (≥375px) to desktop    |
| NFR-5.2 | Modern evergreen browsers                        |

---

## 7. System Interfaces

### 7.1 REST API


| Endpoint | Purpose |
| -------- | ------- |
| POST /api/auth/register | Registration (establishes session) |
| POST /api/auth/login | Login (establishes session) |
| POST /api/auth/logout | Destroy session |
| GET /api/auth/me | Current user |
| PUT /api/auth/profile | Update name / phone |
| PUT /api/drivers/verification | Submit license number + government ID (driver) |
| PUT /api/drivers/status | Online toggle (verified drivers only) |
| GET /api/admin/verifications/pending | Pending driver verifications (admin) |
| PUT /api/admin/verifications/:userId | Approve or reject verification (admin) |
| PUT /api/drivers/vehicle | Update vehicle info |
| PUT /api/drivers/location | Driver GPS update |
| GET /api/drivers/available | List online drivers |
| GET /api/drivers/dashboard | Driver dashboard |
| GET /api/drivers/analytics | Driver analytics |
| POST /api/rides | Create ride (optional `scheduledAt` ISO datetime) |
| GET /api/rides/active | Current ride |
| GET /api/rides/pending | Pending requests (driver) |
| GET /api/rides/history | Ride history |
| PUT /api/rides/:id/accept | Accept ride |
| PUT /api/rides/:id/reject | Reject ride |
| PUT /api/rides/:id/start | Start ride |
| PUT /api/rides/:id/complete | Complete ride |
| PUT /api/rides/:id/cancel | Cancel ride |
| POST /api/rides/:id/rate | Rate completed ride |

### 7.2 WebSocket Events


| Event | Direction | Web action |
| ----- | --------- | ---------- |
| driver:status | Client → Server | Driver toggle |
| driver:status:update | Server → All | Refresh driver list |
| driver:location | Server → All | Live driver marker |
| ride:requested | Server → Drivers | New request in list |
| ride:accepted | Server → Passenger | Status update |
| ride:rejected | Server → Drivers | Remove from list |
| ride:status:update | Server → Both | Stepper update |
| ride:cancelled | Server → Both | Status update |

### 7.3 External Services

| Service | Purpose |
| ------- | ------- |
| OpenStreetMap / Nominatim | Map tiles and geocoding |
| OSRM (router.project-osrm.org) | Driving route polyline for in-progress rides |

---

## 8. Data Requirements

### 8.1 Client-Side Storage (Web)

| Data | Storage | Retention |
| ---- | ------- | --------- |
| Session cookie | Browser (HTTP-only) | Until logout / expiry (7 days max) |
| User profile | Zustand (memory) | Until logout / refresh |
| Saved / recent locations | localStorage | Until cleared by user |
| Notification preference | localStorage | Until changed in Profile |

### 8.2 Server Data

- Users (`Role`: PASSENGER, DRIVER, ADMIN), DriverProfiles, Rides, Ratings, RideRejections
- Driver `licenseNumber`, `governmentIdNumber`, `verificationStatus`, `verificationSubmittedAt`, `verificationRejectionReason`
- Driver `currentLat` / `currentLng` for live location
- Ride `scheduledAt`, `driversNotifiedAt` for scheduled ride activation
- Ride `cancelledBy` for cancellation attribution in history
- PostgreSQL `session` table (via connect-pg-simple) for server-side sessions

---

## 9. Assumptions & Constraints

- Single web client; no native mobile app in scope
- Users access the platform via modern browsers
- Campus geography represented on Leaflet map (IIT Roorkee default center)
- Must demonstrate real-time WebSocket communication
- Public GitHub repo with reproducible setup

---

## 10. Release Plan

### 10.1 Web v1.0 — Core (Complete)

| Area | Deliverables |
| ---- | ------------ |
| Auth | Login, register, session cookies, role routing |
| Passenger | Map request, active ride, history, rate ride |
| Driver | Dashboard, requests, analytics, lifecycle |
| Real-time | WebSocket integration |
| Polish | Luminous Serenity UI, toasts, vehicle edit |

### 10.2 Web v1.1 — Enhancement (Complete)

| Area | Deliverables |
| ---- | ------------ |
| Locations | Saved / recent quick picks (F-19) |
| Resilience | Offline banner, socket reconnect UX, API retry (F-23) |
| Notifications | Browser notifications toggle in Profile (F-12) |
| Scheduling | Future ride booking with driver notify at pickup time (F-24) |
| Analytics | Campus-wide peak hours and hotspots (F-26) |
| Maps | Route polyline on in-progress rides; pickup/dest pins for driver |
| History | Cancelled-by passenger/driver labels |

### 10.3 Web v2.2 — Security & verification (Complete)

| Area | Deliverables |
| ---- | ------------ |
| Auth | Session cookies (PostgreSQL store); logout endpoint; Socket.IO session auth |
| Verification | Driver text verification on Profile; block go-online until verified |
| Admin | `/admin` pending list; approve/reject; login **Sign in as admin** checkbox |
| UX | Unified `AppHeader`; splash ~3.5s on bootstrap; register all-fields validation |

### 10.4 Success Criteria

- Full demo flow works in two browser windows (passenger + driver)
- Real-time updates without page refresh
- Map-based ride request functional (tap, search, quick picks)
- Driver Analytics shows personal stats plus campus demand insights
- Luminous Serenity UI applied consistently
- Scheduled rides activate and notify drivers at pickup time

---

## 11. User Flow & Navigation

### 11.1 Navigation Model

**Single SPA, two role-based experiences.** Routes defined in React Router.

```
/                          → redirect by auth + role
/login                     → Login (optional Sign in as admin)
/register                  → Register

/admin                     → Driver verification review (admin only)

/passenger                 → Passenger Home (map + request)
/passenger/history         → Ride history
/passenger/profile         → Profile

/driver                    → Driver Dashboard
/driver/requests           → Incoming requests
/driver/analytics          → Analytics hub
/driver/profile            → Profile
```

### 11.2 Passenger Routes


| Route | Page | Purpose |
| ----- | ---- | ------- |
| /passenger | Home | Map, request/schedule ride, active ride, online drivers |
| /passenger/history | History | Past rides (cancelled-by shown) |
| /passenger/profile | Profile | Edit profile, notifications, logout |

### 11.3 Driver Routes


| Route | Page | Purpose |
| ----- | ---- | ------- |
| /driver | Dashboard | Online toggle, map, active rides, stats |
| /driver/requests | Requests | Accept / reject pending rides |
| /driver/analytics | Analytics | Personal stats, campus demand, history |
| /driver/profile | Profile | Vehicle info, notifications, logout |

### 11.4 Admin Routes

| Route | Page | Purpose |
| ----- | ---- | ------- |
| /admin | Driver Verification | Review pending drivers; approve or reject |

### 11.5 Key User Flows

**Passenger request ride:**

```
Login → /passenger → set pickup & destination (map/search/quick picks)
→ Request (or Schedule for later) → [WebSocket] driver accepts
→ track status & route on map → rate on complete
```

**Driver shift:**

```
Login → /driver → Go Online → /driver/requests → Accept
→ Dashboard → Start (route shown on map) → Complete
```

**Scheduled ride:**

```
Passenger schedules ride → waits until pickup time
→ backend poller emits ride:requested → driver accepts as usual
```

**Driver verification:**

```
New driver registers → Profile → submit license number + government ID
→ status PENDING → admin logs in (Sign in as admin) → /admin → Approve
→ driver dashboard Refresh → Go Online enabled
```

**Admin login:**

```
/login → check Sign in as admin → admin@test.com → /admin
```

---

## 12. Appendix

### 12.1 Web Screen Inventory


| Screen | Route | Role | Status |
| ------ | ----- | ---- | ------ |
| Splash | bootstrap | All | Implemented (~3.5s minimum) |
| Login | /login | All | Implemented (admin checkbox) |
| Register | /register | Passenger, Driver | Implemented (all fields required) |
| Admin Verification | /admin | Admin | Implemented |
| Passenger Home | /passenger | Passenger | Implemented |
| Ride History | /passenger/history | Passenger | Implemented |
| Profile | /passenger/profile, /driver/profile | Both | Implemented |
| Driver Dashboard | /driver | Driver | Implemented |
| Incoming Requests | /driver/requests | Driver | Implemented |
| Driver Analytics | /driver/analytics | Driver | Implemented |
| Rate Ride Modal | overlay on Home | Passenger | Implemented |

### 12.2 Priority Summary


| Priority | Count | Focus |
| -------- | ----- | ----- |
| **Must (v1.0)** | 17 features | All implemented |
| **Should (v1.0)** | 6 features | All implemented |
| **Could (v1.1)** | 2 features | All implemented |
| **Won't** | Native mobile, full admin panel, payments, chat, file upload | Out of scope |
| **v2.2** | Session auth, driver verification, admin review UI | Implemented |

### 12.3 Database Notes

After pulling schema changes, sync the database:

```bash
cd backend && npm run db:push
```

Key `rides` columns: `scheduled_at`, `drivers_notified_at`, `cancelled_by`.

Key `driver_profiles` columns: `license_number`, `government_id_number`, `verification_status`, `verification_submitted_at`, `verification_rejection_reason`.

Seed accounts: `passenger@test.com`, `driver@test.com` (pre-verified), `admin@test.com` — password `password123`.

---

*End of SRS v2.2*
