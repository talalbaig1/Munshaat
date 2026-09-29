# Munshaat Security Baseline

## Secrets

- No Supabase secret/service-role key belongs in GitHub or browser code.
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are the only Supabase values used by the browser. The publishable key is intentionally public and is safe only when RLS is correctly enforced.
- `OPENROUTER_API_KEY` is stored only in Supabase Edge Function Secrets and is never referenced by Next.js client code.
- `.env`, `.env.*`, local files, and Supabase local env files are ignored by Git.

## Database isolation

All Monshaat application tables have RLS enabled.

User-owned data is scoped by the authenticated user's UUID:
- tasks
- sessions
- recommendations
- task notes
- follow-up questions
- evidence metadata
- evidence reviews
- uploaded consultant emails

Consultants are shared reference data and are read-only from the browser.

Audit logs are not client-readable.

Evidence and consultant-email source files are private Storage buckets and are restricted to paths whose first folder is the authenticated user's UUID.

## Rate limiting

- Login UI: 5 failed attempts trigger a 60-second client lockout.
- Supabase Auth also provides server-side authentication endpoint rate limits.
- Data API writes: 100 requests per 5 minutes per client IP through a PostgREST pre-request check.
- AI document analysis: 10 requests per 5 minutes per authenticated user per Edge Function instance.
- Uploaded source/evidence files are capped at 15 MB.

## Session security

The browser session is signed out after 10 minutes without activity.

Activity is tracked across pointer, keyboard, touch, scroll, and mouse movement events. The last-activity timestamp is also checked after a page reload, so a persisted session that has already been idle for 10 minutes is signed out before the dashboard is opened.

A timed-out session is cleared locally and requires a fresh manual sign-in.

For stronger server-side enforcement, configure Supabase Auth's **Inactivity timeout** to 10 minutes when that setting is available for the project plan. Keep JWT expiry at a sensible value such as the default 1 hour unless there is a specific reason to shorten it.

## Injection and XSS controls

- Database access uses Supabase client methods; the browser does not execute arbitrary SQL.
- RLS is the authorization boundary, not UI filtering.
- AI document content is treated as untrusted data and is explicitly delimited in the analysis prompt.
- Edge Function input is size-limited.
- Production response headers include HSTS, frame denial, MIME sniffing protection, restrictive referrer policy, permissions policy, and a Content Security Policy.
- No `dangerouslySetInnerHTML` is used.

## Manual production checks

1. Supabase Authentication > Password Security: enable leaked-password protection.
2. Supabase Authentication > Rate Limits: keep authentication endpoint rate limiting enabled; tighten it further if desired.
3. Supabase Authentication > Sessions: set Inactivity timeout to 10 minutes if the project plan exposes this control.
4. Vercel: keep only the two `NEXT_PUBLIC_*` Supabase variables in the browser-facing environment. Never add OpenRouter, Supabase secret, service-role, database password, or JWT signing secrets as `NEXT_PUBLIC_*`.
5. Mark server-side Vercel secrets as Sensitive where supported.
6. Keep the GitHub repository free of evidence files, consultant emails, passwords, tokens, and production secrets.
7. If a secret was ever committed to Git history, rotate it even if the file was later deleted.

## Important limitation

This application currently uses Supabase's browser client, which stores the auth session in browser storage. The application does not use traditional session cookies, so the relevant threat is token theft/XSS rather than classic cookie hijacking. A future SSR migration using `@supabase/ssr` can move session handling into cookies and add a server-side authorization layer if a stronger web-session architecture is required.
