-- HORENOVA transactional email outbox.
-- Apply through the Neon database owner, NEVER through the public API role.
-- Additive, idempotent schema. Do not include user data in migrations.
CREATE TABLE IF NOT EXISTS public.hr_email_outbox (
  event_key TEXT PRIMARY KEY,
  event_kind TEXT NOT NULL CHECK(event_kind IN ('candidate','job','shift')),
  recipient_email TEXT NOT NULL,
  locale TEXT NOT NULL DEFAULT 'fr',
  payload JSONB NOT NULL,
  state TEXT NOT NULL DEFAULT 'queued' CHECK(state IN ('queued','sending','sent','failed')),
  attempts INTEGER NOT NULL DEFAULT 0,
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  lease_until TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  provider_id TEXT,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS hr_email_outbox_pending_idx
  ON public.hr_email_outbox(next_attempt_at,created_at)
  WHERE state IN ('queued','sending');
GRANT SELECT,INSERT,UPDATE ON public.hr_email_outbox TO horenova_api;
