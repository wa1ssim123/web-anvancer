-- HORENOVA: publish central, admin-approved requests only.
-- These statements were applied to Neon on 2026-11-22.
-- Never backfill historical approvals into outgoing Telegram by default.
CREATE TABLE IF NOT EXISTS hr_social_publications(
 request_id UUID NOT NULL REFERENCES hr_recruiter_requests(id),
 channel TEXT NOT NULL CHECK(channel IN ('telegram','whatsapp')),
 status TEXT NOT NULL CHECK(status IN ('pending','sending','published','manual','needs_review','cancelled')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 sent_at TIMESTAMPTZ,
 attempts INT NOT NULL DEFAULT 0 CHECK(attempts>=0),
 telegram_message_id BIGINT,
 last_error TEXT,
 PRIMARY KEY(request_id,channel)
);
CREATE INDEX IF NOT EXISTS hr_social_publications_pending_idx ON hr_social_publications(created_at)
 WHERE channel='telegram' AND status='pending';

-- Reapproving a formerly withdrawn/pending offer must revive its undelivered posts.
-- Never resend published Telegram messages or automatically retry ambiguous attempts.
CREATE OR REPLACE FUNCTION hr_social_on_recruiter_status() RETURNS trigger AS $social$
BEGIN
 IF NEW.removed_at IS NOT NULL OR NEW.status <> 'VALIDEE' THEN
  UPDATE hr_social_publications SET status='cancelled',updated_at=now()
   WHERE request_id=NEW.id AND status IN ('pending','manual','needs_review');
 ELSIF NEW.status='VALIDEE' AND (
   OLD.status IS DISTINCT FROM 'VALIDEE'
   OR EXISTS(
    SELECT 1 FROM hr_social_publications previous
    WHERE previous.request_id=NEW.id AND previous.status='cancelled'
     AND previous.attempts=0 AND previous.sent_at IS NULL
     AND previous.telegram_message_id IS NULL
   )
  ) THEN
  INSERT INTO hr_social_publications(request_id,channel,status)
   VALUES (NEW.id,'telegram','pending'),(NEW.id,'whatsapp','manual')
   ON CONFLICT(request_id,channel) DO UPDATE
   SET status=CASE
      WHEN hr_social_publications.status='cancelled'
       AND hr_social_publications.attempts=0
       AND hr_social_publications.sent_at IS NULL
       AND hr_social_publications.telegram_message_id IS NULL
      THEN EXCLUDED.status
      WHEN hr_social_publications.status='cancelled'
       AND hr_social_publications.channel='telegram'
       AND hr_social_publications.attempts>0
      THEN 'needs_review'
      ELSE hr_social_publications.status
    END,
    last_error=CASE
      WHEN hr_social_publications.status='cancelled'
       AND hr_social_publications.attempts=0
       AND hr_social_publications.sent_at IS NULL
       AND hr_social_publications.telegram_message_id IS NULL
      THEN NULL
      WHEN hr_social_publications.status='cancelled'
       AND hr_social_publications.channel='telegram'
       AND hr_social_publications.attempts>0
      THEN coalesce(hr_social_publications.last_error,
       'A previous Telegram attempt may have succeeded. Check the channel before retrying.')
      ELSE hr_social_publications.last_error
    END,
    updated_at=now();
 END IF;
 RETURN NEW;
END
$social$ LANGUAGE plpgsql;

-- On existing databases, replace the function only: the original trigger already exists.
CREATE TRIGGER hr_social_recruiter_status_trigger AFTER UPDATE OF status,removed_at
 ON hr_recruiter_requests FOR EACH ROW EXECUTE FUNCTION hr_social_on_recruiter_status();
