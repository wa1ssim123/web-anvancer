-- Preserve historical candidate and HORENOVA exchanges before introductions.
ALTER TABLE hr_direct_messages ADD COLUMN IF NOT EXISTS legacy_message_id bigint;
CREATE UNIQUE INDEX IF NOT EXISTS hr_direct_messages_legacy_unique ON hr_direct_messages(legacy_message_id) WHERE legacy_message_id IS NOT NULL;
INSERT INTO hr_direct_threads(application_id,recipient_wix_id,recipient_role,created_by_admin)
SELECT a.id,a.candidate_wix_id,'candidate',
COALESCE(MAX(m.sender_wix_id) FILTER (WHERE m.sender_role='admin'),'historical-system')
FROM hr_applications a
JOIN hr_messages m ON m.application_id=a.id
WHERE a.recruiter_wix_id IS NULL AND m.sender_role IN ('candidate','admin')
GROUP BY a.id,a.candidate_wix_id
ON CONFLICT (application_id) WHERE application_id IS NOT NULL DO NOTHING;
INSERT INTO hr_direct_messages(thread_id,sender_wix_id,sender_role,body,created_at,legacy_message_id)
SELECT d.id,m.sender_wix_id,m.sender_role,m.body,m.created_at,m.id
FROM hr_messages m JOIN hr_applications a ON a.id=m.application_id
JOIN hr_direct_threads d ON d.application_id=a.id
WHERE a.recruiter_wix_id IS NULL AND m.sender_role IN ('candidate','admin')
ON CONFLICT (legacy_message_id) WHERE legacy_message_id IS NOT NULL DO NOTHING;