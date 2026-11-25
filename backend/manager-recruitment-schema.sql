ALTER TABLE hr_direct_messages DROP CONSTRAINT IF EXISTS hr_direct_messages_sender_role_check;
ALTER TABLE hr_direct_messages ADD CONSTRAINT hr_direct_messages_sender_role_check CHECK(sender_role IN ('admin','manager','candidate','recruiter'));
