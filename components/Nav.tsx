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
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[color:var(--color-border)] bg-[color:var(--color-navy)]">
        <div className="flex items-center justify-between px-6 py-2">
          <Link href="/" className="hover:opacity-80 transition-opacity" onClick={() => setMenuOpen(false)}>
            <Image src="/logo.png" alt="TitleTwist" width={90} height={45} className="object-contain" />
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/genres" className="text-sm font-medium text-[color:var(--color-muted)] hover:text-white transition-colors">Genres</Link>
            <button onClick={() => setShowModal(true)} className="text-sm font-medium text-[color:var(--color-muted)] hover:text-white transition-colors">How to Play</button>
            <Link href="/" className="text-sm font-bold px-4 py-2 rounded-full bg-[color:var(--color-green)] text-[color:var(--color-navy)] hover:opacity-90 transition-opacity">Play Now!</Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden flex flex-col justify-center gap-1.5 p-2"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            <span className={`block h-0.5 w-6 bg-white transition-transform duration-200 ${menuOpen ? "translate-y-2 rotate-45" : ""}`} />
            <span className={`block h-0.5 w-6 bg-white transition-opacity duration-200 ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block h-0.5 w-6 bg-white transition-transform duration-200 ${menuOpen ? "-translate-y-2 -rotate-45" : ""}`} />
          </button>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="md:hidden flex flex-col px-6 pb-5 gap-4 border-t border-[color:var(--color-border)]">
            <Link href="/genres" onClick={() => setMenuOpen(false)} className="text-sm font-medium text-[color:var(--color-muted)] hover:text-white transition-colors">Genres</Link>
            <button onClick={() => { setShowModal(true); setMenuOpen(false); }} className="text-sm font-medium text-[color:var(--color-muted)] hover:text-white transition-colors text-left">How to Play</button>
            <Link href="/" onClick={() => setMenuOpen(false)} className="text-sm font-bold px-4 py-2 rounded-full bg-[color:var(--color-green)] text-[color:var(--color-navy)] hover:opacity-90 transition-opacity text-center">Play Now!</Link>
          </div>
        )}
      </nav>

      {showModal && <HowToPlayModal onClose={() => setShowModal(false)} />}
    </>
  );
}
