import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "TuneTwist",
  description: "Twist the song. One synonym at a time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${spaceGrotesk.className} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-navy text-white">
        <Nav />
        <div className="pt-16 pb-20">{children}</div>
        <footer className="fixed bottom-0 left-0 right-0 z-50 border-t border-[color:var(--color-border)] bg-[color:var(--color-navy)] py-3 px-6 text-center flex flex-col gap-0.5">
          <p className="text-sm font-semibold text-white">
            Conceptualized &amp; owned by Jeremy Grantham
          </p>
          <p className="text-xs text-[color:var(--color-muted)]">
            All intellectual property rights reserved. TuneTwist is an original concept by Jeremy Grantham.
          </p>
        </footer>
      </body>
    </html>
  );
}
