-- Distinguish private pre-introduction history from the messages in a later three-party room.
ALTER TABLE hr_applications ADD COLUMN IF NOT EXISTS match_started_at timestamptz;
CREATE INDEX IF NOT EXISTS hr_applications_match_started_idx ON hr_applications(match_started_at) WHERE match_started_at IS NOT NULL;