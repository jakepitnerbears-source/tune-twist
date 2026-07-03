"use client";

import { useState } from "react";

export default function ContactPage() {
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    const data = new FormData(e.currentTarget);
    try {
      const res = await fetch("https://formspree.io/f/xeebvglo", {
        method: "POST",
        headers: { Accept: "application/json" },
        body: data,
      });
      if (!res.ok) console.error("Formspree error", res.status, await res.text());
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <main className="flex flex-col items-center px-4 py-12">
        <div className="w-full max-w-[560px] flex flex-col gap-6 text-center">
          <h1 className="text-4xl font-bold tracking-tight">Thanks!</h1>
          <p className="text-[color:var(--color-muted)]">Your message was sent. I'll get back to you soon.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-[560px] flex flex-col gap-8">

        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold tracking-tight">Contact</h1>
          <p className="text-[color:var(--color-muted)]">Got feedback, a bug report, or just want to say hi? Send me a note.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-[color:var(--color-muted)]">Your email</label>
            <input
              id="email"
              type="email"
              name="email"
              required
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-xl bg-[color:var(--color-card)] border border-[color:var(--color-border)] text-white placeholder:text-[color:var(--color-muted)] focus:outline-none focus:border-[color:var(--color-purple)] transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="message" className="text-sm font-medium text-[color:var(--color-muted)]">Message</label>
            <textarea
              id="message"
              name="message"
              required
              rows={5}
              placeholder="What's on your mind?"
              className="w-full px-4 py-3 rounded-xl bg-[color:var(--color-card)] border border-[color:var(--color-border)] text-white placeholder:text-[color:var(--color-muted)] focus:outline-none focus:border-[color:var(--color-purple)] transition-colors resize-none"
            />
          </div>

          {status === "error" && (
            <p className="text-sm text-[color:var(--color-red)]">Something went wrong. Please try again.</p>
          )}

          <button
            type="submit"
            disabled={status === "submitting"}
            className="w-full py-3.5 rounded-xl bg-[color:var(--color-green)] text-[color:var(--color-navy)] text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {status === "submitting" ? "Sending…" : "Send Message"}
          </button>

        </form>
      </div>
    </main>
  );
}
