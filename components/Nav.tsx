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
      {/* Subtle gradient glow behind pill */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-32 pointer-events-none z-40" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.35) 0%, rgba(192,38,211,0.18) 45%, transparent 72%)" }} />

      {/* Mobile: floating pill */}
      <div className="md:hidden fixed top-3 left-1/2 -translate-x-1/2 z-50 w-[80%] max-w-xs">
        <div className="flex items-center justify-between px-4 py-1.5 rounded-full bg-[color:var(--color-card)] border border-[color:var(--color-border)] shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
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

        {menuOpen && (
          <div className="mt-2 flex flex-col rounded-2xl bg-[color:var(--color-card)] border border-[color:var(--color-border)] shadow-xl overflow-hidden">
            <button onClick={() => { setShowModal(true); setMenuOpen(false); }} className="text-sm font-medium text-[color:var(--color-muted)] hover:text-white transition-colors text-left px-5 py-3.5 border-b border-[color:var(--color-border)]">How to Play</button>
            <Link href="/about" onClick={() => setMenuOpen(false)} className="text-sm font-medium text-[color:var(--color-muted)] hover:text-white transition-colors px-5 py-3.5 border-b border-[color:var(--color-border)]">About</Link>
            <Link href="/contact" onClick={() => setMenuOpen(false)} className="text-sm font-medium text-[color:var(--color-muted)] hover:text-white transition-colors px-5 py-3.5">Contact</Link>
          </div>
        )}
      </div>

      {/* Desktop: full-width nav bar */}
      <nav className="hidden md:block fixed top-0 left-0 right-0 z-50 border-b border-[color:var(--color-border)] bg-[color:var(--color-navy)]">
        <div className="flex items-center justify-between px-6 py-2">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <Image src="/logo.png" alt="TuneTwist" width={90} height={45} className="object-contain" />
          </Link>
          <div className="flex items-center gap-6">
            <button onClick={() => setShowModal(true)} className="text-sm font-medium text-[color:var(--color-muted)] hover:text-white transition-colors">How to Play</button>
            <Link href="/about" className="text-sm font-medium text-[color:var(--color-muted)] hover:text-white transition-colors">About</Link>
            <Link href="/contact" className="text-sm font-medium text-[color:var(--color-muted)] hover:text-white transition-colors">Contact</Link>
            <Link href="/" className="text-sm font-bold px-4 py-2 rounded-full text-white hover:opacity-90 transition-opacity" style={{ background: "var(--btn-gradient)" }}>Play Now!</Link>
          </div>
        </div>
      </nav>

      {showModal && <HowToPlayModal onClose={() => setShowModal(false)} />}
    </>
  );
}
