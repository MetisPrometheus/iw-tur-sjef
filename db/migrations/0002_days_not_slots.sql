-- Simplify the model: one row per (stop, date) instead of many slots per day.
-- Suggestions now attach directly to a day, with an optional category tag.

CREATE TABLE IF NOT EXISTS day (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stop_id     UUID NOT NULL REFERENCES stop(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  label       TEXT,
  capacity    INT  NOT NULL DEFAULT 5 CHECK (capacity >= 1),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (stop_id, date)
);
CREATE INDEX IF NOT EXISTS day_stop_date_idx ON day(stop_id, date);

-- Backfill: one day row per unique (stop, date) from day_slot.
INSERT INTO day (stop_id, date)
SELECT stop_id, date FROM day_slot
GROUP BY stop_id, date
ON CONFLICT (stop_id, date) DO NOTHING;

-- Suggestion gets a day_id and an optional category tag.
ALTER TABLE suggestion
  ADD COLUMN IF NOT EXISTS day_id   UUID REFERENCES day(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS category TEXT;

-- Map old slot.kind to the simpler category vocabulary and set day_id.
UPDATE suggestion sg
SET
  day_id   = d.id,
  category = CASE ds.kind
    WHEN 'breakfast' THEN 'coffee'
    WHEN 'coffee'    THEN 'coffee'
    WHEN 'lunch'     THEN 'food'
    WHEN 'dinner'    THEN 'food'
    WHEN 'activity'  THEN 'activity'
    WHEN 'drink'     THEN 'drinks'
    WHEN 'lodging'   THEN 'lodging'
    WHEN 'custom'    THEN 'other'
    ELSE 'other'
  END
FROM day_slot ds
JOIN day d ON d.stop_id = ds.stop_id AND d.date = ds.date
WHERE sg.slot_id = ds.id;

-- Lock in the new shape and drop the old slot column.
ALTER TABLE suggestion ALTER COLUMN day_id SET NOT NULL;
ALTER TABLE suggestion DROP COLUMN IF EXISTS slot_id;
CREATE INDEX IF NOT EXISTS suggestion_day_idx ON suggestion(day_id);

DROP TABLE IF EXISTS day_slot;
