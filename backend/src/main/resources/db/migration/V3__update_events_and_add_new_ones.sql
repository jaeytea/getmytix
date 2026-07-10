-- V3 Migration: Update existing events with new details and add 2 more events

-- Update existing events with new details
UPDATE events
SET 
    name = 'Arctic Monkeys — Live',
    venue = 'MMRDA Grounds, Mumbai',
    event_date = '2027-11-15 20:00:00',
    description = 'The Sheffield legends return to India for one unforgettable night. Expect all the classics and surprises from their latest album.',
    image_url = 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800',
    total_seats = 60,
    available_seats = 60
WHERE id = 1;

UPDATE events
SET 
    name = 'AI Tech Summit 2027',
    venue = 'Bharat Mandapam, New Delhi',
    event_date = '2027-12-05 09:00:00',
    description = 'India''s largest technology conference with 120+ speakers covering AI, Cloud, Blockchain and the future of engineering.',
    image_url = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
    total_seats = 60,
    available_seats = 60
WHERE id = 2;

UPDATE events
SET 
    name = 'IPL Final — MI vs CSK',
    venue = 'DY Patil Stadium, Mumbai',
    event_date = '2027-11-28 19:30:00',
    description = 'The most anticipated cricket final of the decade. Two titans clash for the ultimate crown in front of 132,000 screaming fans.',
    image_url = '/images/ipl.jpeg',
    total_seats = 60,
    available_seats = 60
WHERE id = 3;

UPDATE events
SET 
    name = 'Dua Lipa — Future Nostalgia Tour',
    venue = 'Stanford Stadium, California',
    event_date = '2027-12-20 21:00:00',
    description = 'Pop powerhouse Dua Lipa brings her critically acclaimed Future Nostalgia Tour for the very first time.',
    image_url = '/images/dualipa.jpeg',
    total_seats = 60,
    available_seats = 60
WHERE id = 4;

-- Add 2 new events
INSERT INTO events (name, venue, event_date, description, image_url, total_seats, available_seats)
VALUES 
(
    'Coldplay: Live at Wembley 2027',
    'Wembley Stadium, London',
    '2027-08-15 19:30:00',
    'Coldplay performs an epic night at the legendary Wembley Stadium with hits spanning their entire career.',
    '/images/coldplay.jpeg',
    60, 60
),
(
    'Le Sserafim — Pureflow World Tour',
    'Madison Square Garden, New York',
    '2027-09-22 20:00:00',
    'Le Sserafim brings their electrifying Pureflow world tour to NYC with topnotch visuals.',
    '/images/lsfm.jpeg',
    60, 60
);

-- Note: New event seats will be generated on-demand via the `POST /api/events/create` endpoint
-- Or you can manually insert seats for the new events via another migration or POST endpoint.
