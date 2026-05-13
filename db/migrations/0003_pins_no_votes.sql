-- Drop voting and days. The new model: each suggestion belongs directly to a
-- stop with an is_pinned boolean; only pinned suggestions show on the map.
-- Trip and stop get explicit date ranges. The trip creator is the "boss".

-- Suggestion: attach to stop, add is_pinned (default TRUE — adding == pinning).
ALTER TABLE suggestion
  ADD COLUMN IF NOT EXISTS stop_id   UUID REFERENCES stop(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT TRUE;

UPDATE suggestion sg SET stop_id = d.stop_id
  FROM day d
  WHERE sg.day_id = d.id AND sg.stop_id IS NULL;

ALTER TABLE suggestion ALTER COLUMN stop_id SET NOT NULL;

-- Collapse categories to the new 4-tag set.
UPDATE suggestion SET category = CASE category
  WHEN 'lodging' THEN 'hotel'
  WHEN 'drinks'  THEN 'drink'
  WHEN 'coffee'  THEN 'food'
  WHEN 'food'    THEN 'food'
  WHEN 'activity' THEN 'activity'
  WHEN 'other'   THEN 'activity'
  ELSE 'activity'
END;
UPDATE suggestion SET category = 'activity' WHERE category IS NULL;
ALTER TABLE suggestion ALTER COLUMN category SET NOT NULL;

ALTER TABLE suggestion DROP COLUMN IF EXISTS day_id;
CREATE INDEX IF NOT EXISTS suggestion_stop_idx ON suggestion(stop_id);

-- The day and vote tables are no longer used.
DROP TABLE IF EXISTS day  CASCADE;
DROP TABLE IF EXISTS vote CASCADE;

-- Trip gets a primary date range + a boss client id (set on creation).
ALTER TABLE trip
  ADD COLUMN IF NOT EXISTS start_date     DATE,
  ADD COLUMN IF NOT EXISTS end_date       DATE,
  ADD COLUMN IF NOT EXISTS boss_client_id TEXT;

-- Stop replaces arrival_date/depart_date with a date range matching trip.
ALTER TABLE stop
  ADD COLUMN IF NOT EXISTS start_date DATE,
  ADD COLUMN IF NOT EXISTS end_date   DATE;

UPDATE stop SET
  start_date = arrival_date,
  end_date   = COALESCE(depart_date, arrival_date)
WHERE start_date IS NULL;

ALTER TABLE stop DROP COLUMN IF EXISTS arrival_date;
ALTER TABLE stop DROP COLUMN IF EXISTS depart_date;
