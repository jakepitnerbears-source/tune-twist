import Nav from "@/components/Nav";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <div className="flex-1 overflow-y-auto pt-0 md:pt-16 pb-16">{children}</div>
    </>
  );
}
