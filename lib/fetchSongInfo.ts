export interface SongInfo {
  trackName: string;
  artistName: string;
  collectionName: string;
  artworkUrl: string;
  genre: string;
  releaseYear: string;
  trackViewUrl: string;
}

export async function fetchSongInfo(
  title: string,
  artist: string
): Promise<SongInfo | null> {
  try {
    const params = new URLSearchParams({ title, artist });
    const res = await fetch(`/api/song-info?${params}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
