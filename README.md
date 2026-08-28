# Car Damage Assessment — Next.js + Inngest + Supabase

Matches the scoped PRD. Upload photos, VIN entry, AI vehicle ID + damage
detection via Gemini, rule-based repair cost range, OEM status (pending
until a real parts catalog is connected). No marketplace, no accounts.

Built this way specifically for Vercel Hobby: the upload request returns
immediately (`status: PROCESSING`), the actual Gemini calls run inside an
Inngest background function so nothing is bound by Vercel's request timeout,
and the frontend polls `/api/analysis/[id]` until it flips to `COMPLETED`.
Same pattern the carfix.am reference site itself uses.

## Setup

1. **Supabase**
   - Create a project.
   - Run `supabase/schema.sql` in the SQL editor.
   - Storage → create a bucket named `car-photos`, set public.
   - Copy the project URL and the `service_role` key into `.env`.

2. **Gemini**
   - Get an API key from Google AI Studio.
   - Add it as `GEMINI_API_KEY`.

3. **Inngest**
   - Create an Inngest account, add the Vercel integration from the Vercel
     marketplace (this auto-sets `INNGEST_EVENT_KEY` / `INNGEST_SIGNING_KEY`
     on deploy — no manual key copying needed).
   - Locally, run `npx inngest-cli dev` alongside `npm run dev` to test the
     background function on your machine before deploying.

4. **Local run**
   ```
   cp .env.example .env   # fill in the values above
   npm install
   npm run dev
   ```
   Visit `http://localhost:3000`. Run `npx inngest-cli dev` in a second
   terminal so the background function actually executes locally.

5. **Deploy**
   - Push to a GitHub repo, import into Vercel, add the same env vars in
     Vercel's project settings, deploy.
   - Confirm the Inngest Vercel integration picked up the `analyze-car-damage`
     function (visible in the Inngest dashboard after first deploy).

## Notes

- **Not tested end-to-end yet.** Written in a sandboxed environment with no
  network access to Google/Supabase/Inngest, so this is unverified against
  live keys. Test locally with real keys and a few sample damage photos
  before showing the client.
- `oem_status` always returns `PENDING` (see `src/inngest/functions.ts`).
  Wire up a real parts catalog when/if that becomes a paid follow-on phase.
- Cost estimation is a simple rule table in `src/lib/gemini.ts`
  (`PART_BASE_COST` × `SEVERITY_MULTIPLIER`), tune once you see real output.
- If `gemini-2.5-flash` is retired by the time you deploy, swap the model
  name via the `GEMINI_MODEL` env var.
