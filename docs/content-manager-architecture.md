# TuneTwist Content Manager & Quiz Library — storage architecture

Written for Issue #4 (2026-10-08, updated 2026-10-08 after Phase 1 review). Decides how
content is stored, drafted, published, and rolled back. Status: **the design below is now
implemented and tested in code; the one remaining step is generating and configuring
`CONTENT_GITHUB_TOKEN`, which only the repo owner can do** — see "Exact setup steps."

## Constraint

Vercel's filesystem is read-only/ephemeral at runtime — a server action that calls
`fs.writeFile` on a live deployment does not persist across requests or deploys. This
project has no database today. Standing one up (connection pooling, migrations, backups,
a new credential to manage) is disproportionate for what is, at this stage, a low-write,
single-operator content tool editing a few hundred JSON records.

## Decision: GitHub Contents API as the datastore

Content stays exactly where it already lives — JSON files in this repo
(`data/songs.json`, `data/quizzes/catalog.json`) — and the Content Manager writes to them
by committing through the **GitHub Contents API** (`PUT /repos/:owner/:repo/contents/:path`),
not the local filesystem. Implemented in `lib/githubContent.ts`.

Why this over a database:
- **Durability for free.** A git commit is already a durable, replicated write. No new
  infrastructure, no new failure mode to operate.
- **Version history and rollback for free.** `git log <path>` is the audit trail already.
  Rollback is "fetch the file at the previous commit, PUT it again as a new commit" — no
  custom versioning table to design or get wrong. Implemented: `listFileHistory()` /
  `readFileAtCommit()` in `lib/githubContent.ts`, wired to a "View history" / "Roll back to
  this" panel in the Content Manager UI (`components/content-manager/CatalogHistoryPanel.tsx`).
- **Concurrency control for free.** Every write passes the `sha` of the file as it was last
  read. GitHub rejects the write (409) if the file changed in between — i.e. real optimistic
  concurrency control, not something hand-rolled. Implemented: `GithubConflictError` in
  `lib/githubContent.ts`, caught in every write path in `lib/contentDrafts.ts` and surfaced
  as "Someone else edited this since this page loaded — reload and reapply your edit"
  rather than a raw error.
- **Review surface already exists.** Changes to committed content show up as real git
  commits/diffs, composing naturally with the branch/PR-based review process this project
  already runs on.
- **Matches the data's actual size and write pattern.** A few hundred records, edited by
  one person, a handful of times a day at most.

Tradeoff, stated plainly: this does not scale to *simultaneous* multi-editor writes to the
exact same record in the exact same second (the second write gets a conflict error and has
to retry — annoying, not data-destroying). Acceptable for a single-operator internal tool.

## Exact setup steps (the one thing only you can do)

1. **Create a dedicated content branch** — separate from any code feature branch, so content
   commits don't pile up in a PR's history and so this branch keeps working after the code
   PR merges or closes:
   ```
   git fetch origin main
   git branch content/quiz-library-data origin/main
   git push origin content/quiz-library-data
   ```
2. **Generate a fine-grained GitHub PAT**: GitHub → Settings → Developer settings →
   Personal access tokens → Fine-grained tokens → Generate new token.
   - Repository access: **Only select repositories** → `jakepitnerbears-source/tune-twist`.
   - Permissions: **Contents → Read and write**. Nothing else — no Issues, no Pull requests,
     no Administration, no org access.
   - Expiration: your call; a bot token like this is reasonable to set for 90 days and
     rotate, or no-expiry if you'd rather manage rotation manually.
3. **Add two environment variables in Vercel** (Project Settings → Environment Variables),
   scoped to **Preview only** — do not add these to Production until launch is approved:
   - `CONTENT_GITHUB_TOKEN` = the token from step 2.
   - `CONTENT_GITHUB_BRANCH` = `content/quiz-library-data` (the branch from step 1).
4. Redeploy the preview. The Content Manager's amber "not configured" banner disappears
   once both vars are present, and Save Draft / Publish / Rollback start actually
   committing to that branch.

Nothing in the code invents a token, guesses a branch name, or silently falls back to
writing to the local filesystem if these are missing — `getContentsConfig()` returns `null`
and every write action reports exactly that reason instead of pretending to save.

## Draft vs. published

Drafts are **record-level**, not field-level: `data/content-drafts.json` holds
`{ catalog: "daily" | "quiz", id, isNew, draftRecord: {...}, editedAt }` entries
(`lib/contentDrafts.ts`). `draftRecord` is a partial record — whatever fields were edited —
merged onto the existing record (or, for a brand-new quiz song, used as the whole record)
only at publish time. The Content Manager overlays pending drafts on top of published data
so an editor previews the effective result before publishing.

**Validation runs before every publish, not after**, and blocks the commit if it fails
(`lib/quiz/publishValidation.ts`):
- Daily songs: synonym title can't be empty; if hints are edited, both must be non-empty.
- Quiz songs: the *entire resulting catalog* (existing + this edit) is run through the same
  validator used for static-data checks (`lib/quiz/validate.ts`) — duplicate ids, duplicate
  identities, missing fields, etc. all block publish. Daily/quiz overlap is still allowed
  and never blocks, per the product decision in the issue thread.

Quiz songs also support **archive** (`archived: true` on the record) — a soft delete that
removes a song from every pack's active pool while keeping it in the catalog/history,
editable the same way as any other field via the draft/publish flow.

## Preventing accidental edits to live/already-played daily puzzles

`data/schedule.json` is a plain array of day-indexed song-id lists; the day-index-to-date
logic (previously duplicated across 4 admin pages) now lives once in `lib/scheduleDate.ts`
(`classifySchedule()` — pure and unit-tested — wrapped by `getDailyScheduleStatuses()` for
real use). The Content Manager classifies every daily song as:
- **past** — already played. Publishing a change warns "won't un-publish wrong guesses
  players already made."
- **today** — the live puzzle right now. Publishing requires an explicit confirm naming the
  exact risk.
- **upcoming** — scheduled but not live yet. No extra confirmation.
- **unscheduled** — in the pool but not currently assigned a date. No extra confirmation.

This is a confirmation gate, not a hard block, per the issue's "clear warnings and
deliberate confirmation" instruction rather than outright prevention.

## Session tokens

Both `/admin` and the quiz preview gate originally used a static value
(`base64(secret)`) as the session cookie — identical every time, never expires on its own,
and can't be revoked without rotating the password for everyone. Replaced with signed,
expiring tokens (`lib/sessionToken.ts`): HMAC-SHA256 over a JSON payload containing
`iat`/`exp`, verified with a constant-time comparison, independently unit-tested (tamper
detection, expiry, wrong-secret rejection — see `scripts/test-session-token.ts`). Cookie
names and max-ages are unchanged (`admin_session`, 30 days; `quiz_preview_session`, 7 days)
— only the value's shape changed, so this is transparent to anything else in the app, but
**it does mean existing admin/preview sessions will need to log in again** once this ships,
since old-format cookies won't verify against the new scheme.

## What this doc intentionally does not cover

- Multi-editor *simultaneous* conflict resolution beyond "the second write gets a clear
  error and retries" (see concurrency note above) — a real merge UI is out of scope at
  current usage scale.
- A generalized CMS/content-type system — this is specifically two catalogs (daily songs,
  quiz songs) with a shared record shape, not a generic framework.
- Production publishing workflow (committing to `main`, triggering a real deploy) — every
  commit described here targets `content/quiz-library-data` or the code feature branch,
  never `main`, per Issue #4's explicit no-production-merge gate. Wiring "publish" to reach
  production is a separate, later decision requiring explicit approval.
