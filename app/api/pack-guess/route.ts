import { NextRequest, NextResponse } from "next/server";
import { getPack, getPackSongs } from "@/lib/packs";
import { validateGuess } from "@/lib/validateGuess";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { slug, songId, action, guess, hintIndex } = body as {
    slug?: string;
    songId?: string;
    action?: "check" | "hint" | "reveal";
    guess?: string;
    hintIndex?: number;
  };

  if (!slug || !songId || !action) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const pack = getPack(slug);
  if (!pack) {
    return NextResponse.json({ error: "Unknown pack" }, { status: 404 });
  }

  const song = getPackSongs(pack).find((s) => s.id === songId);
  if (!song) {
    return NextResponse.json({ error: "Unknown song" }, { status: 404 });
  }

  if (action === "hint") {
    const hint = song.hints?.[hintIndex === 1 ? 1 : 0];
    return NextResponse.json({ hint: hint ?? null });
  }

  if (action === "reveal") {
    return NextResponse.json({ title: song.title, artist: song.artist, releaseYear: song.releaseYear });
  }

  if (action === "check") {
    const correct = validateGuess(guess ?? "", song.title, song.altTitles);
    if (correct) {
      return NextResponse.json({ correct: true, title: song.title, artist: song.artist, releaseYear: song.releaseYear });
    }
    return NextResponse.json({ correct: false });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
