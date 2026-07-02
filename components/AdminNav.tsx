"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/songs", label: "Songs" },
  { href: "/admin/schedule", label: "Schedule" },
  { href: "/admin/library", label: "Library" },
  { href: "/admin/preview", label: "Preview" },
  { href: "/admin/play", label: "Overview" },
  { href: "/admin/jukebox", label: "Jukebox" },
  { href: "/admin/media", label: "Media" },
  { href: "/admin/test", label: "Test" },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 overflow-x-auto scrollbar-none px-6 py-2 border-t border-[color:var(--color-border)]">
      {NAV_LINKS.map(({ href, label }) => {
        const isActive = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
              isActive
                ? "bg-[color:var(--color-purple)]/20 text-[color:var(--color-purple)]"
                : "text-[color:var(--color-muted)] hover:text-white"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
