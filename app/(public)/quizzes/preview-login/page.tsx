import { previewLogin } from "@/app/actions/preview-auth";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function PreviewLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;

  return (
    <main className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <form
        action={previewLogin}
        className="w-full max-w-sm flex flex-col gap-4 bg-[color:var(--color-card)] border border-[color:var(--color-border)] rounded-2xl p-6"
      >
        <p className="text-sm font-semibold uppercase tracking-widest text-[color:var(--color-muted)]">
          Private Preview
        </p>
        <p className="text-sm text-[color:var(--color-muted)]">
          This area isn&apos;t public yet. Enter the preview password to continue.
        </p>
        {error && <p className="text-sm text-[color:var(--color-red)]">Wrong password.</p>}
        <input type="hidden" name="next" value={next ?? "/quizzes"} />
        <input
          type="password"
          name="password"
          placeholder="Preview password"
          autoFocus
          className="w-full px-4 py-3 rounded-xl bg-[color:var(--color-navy)] border border-[color:var(--color-border)] text-white placeholder:text-[color:var(--color-muted)] focus:outline-none focus:border-[color:var(--color-purple)]"
        />
        <button
          type="submit"
          className="w-full py-3 rounded-xl text-sm font-bold text-center hover:opacity-90 transition-opacity"
          style={{ background: "var(--btn-gradient)", color: "white" }}
        >
          Enter
        </button>
      </form>
    </main>
  );
}
