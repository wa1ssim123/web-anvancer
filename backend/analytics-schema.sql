-- HORENOVA analytics: privacy-minimized, first-party session and historical Wix role tracking.
-- Does not store IP addresses, device fingerprints, pages, names, email or raw browser IDs.
CREATE TABLE IF NOT EXISTS hr_analytics_roles (
  member_wix_id TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('candidate','recruiter')),
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  verified_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS hr_analytics_roles_role_registered_idx ON hr_analytics_roles (role,registered_at);
CREATE TABLE IF NOT EXISTS hr_analytics_sessions (
  session_hash CHAR(64) PRIMARY KEY,
  browser_hash CHAR(64) NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS hr_analytics_sessions_started_idx ON hr_analytics_sessions (started_at);
CREATE INDEX IF NOT EXISTS hr_analytics_sessions_browser_idx ON hr_analytics_sessions (browser_hash);
CREATE TABLE IF NOT EXISTS hr_analytics_wix_daily (
  day DATE PRIMARY KEY,
  sessions INTEGER NOT NULL CHECK (sessions>=0),
  daily_unique_visitors INTEGER NOT NULL CHECK (daily_unique_visitors>=0)
);
CREATE TABLE IF NOT EXISTS hr_analytics_wix_summary (
  id BOOLEAN PRIMARY KEY DEFAULT true CHECK (id=true),
  first_day DATE NOT NULL,
  through_day DATE NOT NULL,
  sessions INTEGER NOT NULL CHECK(sessions>=0),
  unique_visitors INTEGER NOT NULL CHECK(unique_visitors>=0),
  imported_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
