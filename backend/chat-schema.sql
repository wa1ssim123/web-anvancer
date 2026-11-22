-- HORENOVA recruitment: admin-supervised one-to-one threads; introduction chats use existing hr_applications/hr_messages.
CREATE TABLE IF NOT EXISTS hr_direct_threads (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 application_id uuid REFERENCES hr_applications(id),
 recruiter_request_id uuid REFERENCES hr_recruiter_requests(id),
 recipient_wix_id text NOT NULL,
 recipient_role text NOT NULL CHECK (recipient_role IN ('candidate','recruiter')),
 created_by_admin text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 last_message_at timestamptz NOT NULL DEFAULT now(),
 CHECK ((application_id IS NOT NULL) <> (recruiter_request_id IS NOT NULL)),
 CHECK ((application_id IS NOT NULL AND recipient_role='candidate') OR (recruiter_request_id IS NOT NULL AND recipient_role='recruiter'))
);
CREATE UNIQUE INDEX IF NOT EXISTS hr_direct_threads_application_unique ON hr_direct_threads(application_id) WHERE application_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS hr_direct_threads_request_unique ON hr_direct_threads(recruiter_request_id) WHERE recruiter_request_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS hr_direct_threads_recipient_idx ON hr_direct_threads(recipient_wix_id,last_message_at DESC);
CREATE TABLE IF NOT EXISTS hr_direct_messages (
 id bigserial PRIMARY KEY,
 thread_id uuid NOT NULL REFERENCES hr_direct_threads(id) ON DELETE CASCADE,
 sender_wix_id text NOT NULL,
 sender_role text NOT NULL CHECK (sender_role IN ('admin','candidate','recruiter')),
 body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS hr_direct_messages_thread_idx ON hr_direct_messages(thread_id,id DESC);