# HORENOVA — Transactional confirmation emails

## What this release implements

After a successful authenticated **candidate application**, send exactly one confirmation to the candidate's Wix login email.

After a successful authenticated **recruiter job or shift request**, send exactly one role-specific confirmation to the recruiter's Wix login email. A pending request is **not** described as publicly approved.

All three types are translated into **French, English and Arabic** using the language passed by the browser. Messages render as responsive, email-client-compatible HTML and plain text; branded animated GIFs enhance supported clients, with a static first-frame fallback.

The backend uses `hr_email_outbox` in Neon PostgreSQL, retrying transient provider failures, with a unique event key to avoid duplicate mail on repeated clicks.

## Production configuration: Render API service

Configure only in **horenova-hub-api** (NOT the public static website). Use the Render environment-variable editor; never commit tokens to GitHub or expose them in the browser.

- `RESEND_API_KEY` — private API key with permission to send via Resend
- `MAIL_FROM` — verified sender such as `HORENOVA <notifications@horenova.com>` (example only: it must match the domain authorized on your Resend account)
- `MAIL_REPLY_TO` — optional address monitored by the HORENOVA support team

**Prerequisite**: add the domain to your Resend account and complete the provider's DKIM/SPF validation using the **actual DNS records generated for your account**. Never fabricate DNS values or replace existing MX records without checking existing email routing.

After configuration, deploy/restart the API so it sees these variables. Pending outbox rows will then be eligible for delivery. Without both `RESEND_API_KEY` and a syntactically valid `MAIL_FROM`, no mail is sent and queued events remain pending. Do not claim the user received email solely because an application was successfully registered.

## Checks and privacy

- Authenticated GET `/api/admin/email-status` is **admin-only**: it exposes aggregate outbox states and whether email delivery is configured; it does not reveal addresses.
- Logs never print addresses, tokens or personal details.
- Candidate email does not contain recruiter contacts or candidate photo.
- Recruiter email includes the job/shift basics but never promises publication before moderation.
- Duplicate application/request attempts do not enqueue another confirmation.
- Provider idempotency keys are prefixed by the committed event ID.
- Tests: `node qa/transactional-email.cjs` and both GitHub QA workflows.
- Real inbox delivery still requires one legitimate end-to-end test on a candidate account and a recruiter account after sender verification.

**Important:** this API and the Wix/Render website are separate services. Publishing HTML to Wix does not by itself enable transactional mail; the Render API service must run the updated backend and have a verified provider configured.
