import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Anton, Poppins } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-bbh",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "TuneTwist",
  description: "Twist the song. One synonym at a time.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  interactiveWidget: "resizes-visual",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${spaceGrotesk.className} ${anton.variable} ${poppins.variable} antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          window.__hydrationErrors = [];
          window.onerror = function(msg, src, line, col, err) {
            var e = {msg: msg, src: src, line: line, col: col, stack: err && err.stack};
            window.__hydrationErrors.push(e);
            console.error('[HYDRATION-ERROR]', JSON.stringify(e));
          };
          window.onunhandledrejection = function(ev) {
            var e = {msg: String(ev.reason), stack: ev.reason && ev.reason.stack};
            window.__hydrationErrors.push(e);
            console.error('[HYDRATION-REJECTION]', JSON.stringify(e));
          };
          console.log('[DIAG] early script ran, UA=' + navigator.userAgent);
        `}} />
      </head>
      <body className="h-full flex flex-col bg-navy text-white">
        <Nav />
        <div className="flex-1 overflow-y-auto pt-24 pb-16">{children}</div>
        <footer className="fixed bottom-0 left-0 right-0 z-50 border-t border-[color:var(--color-border)] bg-[color:var(--color-navy)] py-2 px-6 text-center">
          <p className="text-xs text-[color:var(--color-muted)] truncate">
            © TuneTwist — Conceptualized &amp; owned by Jeremy Grantham. All rights reserved.
          </p>
        </footer>
      </body>
    </html>
  );
}
