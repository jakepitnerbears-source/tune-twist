"use server";

import { hasAdminAccess } from "@/lib/adminAuth";
import { saveDraft, publishDraft, discardDraft, DraftPatch, SaveResult } from "@/lib/contentDrafts";

// Server Functions post back to the route that renders them (here, /admin/content-manager),
// which proxy.ts's "/admin/:path*" branch already covers — but per the Next.js proxy docs'
// explicit warning that a matcher can silently stop covering a Server Function if it moves
// routes, this check stays here too rather than trusting proxy.ts alone.
async function assertAuthed(): Promise<SaveResult | null> {
  const authed = await hasAdminAccess();
  if (!authed) return { ok: false, reason: "Not authorized." };
  return null;
}

export async function saveSongDraft(
  catalog: DraftPatch["catalog"],
  id: string,
  field: string,
  value: string
): Promise<SaveResult> {
  const denied = await assertAuthed();
  if (denied) return denied;
  return saveDraft({ catalog, id, field, draftValue: value });
}

export async function publishSongDraft(catalog: DraftPatch["catalog"], id: string, field: string): Promise<SaveResult> {
  const denied = await assertAuthed();
  if (denied) return denied;
  return publishDraft(catalog, id, field);
}

export async function discardSongDraft(catalog: DraftPatch["catalog"], id: string, field: string): Promise<SaveResult> {
  const denied = await assertAuthed();
  if (denied) return denied;
  return discardDraft(catalog, id, field);
}
