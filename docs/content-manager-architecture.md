# TuneTwist Content Manager & Quiz Library — storage architecture

Written for Issue #4 (2026-10-08). Decides how content is stored, drafted, published, and
rolled back, before building the editor UI on top of it.

## Constraint

Vercel's filesystem is read-only/ephemeral at runtime — a server action that calls
`fs.writeFile` on a live deployment does not persist across requests or deploys. This
project has no database today. Standing one up (connection pooling, migrations, backups,
a new credential to manage) is disproportionate for what is, at this stage, a low-write,
single-operator content tool editing a few hundred JSON records.

## Decision: GitHub Contents API as the datastore

Content stays exactly where it already lives — JSON files in this repo
(`data/songs.json`, `data/quizzes/catalog.json`, `data/quizzes/packs.json`) — and the
Content Manager writes to them by committing through the **GitHub Contents API**
(`PUT /repos/:owner/:repo/contents/:path`), not the local filesystem.

Why this over a database:
- **Durability for free.** A git commit is already a durable, replicated write. No new
  infrastructure, no new failure mode to operate.
- **Version history and rollback for free.** `git log <path>` is the audit trail already.
  Rollback is "fetch the file at the previous commit, PUT it again as a new commit" — no
  custom versioning table to design or get wrong.
- **Review surface already exists.** Changes to committed content show up as real git
  commits/diffs, which is more inspectable than opaque DB rows, and composes naturally
  with the branch/PR-based review process this whole project already runs on.
- **Matches the data's actual size and write pattern.** A few hundred records, edited by
  one person, a handful of times a day at most. This is well inside what file-based
  storage handles fine; a database would mostly add ceremony here.

Tradeoff, stated plainly: this does not scale to concurrent multi-editor writes (a second
editor's commit could race the first) and every write is a real commit to the repo's
history, which is noisier than a DB row update. Both are acceptable for a single-operator
internal tool; if multiple people need to edit concurrently later, that's the point to
revisit this decision, not before.

## Auth / credentials

- New server-only env var: `CONTENT_GITHUB_TOKEN` — a GitHub fine-grained PAT scoped to
  **this repo only**, with **Contents: read and write** permission and nothing else (no
  org access, no other repos, no admin scopes).
- Used exclusively inside Server Actions / Route Handlers (`app/admin/content-manager/**`,
  `app/api/content/**`). Never sent to the client, never referenced in any client
  component or `NEXT_PUBLIC_*` variable.
- Separate from the git credential used for `git push` in this session (that's a
  developer's personal credential; this is a scoped bot token for the running
  application) and separate from `ADMIN_PASSWORD`/`ADMIN_SESSION_SECRET` (those gate who
  can reach the UI; this token is what the server uses once someone's in).
- **Not yet configured.** This is the one external dependency called out in the issue's
  "document what's needed" instruction — a fine-grained PAT needs to be generated in
  GitHub settings and added to Vercel's environment variables (preview scope only, to
  start) before the Content Manager's publish/rollback actions can actually write. Until
  then, the UI's draft/edit views work against the existing committed JSON directly; only
  the "commit this change" step is blocked on the token.

## Draft vs. published

Every catalog record (daily and quiz) carries a `reviewStatus: "draft" | "published"`
field.

- `"draft"` — saved, versioned (it's in a commit), but invisible to anything player-facing.
  The daily game's scheduler and every quiz page filter to `reviewStatus === "published"`
  only.
- `"published"` — live-eligible. For quiz songs, this means it can appear in a quiz's
  active pool. For daily songs, "published" is actually the default/existing state for
  all 600 current rows (they're already playable) — the new thing a draft status adds is
  the ability to stage a *change* to one of those rows (e.g. a fixed `synonymTitle`)
  without it taking effect until explicitly approved, even though the row itself was
  already published.

To support "edit a published row without instantly changing what players see," edits to
an already-published record are staged as a **pending patch** alongside the record
(`data/content-drafts.json`, keyed by record id — `{ id, field, draftValue, editedAt }`),
not written into the live file directly. The Content Manager UI overlays pending patches
on top of the published data so an editor previews the effective result. "Publish" copies
the patch into the real record and commits that file; "discard" deletes the patch entry.
This keeps the live JSON files simple (no stray draft-only rows mixed into data the game
reads) while still giving edits a safe staging area.

## Preventing accidental edits to live/already-played daily puzzles

`data/schedule.json` is a plain array of day-indexed song-id lists; `EPOCH_MS`-based
`dayIndexToDateString` (already duplicated across `app/admin/page.tsx`,
`app/admin/schedule/page.tsx`, `app/admin/song-library/page.tsx`, `app/admin/preview/page.tsx`)
turns a day index into a calendar date. The Content Manager reuses that exact function
(moved into one shared helper, `lib/scheduleDate.ts`, rather than a 5th copy) to classify
any daily song as:
- **past** — its scheduled date is before today. Editing warns "this puzzle has already
  been played; changing the answer won't un-publish wrong guesses players already made."
- **today** — it's the live puzzle right now. Editing requires an extra confirmation step
  naming the exact live date.
- **upcoming** — scheduled but not yet live. Editable normally.
- **unscheduled** — in the song pool but not currently assigned a date. Freely editable.

This status is informational and a confirmation gate, not a hard block — the issue asks
for "clear warnings and deliberate confirmation," not prevention.

## What this doc intentionally does not cover

- Multi-editor conflict resolution (out of scope at current usage scale, see tradeoff
  above).
- A generalized CMS/content-type system — this is specifically two catalogs (daily songs,
  quiz songs) with a shared record shape, not a generic framework.
- Production publishing workflow (committing to `main`, triggering a real deploy) — all
  commits described here target the feature branch this work ships on, per Issue #4's
  explicit no-production-merge gate. Wiring "publish" to actually reach production is a
  separate, later decision.
