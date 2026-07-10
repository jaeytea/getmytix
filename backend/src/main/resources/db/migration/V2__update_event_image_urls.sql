-- Optional seed update for image URLs. Safe to run even if the old values differ.
UPDATE events
SET image_url ='https://en.wikipedia.org/wiki/Future_Nostalgia_Tour#/media/File:Future_Nostalgia_Tour_poster.png' 
WHERE lower(name) LIKE '%dua lipa%' AND (image_url IS NULL OR image_url = '');
