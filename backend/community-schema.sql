-- HORENOVA official WhatsApp and Telegram channel links, activated only after an admin supplies
-- the actual official channel URL through the protected HORENOVA admin interface.
CREATE TABLE IF NOT EXISTS hr_social_channels (
  channel_type TEXT PRIMARY KEY CHECK (channel_type IN ('whatsapp','telegram')),
  url TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS hr_social_channels_updated_idx ON hr_social_channels(updated_at DESC);
