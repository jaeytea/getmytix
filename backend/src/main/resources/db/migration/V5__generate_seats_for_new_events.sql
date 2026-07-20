-- V4 Migration: Generate seats for the 2 new events (IDs 5 and 6)

DO $$
DECLARE
    ev  RECORD;
    r   TEXT;
    s   INT;
    rows TEXT[] := ARRAY['A','B','C','D','E','F'];
BEGIN
    -- Generate seats only for the new events (IDs 5-6)
    FOR ev IN SELECT id FROM events WHERE id >= 5 LOOP
        FOREACH r IN ARRAY rows LOOP
            FOR s IN 1..10 LOOP
                INSERT INTO seats (event_id, row_label, seat_number, status, version)
                VALUES (ev.id, r, s, 'AVAILABLE', 0)
                ON CONFLICT DO NOTHING;  -- Prevent duplicate insertions if re-run
            END LOOP;
        END LOOP;
    END LOOP;
END $$;
