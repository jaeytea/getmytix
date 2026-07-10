# 🎟️ GetMyTix

> A full-stack ticket booking MVP built to demonstrate **concurrency, optimistic locking, and race condition handling** in a Spring Boot 3 + React application.

---

## Tech Stack

| Layer      | Technology                            |
|------------|---------------------------------------|
| Frontend   | React 18, Vite, Material UI, Zustand  |
| Backend    | Spring Boot 3, Spring Data JPA        |
| Database   | PostgreSQL                            |
| Build      | Maven, Node 18+                       |

---

## Architecture

```
getmytix/
├── backend/                        ← Spring Boot 3 (modular monolith)
│   └── src/main/java/com/getmytix/
│       ├── entity/                 ← JPA entities (Event, Seat, QueueEntry, Booking)
│       ├── repository/             ← Spring Data JPA repositories
│       ├── service/                ← Business logic, concurrency handling
│       ├── controller/             ← REST endpoints
│       ├── scheduler/              ← BotScheduler (race condition simulator)
│       ├── dto/                    ← Request/Response records
│       └── config/                 ← CORS, global exception handler
└── frontend/                       ← React + Vite SPA
    └── src/
        ├── api/client.js           ← Axios API layer
        ├── store/useStore.js       ← Zustand global state
        ├── pages/                  ← LandingPage → Events → Queue → Seats → Success
        └── theme/theme.js          ← MUI dark theme
```

---

## Quick Start

### Prerequisites
- Java 21+
- Node 18+
- PostgreSQL 14+ running locally

### 1. Database setup

```bash
psql -U postgres -c "CREATE DATABASE getmytix;"
```

Then start the backend and let Flyway apply the migrations automatically from:

```text
backend/src/main/resources/db/migration/
```

If you want a fresh local database with seed data, you can still run the initial schema script once:

```bash
psql -U postgres -d getmytix -f backend/src/main/resources/schema.sql
```

For an existing database, use the migration files instead of re-running the whole schema script.

### 2. Backend

```bash
cd backend
./mvnw spring-boot:run
# Starts on http://localhost:8080
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
# Starts on http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173).

---

## API Reference

### Events
```
GET  /api/events              → List all events (with live available seat count)
GET  /api/events/{id}         → Get single event
```

### Seat Map
```
GET  /api/events/{id}/seats   → Full seat map for an event (includes @Version per seat)
```

### Queue
```
POST /api/queue/join          → Join queue, receive random position
GET  /api/queue/{id}/status   → Poll position, ahead count, wait time
POST /api/queue/{id}/admit    → Mark user as admitted to seat selection
```

### Bookings
```
POST /api/bookings            → Attempt to book seats (optimistic lock enforced)
```

**Booking payload:**
```json
{
  "eventId": 1,
  "userName": "Alice",
  "queueEntryId": 42,
  "seats": [
    { "seatId": 15, "version": 3 },
    { "seatId": 16, "version": 0 }
  ]
}
```

**Responses:**
- `200 OK` → Booking confirmed
- `409 CONFLICT` → Optimistic lock failure (seat grabbed by another user)
- `400 BAD REQUEST` → Validation error

---

## The Core Demo: Optimistic Locking

### What it demonstrates

This is the key interview talking point. The `Seat` entity has:

```java
@Version
@Column(nullable = false)
private Long version;
```

**How a race condition is prevented:**

```
Thread A reads seat (id=15, version=3, status=AVAILABLE)
Thread B reads seat (id=15, version=3, status=AVAILABLE)

Thread A writes:
  UPDATE seats SET status='BOOKED', version=4
  WHERE id=15 AND version=3  → 1 row updated ✓

Thread B writes:
  UPDATE seats SET status='BOOKED', version=4
  WHERE id=15 AND version=3  → 0 rows updated ✗
  → Hibernate throws OptimisticLockException
  → Service catches → returns 409 CONFLICT
