import { logout } from "@/app/actions/admin-auth";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[color:var(--color-navy)] text-white">
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3 border-b border-[color:var(--color-border)] bg-[color:var(--color-navy)]">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-widest text-[color:var(--color-purple)]">Admin</span>
          <span className="text-sm font-semibold text-white">TuneTwist</span>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="text-xs text-[color:var(--color-muted)] hover:text-white transition-colors"
          >
            Sign out
          </button>
        </form>
      </header>
      <div className="flex-1 pt-16 pb-10">{children}</div>
    </div>
  );
}
