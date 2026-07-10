ALTER TABLE seats
    ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP,
    ADD COLUMN IF NOT EXISTS locked_for_checkout BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_seats_locked_until ON seats (locked_until);
