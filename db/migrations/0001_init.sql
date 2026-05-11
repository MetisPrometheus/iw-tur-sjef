-- tur-sjef initial schema
-- Collaborative road-trip planner with slug-based access and per-slot voting.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS trip (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS participant (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id       UUID NOT NULL REFERENCES trip(id) ON DELETE CASCADE,
  client_id     TEXT NOT NULL,
  display_name  TEXT NOT NULL,
  color         TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (trip_id, client_id)
);
CREATE INDEX IF NOT EXISTS participant_trip_idx ON participant(trip_id);

CREATE TABLE IF NOT EXISTS stop (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id       UUID NOT NULL REFERENCES trip(id) ON DELETE CASCADE,
  order_index   INT  NOT NULL,
  name          TEXT NOT NULL,
  lat           DOUBLE PRECISION NOT NULL,
  lng           DOUBLE PRECISION NOT NULL,
  arrival_date  DATE,
  depart_date   DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS stop_trip_order_idx ON stop(trip_id, order_index);

-- A "day slot" = one row per (stop, date, kind, order). kind is the category
-- (lunch, dinner, activity, lodging, …). order_index allows multiple of same
-- kind in a day (e.g. two activities). capacity = how many top-voted suggestions
-- win for this slot.
CREATE TABLE IF NOT EXISTS day_slot (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stop_id      UUID NOT NULL REFERENCES stop(id) ON DELETE CASCADE,
  date         DATE NOT NULL,
  kind         TEXT NOT NULL,
  label        TEXT,
  capacity     INT  NOT NULL DEFAULT 1 CHECK (capacity >= 1),
  time_start   TIME,
  time_end     TIME,
  order_index  INT  NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS day_slot_stop_date_idx ON day_slot(stop_id, date);

CREATE TABLE IF NOT EXISTS suggestion (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id     UUID NOT NULL REFERENCES day_slot(id) ON DELETE CASCADE,
  added_by    UUID NOT NULL REFERENCES participant(id) ON DELETE CASCADE,
  place_id    TEXT,
  name        TEXT NOT NULL,
  address     TEXT,
  lat         DOUBLE PRECISION,
  lng         DOUBLE PRECISION,
  rating      NUMERIC(2,1),
  photo_ref   TEXT,
  url         TEXT,
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS suggestion_slot_idx ON suggestion(slot_id);

CREATE TABLE IF NOT EXISTS vote (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  suggestion_id   UUID NOT NULL REFERENCES suggestion(id) ON DELETE CASCADE,
  participant_id  UUID NOT NULL REFERENCES participant(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (suggestion_id, participant_id)
);
CREATE INDEX IF NOT EXISTS vote_suggestion_idx ON vote(suggestion_id);
CREATE INDEX IF NOT EXISTS vote_participant_idx ON vote(participant_id);
