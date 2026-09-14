# Archived application flows

Code for application cycles that have closed. **Nothing in here is routable** — it sits
outside `src/app`, so Next.js never turns any of it into a page or an API route. It is kept
only so a future cycle can be restored rather than rewritten.

Files here are still type-checked and linted, so they stay valid as the rest of the codebase
moves. Their imports use the `@/` alias rather than relative paths so they resolve from this
location and would keep resolving if moved back.

## `2026-2027/`

Archived on September 14, 2026, after the student deadline passed on September 13.

| Archived file | Was served at |
| --- | --- |
| `apply/page.tsx` | `/apply` (student fellow form) |
| `apply/success/page.tsx` | `/apply/success` |
| `apply-startups/page.tsx` | `/apply-startups` (startup form) |
| `apply-startups/success/page.tsx` | `/apply-startups/success` |
| `api/apply-student/submit/route.ts` | `POST /api/apply-student/submit` |
| `api/apply-student/upload-resume/route.ts` | `POST /api/apply-student/upload-resume` |
| `api/apply-student/upload-project/route.ts` | `POST /api/apply-student/upload-project` |
| `api/apply-student/upload-solution/route.ts` | `POST /api/apply-student/upload-solution` |
| `api/apply-startup/submit/route.ts` | `POST /api/apply-startup/submit` |
| `api/apply-startup/upload-url/route.ts` | `POST /api/apply-startup/upload-url` |

`/apply` and `/apply-startups` now serve "applications are closed" pages instead. Every link
across the site (nav, hero, footer) still points at those two URLs, so bookmarks and search
results land on a clear message rather than a 404. Those pages deliberately offer no sign-up
or interest-list call to action, only a contact address.

The API routes are gone entirely, so a direct `POST` to any of the paths above now 404s and
cannot write to Supabase.

### Still live

- `/interest-form` and `POST /api/submit-interest` — still routable and still linked from the
  footer. Not touched by this archiving pass; remove separately if it should also come down.
- `/students` — separate announcement page, also showing a closed state.
- The Supabase tables (`student_applications`, `startup_applications`), the storage buckets,
  and `src/lib/supabaseAdmin.ts` are untouched. Submitted data is unaffected.

## Restoring for a new cycle

1. `git mv` the four page files back under `src/app/`, replacing the closed-state pages.
2. `git mv` the `api/apply-student` and `api/apply-startup` folders back to `src/app/api/`.
3. Update the copy, questions, and deadlines for the new cycle — in particular the
   `SECTIONS`/`Field` config in each form page, and the timeline dates in
   `src/app/components/sections/Timeline.tsx`.
4. For the startup form, re-check the hardcoded `entry.<id>` Google Forms map in
   `submitFormToGoogle`; a new Google Form means new entry IDs.

Relative imports were rewritten to the `@/` alias during archiving, so they work either way
and need no changes on restore.
