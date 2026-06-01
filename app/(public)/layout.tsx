import Nav from "@/components/Nav";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <div className="flex-1 overflow-y-auto pt-24 pb-16">{children}</div>
    </>
  );
}
