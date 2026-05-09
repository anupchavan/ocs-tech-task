# OCS Room Booking System — IIT Hyderabad

A secure room booking system for the Office of Career Services (OCS), IIT Hyderabad. Supports booking rooms across all campus blocks for OA, Interviews, and Pre-Placement Talks (PPTs), with role-based access control, conflict detection, and capacity enforcement.

## Tech Stack

- **Frontend**: React + TypeScript + Vite, Flexoki color scheme
- **Backend**: Node.js + Express
- **Database**: MongoDB + Mongoose
- **Auth**: JWT (admin-created accounts only)

---

## Quick Start

### Prerequisites

- Node.js ≥ 18
- MongoDB running locally (`mongod`)

### 1. Start the server

```bash
cd server
npm install
npm run seed        # seeds admin + all rooms from the task document
npm run dev         # or: npm start
```

Server runs on **http://localhost:5000**

**Default admin credentials** (created by seed):
- Email: `admin@ocs.iith.ac.in`
- Password: `admin123`

> Change the password immediately after first login via the Users page.

### 2. Start the client

```bash
cd client
npm install
npm run dev
```

Client runs on **http://localhost:5173**

---

## Features

### Authentication
- No self-registration — only admins can create user accounts
- JWT-based session (7-day token)
- Account deactivation without deletion

### Roles
| Role | Can Book | Manage Users | Manage Rooms | View All Bookings |
|------|----------|--------------|--------------|-------------------|
| Admin | ✅ | ✅ | ✅ | ✅ |
| Core Member | ✅ | ❌ | ❌ | Own only |
| Viewer | ❌ | ❌ | ❌ | Own only |

### Booking Engine
- 3-step wizard: Requirements → Room Selection → Confirm
- Filters rooms by date, time slot, block, capacity, and purpose
- Real-time conflict detection (no double-booking)
- Capacity enforcement (participants ≤ room capacity)
- Purpose restriction per room (optional)
- Past-date booking prevention

### Admin Dashboard
- Stats: total, upcoming, today's count, cancelled
- Manage users: create, edit, deactivate, delete
- Manage rooms: add, edit, enable/disable, delete
- View and cancel any booking with full filters

---

## API Endpoints

### Auth
- `POST /api/auth/login` — login
- `GET  /api/auth/me` — current user (protected)

### Users (admin only)
- `GET    /api/users` — list all
- `POST   /api/users` — create
- `PUT    /api/users/:id` — update
- `DELETE /api/users/:id` — delete

### Rooms (read: all; write: admin only)
- `GET    /api/rooms` — list (with filters: block, minCapacity, purpose, date, startTime, endTime)
- `GET    /api/rooms/blocks` — distinct block names
- `GET    /api/rooms/:id`
- `POST   /api/rooms` — create
- `PUT    /api/rooms/:id` — update
- `DELETE /api/rooms/:id`

### Bookings
- `GET    /api/bookings` — list (admin: all; others: own)
- `GET    /api/bookings/stats` — admin dashboard stats
- `GET    /api/bookings/:id`
- `POST   /api/bookings` — create (admin + core_member)
- `PUT    /api/bookings/:id` — update
- `DELETE /api/bookings/:id` — cancel

---

## Room Data

54 rooms seeded across blocks: **A, BT/BM, C, CSE, CY, EE, LHC, MA, MSME, PH**

Capacity range: 24 (BT/BM small rooms) → 800 (LHC-05).

Additional rooms/blocks can be added via the Admin → Manage Rooms page.

---

## Environment Variables

```env
# server/.env
PORT=5001
MONGO_URI=mongodb://localhost:27017/ocs_room_booking
JWT_SECRET=<change-this-in-production>
CLIENT_URL=http://localhost:5173
```
