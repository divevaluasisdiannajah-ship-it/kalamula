import Link from "next/link";
import { AdminSidebar, AdminMobileNav } from "@/components/admin/sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#F6F2E9] text-[#22352B] font-sans">
      {/* Desktop Sidebar */}
      <AdminSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile Top Header (Visible only on < md screens) */}
        <header className="md:hidden sticky top-0 z-30 bg-[#F6F2E9]/95 backdrop-blur-md border-b border-[#E8E2D8] px-4 py-2.5 flex items-center justify-between shadow-2xs">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#D67443] text-white rounded-xl flex items-center justify-center shadow-xs">
              <i className="mdi mdi-leaf text-xl" />
            </div>
            <div>
              <span className="font-brand lowercase text-base font-extrabold text-[#22352B] leading-none">
                kalamula
              </span>
              <span className="text-[10px] text-[#36506C] font-extrabold ml-1.5 px-2 py-0.5 rounded-full bg-[#E4EAF2]">
                Admin
              </span>
            </div>
          </Link>
          <Link
            href="/"
            className="text-xs font-bold text-[#22352B] hover:text-[#B85627] flex items-center gap-1 bg-white px-3 py-1.5 rounded-full border border-[#E8E2D8] shadow-2xs"
          >
            <i className="mdi mdi-chevron-left text-base" />
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
