import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Anton, Poppins } from "next/font/google";
import Script from "next/script";
import "./globals.css";

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
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-V5D7Y5EPEP" strategy="afterInteractive" />
        <Script id="ga-init" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-V5D7Y5EPEP');
        `}</Script>
      </head>
      <body className="h-full flex flex-col bg-navy text-white">
        {children}
      </body>
    </html>
  );
}
