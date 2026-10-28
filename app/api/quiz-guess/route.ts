import { NextRequest, NextResponse } from "next/server";
import { getQuizPackSongs } from "@/lib/quiz/catalog";
import { validateGuess } from "@/lib/validateGuess";
import { hasPreviewAccess } from "@/lib/previewAuth";

export async function POST(req: NextRequest) {
  const authed = await hasPreviewAccess();
  if (!authed) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

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

  const song = getQuizPackSongs(slug).find((s) => s.id === songId);
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

export async function GET() {
  return NextResponse.json({ error: "Not allowed" }, { status: 405 });
}
