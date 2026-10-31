# EduTest AI

Responsive Next.js 16 App Router foundation for an online exam-preparation platform. The project includes a public marketing site, Google OAuth entry point, learner dashboard and learning profile, question-bank test builder and timed attempt UI, server-authorized admin areas, private PDF upload and processing, and Supabase schema/RLS/RPCs.

## Run locally

1. Install Node.js 20.9 or newer.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` and fill in the Supabase project URL and anon key.
4. Apply `supabase/migrations/0001_initial_schema.sql` to the Supabase project.
5. In Supabase Auth, enable Google and configure the OAuth callback as `<your-site-url>/auth/callback`; add both local and deployed URLs to the allowed redirect URLs.
6. Run `npm run dev`. Use `npm run typecheck`, `npm run lint`, and `npm run build` before deployment.

Do not put the Supabase service-role key in browser code. Included database and Storage operations use the authenticated user's session; the service role is not required by these flows.

## Supabase setup

- Enable Google as the only sign-in provider in Authentication.
- Apply the SQL migration. It creates profiles and student roles on first sign-in.
- Bootstrap the first `super_admin` from the Supabase SQL editor using a verified auth user UUID:

  ```sql
  insert into public.user_roles (user_id, role)
  values ('<verified-auth-user-uuid>', 'super_admin');
  ```

- Storage buckets are created private by the migration. Admin uploads are restricted by database role policies.
- Keep backups and point-in-time recovery enabled. Review role assignments and test RLS whenever policies change.

## PDF extraction and OCR

PDF uploads are private, size/type checked in the UI and server, and create resumable processing-job records. Text-based PDFs are extracted in bounded batches by the Next.js server route. The migration tracks page progress and failures, and extracted questions retain their source page and require administrator review before use.

Text extraction processes 12 pages per Vercel function request (up to 500 pages per source); the page cursor and extracted items are persisted for retry. Scanned pages are marked `needs_ocr` unless an OCR worker is configured. Set `PDF_OCR_WORKER_URL` and `PDF_OCR_WORKER_SECRET` for a trusted HTTPS worker. The app sends a POST request containing a five-minute signed source URL and requested page numbers, authenticated with the configured bearer token. The worker should return `{ "pages": [{ "page": 1, "text": "...", "confidence": 0.94 }] }`. The signed URL is private and short-lived. The worker must limit page and memory use, validate requests, and never infer missing answers. Large OCR documents should not be processed in a Vercel request.

## Deployment

Deploy to Vercel with the Next.js preset. Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_SITE_URL` to Vercel environment variables. Configure matching Supabase OAuth callback/redirect URLs, apply migrations, then bootstrap the initial super-admin. Never expose a service-role or OCR-worker secret as a `NEXT_PUBLIC_*` variable.

## Current boundaries

- Google OAuth requires provider setup and valid environment variables.
- The database migration contains server-side attempt creation, autosave, scoring, answer-key isolation, role-gated review, private storage policies, and atomic per-user API rate limits. These require application to the target Supabase project.
- Text PDF extraction, resumable processing, question review and result analytics are implemented. Scanned PDF OCR requires the separately deployed worker and is not silently treated as successful.
- Legal pages are starter copy. Replace them with reviewed, jurisdiction-appropriate policies before public launch.
- Account deletion and test scheduling are not implemented yet; no synthetic learner data is shown.
