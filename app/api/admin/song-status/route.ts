import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import fs from "fs";
import path from "path";

function isAuthorized(): boolean {
  const jar = cookies();
  const session = (jar as unknown as { get: (k: string) => { value: string } | undefined }).get("admin_session")?.value;
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || !session) return false;
  return session === Buffer.from(secret).toString("base64");
}

export async function PATCH(req: NextRequest) {
  if (!isAuthorized()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, status } = await req.json() as { id: string; status: string | null };

  const songsPath = path.join(process.cwd(), "data", "songs.json");
  const raw = fs.readFileSync(songsPath, "utf-8");
  const songs = JSON.parse(raw) as Record<string, unknown>[];

  const idx = songs.findIndex((s) => s.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: "Song not found" }, { status: 404 });
  }

  if (status === null) {
    delete songs[idx].status;
  } else {
    songs[idx].status = status;
  }

  fs.writeFileSync(songsPath, JSON.stringify(songs, null, 2));
  return NextResponse.json({ ok: true });
}
