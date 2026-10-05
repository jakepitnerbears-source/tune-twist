// Shared gameplay-analytics helper. Reuses the existing gtag/GA4 setup in
// app/layout.tsx — no second analytics system, no new measurement ID.
//
// Two independent gates must both pass before anything is sent to GA4:
//   1. Environment gate (this file): only sends on the real production
//      hostname, OR when a developer has explicitly opted into debug mode
//      (via ?ga_debug=1, which also tags every event with debug_mode so it
//      only ever shows up in GA4 DebugView, never in standard reports).
//   2. Context gate (caller-supplied): admin puzzle-preview pages pass
//      isPreview=true into GameV2, which skips calling this module entirely.

const PROD_HOSTNAMES = new Set(["tunetwist.io", "www.tunetwist.io"]);

type GtagFn = (...args: unknown[]) => void;

function getGtag(): GtagFn | null {
  if (typeof window === "undefined") return null;
  const fn = (window as unknown as { gtag?: GtagFn }).gtag;
  return typeof fn === "function" ? fn : null;
}

function isProdHost(): boolean {
  if (typeof window === "undefined") return false;
  return PROD_HOSTNAMES.has(window.location.hostname);
}

// ?ga_debug=1 opts the current tab into GA4 DebugView testing. The flag is
// remembered in sessionStorage (not localStorage) so it can't accidentally
// become a permanent state for a real visitor — it dies with the tab.
function isDebugRequested(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("ga_debug") === "1") {
      sessionStorage.setItem("tt_ga_debug", "1");
      return true;
    }
    return sessionStorage.getItem("tt_ga_debug") === "1";
  } catch {
    return false;
  }
}

function analyticsEnabled(): boolean {
  return isProdHost() || isDebugRequested();
}

export type EventParams = Record<string, string | number | boolean | undefined>;

export function trackEvent(name: string, params: EventParams = {}): void {
  if (typeof window === "undefined") return;
  try {
    const debug = isDebugRequested();
    if (!analyticsEnabled()) {
      // Gated on debug mode, not NODE_ENV — on Vercel, `next build` sets
      // NODE_ENV=production for every deployment (prod AND preview), so an
      // env-based check here would silently never log on the live site,
      // which is exactly when ?ga_debug=1 testing needs this visibility.
      if (debug) console.debug("[analytics:skipped — host/debug gate]", name, params);
      return;
    }
    const gtag = getGtag();
    if (!gtag) {
      if (debug) console.warn("[analytics:no-op — window.gtag is not a function]", name, params);
      return;
    }
    gtag("event", name, debug ? { ...params, debug_mode: true } : params);
    if (debug) console.debug("[analytics:sent]", name, debug ? { ...params, debug_mode: true } : params);
  } catch (err) {
    if (isDebugRequested()) console.warn("[analytics:error]", name, err);
    // Analytics must never break gameplay.
  }
}

// One-time-per-key milestone guard, scoped to this browser tab's session via
// sessionStorage. Survives a page refresh (so a reload mid-game doesn't
// re-fire game_start), but resets on a new tab/session (so a genuine replay
// in a fresh session is free to count again).
export function trackOnce(key: string, name: string, params: EventParams = {}): void {
  if (typeof window === "undefined") return;
  const flagKey = `tt_evt_${key}`;
  try {
    if (sessionStorage.getItem(flagKey)) return;
    sessionStorage.setItem(flagKey, "1");
  } catch {
    // If sessionStorage is unavailable, fall through rather than silently
    // dropping the only chance to record this milestone.
  }
  trackEvent(name, params);
}
