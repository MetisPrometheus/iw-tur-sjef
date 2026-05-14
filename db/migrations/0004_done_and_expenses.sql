-- Track whether each saved place was actually visited / done during the trip,
-- and the money side: who paid, who owes.

ALTER TABLE suggestion
  ADD COLUMN IF NOT EXISTS is_done BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS expense (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  suggestion_id   UUID NOT NULL REFERENCES suggestion(id) ON DELETE CASCADE,
  amount          NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  currency        TEXT NOT NULL DEFAULT 'NOK',
  paid_by         UUID NOT NULL REFERENCES participant(id) ON DELETE CASCADE,
  split_kind      TEXT NOT NULL DEFAULT 'equal' CHECK (split_kind IN ('equal','amounts')),
  note            TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS expense_suggestion_idx ON expense(suggestion_id);
CREATE INDEX IF NOT EXISTS expense_paid_by_idx ON expense(paid_by);

CREATE TABLE IF NOT EXISTS expense_split (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id      UUID NOT NULL REFERENCES expense(id) ON DELETE CASCADE,
  participant_id  UUID NOT NULL REFERENCES participant(id) ON DELETE CASCADE,
  amount          NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  UNIQUE (expense_id, participant_id)
);
CREATE INDEX IF NOT EXISTS expense_split_expense_idx ON expense_split(expense_id);
CREATE INDEX IF NOT EXISTS expense_split_participant_idx ON expense_split(participant_id);
