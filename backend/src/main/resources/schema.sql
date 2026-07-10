-- ============================================================
-- GetMyTix Database Schema
-- Run this once against a fresh PostgreSQL database
-- ============================================================

-- Drop order matters (FK constraints)
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS seats CASCADE;
DROP TABLE IF EXISTS queue_entries CASCADE;
DROP TABLE IF EXISTS events CASCADE;

-- ─── Events ──────────────────────────────────────────────────
CREATE TABLE events (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(255)    NOT NULL,
    venue       VARCHAR(255)    NOT NULL,
    event_date  TIMESTAMP       NOT NULL,
    description TEXT,
    image_url   VARCHAR(512),
    total_seats INT             NOT NULL DEFAULT 100,
    available_seats INT         NOT NULL DEFAULT 100
);

-- ─── Seats ───────────────────────────────────────────────────
-- status: AVAILABLE | LOCKED | BOOKED
-- version: optimistic locking column (incremented on every UPDATE)
CREATE TABLE seats (
    id          BIGSERIAL PRIMARY KEY,
    event_id    BIGINT          NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    row_label   VARCHAR(4)      NOT NULL,   -- e.g. "A", "B"
    seat_number INT             NOT NULL,   -- e.g. 1..10
    status      VARCHAR(20)     NOT NULL DEFAULT 'AVAILABLE',
    version     BIGINT          NOT NULL DEFAULT 0,
    locked_at   TIMESTAMP,
    locked_by   VARCHAR(255),
    locked_until TIMESTAMP,
    locked_for_checkout BOOLEAN DEFAULT false,
    UNIQUE (event_id, row_label, seat_number)
);

-- ─── Queue Entries ───────────────────────────────────────────
CREATE TABLE queue_entries (
    id              BIGSERIAL PRIMARY KEY,
    event_id        BIGINT          NOT NULL REFERENCES events(id),
    user_name       VARCHAR(255)    NOT NULL,
    queue_position  INT             NOT NULL,
    joined_at       TIMESTAMP       NOT NULL DEFAULT now(),
    status          VARCHAR(20)     NOT NULL DEFAULT 'WAITING'  -- WAITING | ADMITTED
);

-- ─── Bookings ────────────────────────────────────────────────
CREATE TABLE bookings (
    id              BIGSERIAL PRIMARY KEY,
    event_id        BIGINT          NOT NULL REFERENCES events(id),
    user_name       VARCHAR(255)    NOT NULL,
    queue_entry_id  BIGINT          REFERENCES queue_entries(id),
    booked_at       TIMESTAMP       NOT NULL DEFAULT now(),
    total_seats     INT             NOT NULL
);

-- Booking <-> Seat join (one booking can have multiple seats)
ALTER TABLE seats ADD COLUMN booking_id BIGINT REFERENCES bookings(id);

-- ─── Indexes ─────────────────────────────────────────────────
CREATE INDEX idx_seats_event_status ON seats(event_id, status);
CREATE INDEX idx_queue_event        ON queue_entries(event_id);
CREATE INDEX idx_bookings_user      ON bookings(user_name);

-- ─── Seed Data ───────────────────────────────────────────────
INSERT INTO events (name, venue, event_date, description, image_url, total_seats, available_seats) VALUES
(
    'Arctic Monkeys — Live',
    'DY Patil Stadium, Mumbai',
    '2025-11-15 20:00:00',
    'The Sheffield legends return to India for one unforgettable night. Expect all the classics and surprises from their latest album.',
    'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800',
    60, 60
),
(
    'Tech Summit 2025',
    'Bharat Mandapam, New Delhi',
    '2025-12-05 09:00:00',
    'India''s largest technology conference with 120+ speakers covering AI, Cloud, Blockchain and the future of engineering.',
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
    60, 60
),
(
    'IPL Final — MI vs CSK',
    'Narendra Modi Stadium, Ahmedabad',
    '2025-11-28 19:30:00',
    'The most anticipated cricket final of the decade. Two titans clash for the ultimate crown in front of 132,000 screaming fans.',
    'https://en.wikipedia.org/wiki/Future_Nostalgia_Tour#/media/File:Future_Nostalgia_Tour_poster.png',
    60, 60
),
(
    'Dua Lipa — Future Nostalgia Tour',
    'Jawaharlal Nehru Stadium, Delhi',
    '2025-12-20 21:00:00',
    'Pop powerhouse Dua Lipa brings her critically acclaimed Future Nostalgia Tour to India for the very first time.',
    'https://images.unsplash.com/photo-1501386761578-eee0face-1400?w=800',
    60, 60
);

-- Generate seats for all events: rows A-F, seats 1-10 (60 seats per event)
DO $$
DECLARE
    ev  RECORD;
    r   TEXT;
    s   INT;
    rows TEXT[] := ARRAY['A','B','C','D','E','F'];
BEGIN
    FOR ev IN SELECT id FROM events LOOP
        FOREACH r IN ARRAY rows LOOP
            FOR s IN 1..10 LOOP
                INSERT INTO seats (event_id, row_label, seat_number, status, version)
                VALUES (ev.id, r, s, 'AVAILABLE', 0);
            END LOOP;
        END LOOP;
    END LOOP;
END $$;
