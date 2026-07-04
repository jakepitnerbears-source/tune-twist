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
    <html lang="en" className={`${spaceGrotesk.className} ${anton.variable} ${poppins.variable} antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('tt_theme');if(t==='brutal'){var r=document.documentElement;r.setAttribute('data-theme','brutal');var v={'--color-navy':'#0a0a0a','--color-card':'#141414','--color-border':'#f5d000','--color-green':'#f5d000','--color-coral':'#ff1493','--color-red':'#ff3300','--color-purple':'#ff1493','--color-muted':'rgba(255,255,255,0.55)','--gradient-a':'rgba(245,208,0,0.7)','--gradient-b':'rgba(255,20,147,0.7)','--btn-gradient':'linear-gradient(135deg,#f5d000 0%,#ff1493 100%)','--blob-a-hi':'#f5d000cc','--blob-a-lo':'#f5d00033','--blob-b-hi':'#ff1493bb','--blob-b-lo':'#ff149333','--blob-c-hi':'#ff330099','--blob-c-lo':'#ff330022'};for(var k in v)r.style.setProperty(k,v[k]);}}catch(e){}` }} />
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-G51X30L960" strategy="afterInteractive" />
        <Script id="ga-init" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          window.gtag = function(){window.dataLayer.push(arguments);}
          window.gtag('js', new Date());
          window.gtag('config', 'G-G51X30L960');
        `}</Script>
      </head>
      <body className="h-full flex flex-col bg-navy text-white">
        {children}
      </body>
    </html>
  );
}