```

**The client sends the version it read back to the server:**
```json
{ "seatId": 15, "version": 3 }
```

If the version doesn't match what's in the DB, the booking is rejected immediately — **without any pessimistic row-level locks**.

---

## The Bot Scheduler (Race Condition Simulator)

`BotScheduler.java` runs background jobs that simulate concurrent demand:

| Job                | Interval | What it does                                          |
|--------------------|----------|-------------------------------------------------------|
| `lockRandomSeats`  | 4s       | Randomly LOCKS 1–2 available seats per event          |
| `bookLockedSeats`  | 7s       | Promotes a LOCKED seat to BOOKED                      |
| `releaseStaleLocks`| 10s      | Releases LOCKED seats older than 15s back to AVAILABLE|

Watch the seat map in the browser — seats flicker from green → orange → red in real time.

**To disable the bot** (for manual demos):
```properties
# application.properties
app.scheduler.bot-seats-per-tick=0
```

---

## Seat State Machine

```
AVAILABLE  ──lock()──►  LOCKED  ──book()──►  BOOKED
    ▲                      │
    └──── TTL expiry ───────┘
```

- **AVAILABLE** (green)  → Can be selected
- **LOCKED** (amber)     → Someone is looking (bot or user); short-lived
- **BOOKED** (dark blue) → Permanently taken

---

## Interview Talking Points

### 1. Why optimistic locking over pessimistic?
> "Pessimistic locking holds a DB row lock for the entire duration of user interaction — seconds or minutes. With thousands of concurrent users on a seat map, that's a deadlock waiting to happen. Optimistic locking assumes conflicts are rare, does no locking on read, and only checks at write time. The cost is a `409` retry for the rare collision, which is a much better tradeoff for a booking system."

### 2. What happens at the DB level?
> "Hibernate appends `AND version = ?` to every UPDATE statement. If 0 rows are affected, it knows another transaction modified the row and throws `OptimisticLockException`. No extra tables, no locks, just a version integer."

### 3. How does the frontend handle conflicts?
> "The seat map component sends `{seatId, version}` pairs — the version it *read* from the server. If by the time the POST arrives the seat's version has incremented (another user booked it), the server rejects with `409 CONFLICT`. The frontend catches this, clears the selection, refreshes the seat map, and shows an informative snackbar."

### 4. What about the queue?
> "The queue is a simplified simulation. In production this would be Redis or a proper FIFO queue service. Here it demonstrates the concept: users get a random position on join, the frontend polls every 3 seconds, and a countdown is derived from `aheadCount × 3s`."

### 5. Why modular monolith instead of microservices?
> "YAGNI. Microservices add network latency, distributed transaction complexity, and operational overhead. For an MVP this size, a well-structured monolith with clean package boundaries (`entity`, `service`, `controller`) is faster to build, test, and reason about. The packages *are* the modules — splitting into services is an incremental step if needed."

---

## Project Decisions & Trade-offs

| Decision                    | Chosen                    | Alternative      | Reason                                  |
|-----------------------------|---------------------------|------------------|-----------------------------------------|
| Locking strategy            | Optimistic (@Version)     | Pessimistic (FOR UPDATE) | Better throughput, no deadlocks    |
| Queue persistence           | PostgreSQL                | Redis            | Simpler; Redis not needed for MVP       |
| State management (FE)       | Zustand                   | Redux / Context  | Minimal boilerplate for this scope      |
| Auth                        | None (name only)          | JWT / OAuth      | Out of scope; focus on concurrency demo |
| Schema migration            | Raw SQL (`schema.sql`)    | Flyway/Liquibase | Simpler for single-run MVP              |

---

## Extending This Project

Ideas to go further:
- **Flyway** migrations instead of raw `schema.sql`
- **WebSocket** seat map push instead of polling
- **Redis** for a real FIFO queue
- **JWT auth** with Spring Security
- **Stripe** fake payment intent
- **Docker Compose** for one-command startup
- **JMeter / Gatling** load test to trigger real optimistic lock conflicts at scale
