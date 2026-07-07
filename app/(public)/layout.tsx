import type { Metadata } from "next";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "TuneTwist — Daily Music Word Game",
  description: "Every day, 5 song titles get rewritten with synonyms. Can you decode them all? Free daily music puzzle.",
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <div className="flex-1 overflow-y-auto pt-0 pb-16">{children}</div>
    </>
  );
}
