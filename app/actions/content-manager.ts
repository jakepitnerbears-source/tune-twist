"use server";

import { hasAdminAccess } from "@/lib/adminAuth";
import {
  saveDraft,
  publishDraft,
  discardDraft,
  getCatalogHistory,
  rollbackCatalog,
  Catalog,
  SaveResult,
  HistoryResult,
} from "@/lib/contentDrafts";

// Server Functions post back to the route that renders them (here, /admin/content-manager),
// which proxy.ts's "/admin/:path*" branch already covers — but per the Next.js proxy docs'
// explicit warning that a matcher can silently stop covering a Server Function if it moves
// routes, this check stays here too rather than trusting proxy.ts alone.
async function assertAuthed(): Promise<{ ok: false; reason: string } | null> {
  const authed = await hasAdminAccess();
  if (!authed) return { ok: false, reason: "Not authorized." };
  return null;
}

export async function saveSongDraft(catalog: Catalog, id: string, isNew: boolean, draftRecord: Record<string, unknown>): Promise<SaveResult> {
  const denied = await assertAuthed();
  if (denied) return denied;
  return saveDraft({ catalog, id, isNew, draftRecord });
}

export async function publishSongDraft(catalog: Catalog, id: string): Promise<SaveResult> {
  const denied = await assertAuthed();
  if (denied) return denied;
  return publishDraft(catalog, id);
}

export async function discardSongDraft(catalog: Catalog, id: string): Promise<SaveResult> {
  const denied = await assertAuthed();
  if (denied) return denied;
  return discardDraft(catalog, id);
}

export async function fetchCatalogHistory(catalog: Catalog): Promise<HistoryResult> {
  const denied = await assertAuthed();
  if (denied) return denied;
  return getCatalogHistory(catalog);
}

export async function rollbackCatalogToCommit(catalog: Catalog, commitSha: string): Promise<SaveResult> {
  const denied = await assertAuthed();
  if (denied) return denied;
  return rollbackCatalog(catalog, commitSha);
}
