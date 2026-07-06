"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import HowToPlayModal from "@/components/HowToPlayModal";

export default function Nav() {
  const [showModal, setShowModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      {/* Gradient glow behind pill — both mobile and desktop */}
      <div className="fixed top-0 left-0 right-0 h-32 pointer-events-none z-40" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.35) 0%, rgba(192,38,211,0.18) 45%, transparent 72%)" }} />

      {/* Mobile: floating pill */}
      <div className="md:hidden fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[80%] max-w-xs">
        <div className="p-[1px] rounded-full shadow-[0_4px_24px_rgba(0,0,0,0.5)]" style={{ background: "linear-gradient(135deg, var(--color-purple) 0%, var(--color-coral) 55%, rgba(124,58,237,0.5) 100%)" }}>
        <div className="flex items-center justify-between px-4 py-1 rounded-full bg-[color:var(--color-card)]">
          <Link href="/" onClick={() => setMenuOpen(false)} className="hover:opacity-80 transition-opacity">
            <Image src="/logo.png" alt="TuneTwist" width={76} height={38} className="object-contain" />
          </Link>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
            className="flex flex-col justify-center gap-1.5 p-2"
          >
            <span className={`block h-0.5 w-5 bg-white transition-transform duration-200 ${menuOpen ? "translate-y-2 rotate-45" : ""}`} />
            <span className={`block h-0.5 w-5 bg-white transition-opacity duration-200 ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block h-0.5 w-5 bg-white transition-transform duration-200 ${menuOpen ? "-translate-y-2 -rotate-45" : ""}`} />
          </button>
        </div>
        </div>

        {menuOpen && (
          <div className="mt-2 flex flex-col rounded-2xl bg-[color:var(--color-card)] border border-[color:var(--color-border)] shadow-xl overflow-hidden">
            <button onClick={() => { setShowModal(true); setMenuOpen(false); }} className="text-sm font-medium text-[color:var(--color-muted)] hover:text-white transition-colors text-left px-5 py-3.5 border-b border-[color:var(--color-border)]">How to Play</button>
            <Link href="/about" onClick={() => setMenuOpen(false)} className="text-sm font-medium text-[color:var(--color-muted)] hover:text-white transition-colors px-5 py-3.5 border-b border-[color:var(--color-border)]">About</Link>
            <Link href="/contact" onClick={() => setMenuOpen(false)} className="text-sm font-medium text-[color:var(--color-muted)] hover:text-white transition-colors px-5 py-3.5">Contact</Link>
          </div>
        )}
      </div>

      {/* Desktop: floating pill */}
      <div className="hidden md:block fixed top-4 left-1/2 -translate-x-1/2 z-50">
        <div className="p-[1px] rounded-full shadow-[0_4px_32px_rgba(0,0,0,0.5)]" style={{ background: "linear-gradient(135deg, var(--color-purple) 0%, var(--color-coral) 55%, rgba(124,58,237,0.5) 100%)" }}>
          <div className="flex items-center gap-8 px-5 py-1.5 rounded-full bg-[color:var(--color-card)]">
            <Link href="/" className="hover:opacity-80 transition-opacity shrink-0">
              <Image src="/logo.png" alt="TuneTwist" width={90} height={45} className="object-contain" />
            </Link>
            <div className="flex items-center gap-6">
              <button onClick={() => setShowModal(true)} className="text-sm font-medium text-[color:var(--color-muted)] hover:text-white transition-colors whitespace-nowrap">How to Play</button>
              <Link href="/about" className="text-sm font-medium text-[color:var(--color-muted)] hover:text-white transition-colors">About</Link>
              <Link href="/contact" className="text-sm font-medium text-[color:var(--color-muted)] hover:text-white transition-colors">Contact</Link>
              <Link href="/" className="text-sm font-bold px-4 py-1.5 rounded-full text-white hover:opacity-90 transition-opacity whitespace-nowrap" style={{ background: "var(--btn-gradient)" }}>Play Now!</Link>
            </div>
          </div>
        </div>
      </div>

      {showModal && <HowToPlayModal onClose={() => setShowModal(false)} />}
    </>
  );
}
