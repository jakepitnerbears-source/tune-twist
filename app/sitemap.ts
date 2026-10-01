import { MetadataRoute } from "next";

const BASE = "https://tunetwist.io";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: BASE, changeFrequency: "daily", priority: 1, lastModified: now },
    { url: `${BASE}/play`, changeFrequency: "daily", priority: 1, lastModified: now },
    { url: `${BASE}/daily-music-word-game`, changeFrequency: "monthly", priority: 0.9, lastModified: now },
    { url: `${BASE}/how-to-play`, changeFrequency: "monthly", priority: 0.8, lastModified: now },
    { url: `${BASE}/archive`, changeFrequency: "daily", priority: 0.6, lastModified: now },
    { url: `${BASE}/about`, changeFrequency: "monthly", priority: 0.7, lastModified: now },
    { url: `${BASE}/contact`, changeFrequency: "monthly", priority: 0.5, lastModified: now },
  ];
}
