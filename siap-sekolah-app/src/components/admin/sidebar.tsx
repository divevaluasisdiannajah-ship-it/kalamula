"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChartBar,
  CalendarBlank,
  Users,
  SlidersHorizontal,
  ChalkboardTeacher,
  FileText,
  Leaf,
  Gear,
  ArrowLeft,
} from "@phosphor-icons/react";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", mobileLabel: "Beranda", Icon: ChartBar },
  { href: "/admin/batches", label: "Kelola Gelombang", mobileLabel: "Gelombang", Icon: CalendarBlank },
  { href: "/admin/students", label: "Data Calon Siswa", mobileLabel: "Siswa", Icon: Users },
  { href: "/admin/configs", label: "Rubrik Asesmen", mobileLabel: "Rubrik", Icon: SlidersHorizontal },
  { href: "/admin/classes", label: "Pembagian Kelas", mobileLabel: "Kelas", Icon: ChalkboardTeacher },
  { href: "/admin/reports", label: "Laporan Siswa", mobileLabel: "Laporan", Icon: FileText },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:flex-col w-64 bg-white border-r border-[#E8E2D8] shadow-[2px_0_16px_rgba(30,35,32,0.03)] min-h-screen z-20 font-sans">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#FAF8F5]">
        <Link
          href="/admin"
          className="flex items-center gap-3 rounded-xl focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <div className="w-10 h-10 bg-[#F0F4F1] text-[#3D7A5A] rounded-2xl flex items-center justify-center shadow-xs border border-[#D4E2D8] flex-shrink-0">
            <Leaf weight="light" size={24} className="text-[#3D7A5A]" />
          </div>
          <div>
            <p className="font-brand lowercase text-[22px] text-[#1E2320] font-black tracking-tight leading-none">kalamula</p>
            <p className="text-[10px] text-[#787F7A] font-medium mt-1">Memandu Transisi, Memetakan Fondasi</p>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3.5 space-y-1.5" aria-label="Navigasi Utama Admin">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href));
          const Icon = item.Icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold min-h-[44px]
                transition-all focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2 focus-visible:outline-none
                ${
                  isActive
                    ? "bg-[#FAF8F5] text-[#1E2320] font-bold shadow-2xs border border-[#E8E2D8]"
                    : "text-[#565C58] hover:bg-[#FAF8F5] hover:text-[#1E2320]"
                }
              `}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon weight="light" size={20} className={isActive ? "text-[#C9733B]" : "text-[#787F7A]"} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Role Switcher */}
      <div className="p-4 space-y-2.5 border-t border-[#FAF8F5]">
        <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E8E2D8] flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#FAF0E8] text-[#C9733B] rounded-full flex items-center justify-center shadow-xs border border-[#F2D8C7]">
            <Gear weight="light" size={17} />
          </div>
          <div>
            <p className="text-xs font-bold text-[#1E2320]">Admin PPDB</p>
            <p className="text-[10px] text-[#787F7A] font-medium">Koordinator Asesmen</p>
          </div>
        </div>

        <Link
          href="/"
          className="w-full text-center flex items-center justify-center gap-1.5 h-10 px-3 bg-white hover:bg-[#FAF8F5] text-[11px] font-bold text-[#3D7A5A] rounded-xl transition-colors border border-[#E5E0D8] shadow-2xs focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2"
        >
          <ArrowLeft weight="light" size={13} />
          <span>Ganti Peran (Halaman Depan)</span>
        </Link>
      </div>
    </aside>
  );
}

/** Mobile bottom navigation for admin on smaller screens */
export function AdminMobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-[#E8E2D8] shadow-[0_-4px_24px_rgba(30,35,32,0.06)] md:hidden z-40 pb-[calc(env(safe-area-inset-bottom,0px)+6px)] font-sans"
      aria-label="Navigasi Bawah Seluler"
    >
      <div className="grid grid-cols-6 py-1 px-0.5 text-center">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href));
          const Icon = item.Icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex flex-col items-center justify-center min-h-[44px] py-1 rounded-xl transition-colors
                focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:outline-none
                ${isActive ? "text-[#C9733B] font-bold" : "text-[#565C58] hover:text-[#1E2320]"}
              `}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon weight="light" size={20} className={isActive ? "text-[#C9733B]" : "text-[#787F7A]"} />
              <span className="text-[9.5px] mt-0.5 tracking-tight truncate max-w-full px-0.5">
                {item.mobileLabel}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
