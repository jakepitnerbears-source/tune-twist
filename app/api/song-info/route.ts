import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const title = req.nextUrl.searchParams.get("title") ?? "";
  const artist = req.nextUrl.searchParams.get("artist") ?? "";
  if (!title || !artist) return NextResponse.json(null);

  const query = encodeURIComponent(`${title} ${artist}`);
  const url = `https://itunes.apple.com/search?term=${query}&media=music&entity=song&limit=25`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    if (!data.results || data.results.length === 0) return NextResponse.json(null);

    const titleLower = title.toLowerCase();
    const artistLower = artist.toLowerCase();
    const NON_ORIGINAL = /\b(remix|remixed|re-mix|mixed|mix|live|cover|acoustic|instrumental|karaoke|tribute|mashup|medley|bootleg|dub|edit)\b/i;
    const COMPILATION = /\b(best of|greatest hits|now that's what i call|now that|playlist|the hits|hit collection|number ones|#1s|top hits|essential|ultimate|anthology|years of hits|decades|soundtrack|motion picture|original score|original cast|music from the|inspired by|super deluxe|vault)\b/i;

    const originals = data.results.filter((r: any) => !NON_ORIGINAL.test(r.trackName));
    const candidates = originals.length > 0 ? originals : data.results;
    const nonCompilations = candidates.filter((r: any) => !COMPILATION.test(r.collectionName ?? ""));
    const pool = nonCompilations.length > 0 ? nonCompilations : candidates;

    const primaryArtist = artistLower.replace(/\s*(ft\.|feat\.|featuring|&|\+|with|x\s+).*$/i, "").trim();

    function scoreResult(r: any): number {
      const trackLower: string = r.trackName.toLowerCase();
      const trackArtistLower: string = (r.artistName ?? "").toLowerCase();
      let score = 0;
      if (trackLower === titleLower) score += 100;
      else if (trackLower.startsWith(titleLower)) score += 60;
      else if (trackLower.includes(titleLower)) score += 30;
      if (trackArtistLower.includes(primaryArtist)) score += 80;
      else if (primaryArtist.includes(trackArtistLower) && trackArtistLower.length > 3) score += 60;
      else if (trackArtistLower.includes(artistLower) || artistLower.includes(trackArtistLower)) score += 40;
      return score;
    }

    const match = pool.reduce((best: any, r: any) => scoreResult(r) > scoreResult(best) ? r : best, pool[0]);

    return NextResponse.json({
      trackName: match.trackName,
      artistName: match.artistName,
      collectionName: match.collectionName,
      artworkUrl: (match.artworkUrl100 ?? "").replace("100x100bb", "400x400bb"),
      genre: match.primaryGenreName,
      releaseYear: new Date(match.releaseDate).getFullYear().toString(),
      trackViewUrl: match.trackViewUrl,
      previewUrl: match.previewUrl ?? "",
    });
  } catch {
    return NextResponse.json(null);
  }
}
