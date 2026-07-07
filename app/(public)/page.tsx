"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

function localDateString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    router.replace(`/play/${localDateString()}`);
  }, [router]);
  return (
    <main className="flex items-center justify-center min-h-[100svh]">
      <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
    </main>
  );
}
