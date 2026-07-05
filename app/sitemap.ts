import { MetadataRoute } from "next";

const BASE = "https://tunetwist.io";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/how-to-play`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/archive`, changeFrequency: "daily", priority: 0.6 },
    { url: `${BASE}/about`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/contact`, changeFrequency: "monthly", priority: 0.5 },
  ];
}
