import Link from "next/link";
import { Leaf, ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { AdminSidebar, AdminMobileNav } from "@/components/admin/sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#FAF8F5] text-[#1E2320] font-sans">
      {/* Desktop Sidebar */}
      <AdminSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile Top Header (Visible only on < md screens) */}
        <header className="md:hidden sticky top-0 z-30 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#E8E2D8] px-4 py-2.5 flex items-center justify-between shadow-2xs">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#F0F4F1] rounded-lg flex items-center justify-center border border-[#D4E2D8]">
              <Leaf weight="light" size={17} className="text-[#3D7A5A]" />
            </div>
            <div>
              <span className="font-brand lowercase text-base font-black text-[#1E2320] leading-none">kalamula</span>
              <span className="text-[10px] text-[#787F7A] font-bold ml-1.5 px-1.5 py-0.5 rounded bg-[#EBE6DF]">Admin</span>
            </div>
          </Link>
          <Link
            href="/"
            className="text-[11px] font-bold text-[#3D7A5A] hover:text-[#1E2320] flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-[#E5E0D8] shadow-2xs focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2"
          >
            <ArrowLeft weight="light" size={12} />
            <span>Beranda</span>
          </Link>
        </header>

        {/* Page Children */}
        <main className="flex-1 pb-24 md:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <AdminMobileNav />
    </div>
  );
}
