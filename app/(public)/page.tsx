import type { Metadata } from "next";
import HomeClient from "./HomeClient";

export const metadata: Metadata = {
  title: "TuneTwist — Daily Music Wordle: Decode 5 Twisted Song Titles",
  description:
    "TuneTwist is a free daily music wordle. Every day, 5 song titles get rewritten with synonyms — it's your job to decode them back to the real title. New puzzle every day, no signup required.",
  alternates: {
    canonical: "/",
  },
};

export default function Home() {
  return <HomeClient />;
}
