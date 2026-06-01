import { login } from "@/app/actions/admin-auth";

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams: { error?: string; from?: string };
}) {
  const hasError = searchParams.error === "1";

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-[color:var(--color-navy)]">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Admin Portal</h1>
          <p className="text-sm text-[color:var(--color-muted)] mt-1">TuneTwist · Internal</p>
        </div>

        <form
          action={login}
          className="flex flex-col gap-4 bg-[color:var(--color-card)] border border-[color:var(--color-border)] rounded-2xl p-6"
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="rounded-lg px-4 py-2.5 bg-[color:var(--color-navy)] border border-[color:var(--color-border)] text-sm focus:outline-none focus:border-[color:var(--color-purple)] transition-colors"
              placeholder="Enter admin password"
            />
          </div>

          {hasError && (
            <p className="text-sm text-[color:var(--color-red)] text-center">
              Incorrect password.
            </p>
          )}

          <button
            type="submit"
            className="w-full py-2.5 rounded-lg bg-[color:var(--color-purple)] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Sign in
          </button>
        </form>
      </div>
    </main>
  );
}
