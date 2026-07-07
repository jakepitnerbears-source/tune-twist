export interface SongInfo {
  trackName: string;
  artistName: string;
  collectionName: string;
  artworkUrl: string;
  genre: string;
  releaseYear: string;
  trackViewUrl: string;
  previewUrl: string;
}

export async function fetchSongInfo(
  title: string,
  artist: string,
  year?: string
): Promise<SongInfo | null> {
  try {
    const params = new URLSearchParams({ title, artist, ...(year ? { year } : {}) });
    const res = await fetch(`/api/song-info?${params}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
