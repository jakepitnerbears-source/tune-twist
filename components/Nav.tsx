"use client";

import { useState } from "react";
import Link from "next/link";
import HowToPlayModal from "@/components/HowToPlayModal";

export default function Nav() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 border-b border-[color:var(--color-border)] bg-[color:var(--color-navy)]">
        <Link href="/" className="text-lg font-bold tracking-tight hover:opacity-80 transition-opacity">
          TuneTwist
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/archive"
            className="text-sm font-medium text-[color:var(--color-muted)] hover:text-white transition-colors"
          >
            Archive
          </Link>
          <Link
            href="/genres"
            className="text-sm font-medium text-[color:var(--color-muted)] hover:text-white transition-colors"
          >
            Genres
          </Link>
          <button
            onClick={() => setShowModal(true)}
            className="text-sm font-medium text-[color:var(--color-muted)] hover:text-white transition-colors"
          >
            How to Play
          </button>
          <Link
            href="/"
            className="text-sm font-bold px-4 py-2 rounded-full bg-[color:var(--color-green)] text-[color:var(--color-navy)] hover:opacity-90 transition-opacity"
          >
            Play Now!
          </Link>
        </div>
      </nav>

      {showModal && <HowToPlayModal onClose={() => setShowModal(false)} />}
    </>
  );
}
