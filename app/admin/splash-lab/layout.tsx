export default function SplashLabLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-[color:var(--color-navy)] text-white">
      <a
        href="/admin"
        className="fixed top-4 left-4 z-50 text-xs font-semibold px-3 py-1.5 rounded-full border border-[color:var(--color-border)] text-[color:var(--color-muted)] hover:text-white hover:border-white/30 transition-colors backdrop-blur-sm"
        style={{ background: "rgba(8,6,15,0.8)" }}
      >
        ← Admin
      </a>
      {children}
    </div>
  );
}
