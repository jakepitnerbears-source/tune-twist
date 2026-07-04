import { MetadataRoute } from "next";

const BASE = "https://tunetwist.io";

const GENRE_SLUGS = [
  "hip-hop", "rock", "pop", "rb-soul", "electronic",
  "country", "2000s-pop-punk", "2010s-pop", "90s", "2000s", "80s", "oldies",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/play`, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/how-to-play`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/genres`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/archive`, changeFrequency: "daily", priority: 0.6 },
    { url: `${BASE}/about`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/contact`, changeFrequency: "monthly", priority: 0.5 },
    ...GENRE_SLUGS.map((slug) => ({
      url: `${BASE}/genres/${slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
