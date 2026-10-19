"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", mobileLabel: "Beranda", mdiIcon: "mdi-home" },
  { href: "/admin/batches", label: "Kelola Gelombang", mobileLabel: "Gelombang", mdiIcon: "mdi-calendar-blank-outline" },
  { href: "/admin/students", label: "Data Calon Siswa", mobileLabel: "Siswa", mdiIcon: "mdi-account-multiple-outline" },
  { href: "/admin/configs", label: "Rubrik Asesmen", mobileLabel: "Rubrik", mdiIcon: "mdi-tune-vertical" },
  { href: "/admin/classes", label: "Pembagian Kelas", mobileLabel: "Kelas", mdiIcon: "mdi-school-outline" },
  { href: "/admin/reports", label: "Laporan Siswa", mobileLabel: "Laporan", mdiIcon: "mdi-file-document-outline" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:flex-col w-64 bg-white border-r border-[#E8E2D8] shadow-sm min-h-screen z-20 font-sans">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#FAF8F5]">
        <Link
          href="/admin"
          className="flex items-center gap-3 rounded-2xl focus-visible:ring-2 focus-visible:ring-[#B85627] focus-visible:outline-none"
        >
          <div className="w-10 h-10 bg-[#D67443] text-white rounded-2xl flex items-center justify-center shadow-xs flex-shrink-0">
            <i className="mdi mdi-leaf text-2xl" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-brand lowercase text-xl font-extrabold text-[#22352B] tracking-tight leading-none">
                kalamula
              </span>
              <span className="bg-[#E4EAF2] text-[#36506C] text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                ADMIN
              </span>
            </div>
            <p className="text-[10.5px] text-[#787F7A] font-medium mt-1">
              Memandu Transisi, Memetakan Fondasi
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3.5 space-y-1.5" aria-label="Navigasi Utama Admin">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold min-h-[44px]
                transition-all focus-visible:ring-2 focus-visible:ring-[#B85627] focus-visible:outline-none
                ${
                  isActive
                    ? "bg-[#FAF8F5] text-[#B85627] shadow-2xs border border-[#E8E2D8]"
                    : "text-[#565C58] hover:bg-[#FAF8F5] hover:text-[#22352B]"
                }
              `}
              aria-current={isActive ? "page" : undefined}
            >
              <i
                className={`mdi ${item.mdiIcon} text-xl ${
                  isActive ? "text-[#B85627]" : "text-[#787F7A]"
                }`}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Role Switcher */}
      <div className="p-4 space-y-2.5 border-t border-[#FAF8F5]">
        <div className="p-3 bg-[#FAF8F5] rounded-2xl border border-[#E8E2D8] flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#E4EAF2] text-[#36506C] rounded-xl flex items-center justify-center shadow-xs flex-shrink-0">
            <i className="mdi mdi-shield-account-outline text-lg" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#22352B]">Admin SPMB</p>
            <p className="text-[10px] text-[#787F7A] font-medium">Koordinator Asesmen</p>
          </div>
        </div>

        <Link
          href="/"
          className="w-full text-center flex items-center justify-center gap-1.5 h-10 px-3 bg-white hover:bg-[#FAF8F5] text-xs font-bold text-[#22352B] rounded-xl transition-colors border border-[#E8E2D8] shadow-2xs"
        >
          <i className="mdi mdi-arrow-left text-sm text-[#787F7A]" />
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
      className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-[#E8E2D8] shadow-lg md:hidden z-40 max-w-xl mx-auto rounded-t-3xl font-sans"
      aria-label="Navigasi Bawah Seluler"
    >
      <div className="grid grid-cols-6 py-2 px-1 text-center">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex flex-col items-center justify-center py-1 rounded-xl transition-colors
                ${isActive ? "text-[#B85627] font-bold" : "text-[#787F7A] hover:text-[#22352B]"}
              `}
              aria-current={isActive ? "page" : undefined}
            >
              <i className={`mdi ${item.mdiIcon} text-2xl`} />
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
