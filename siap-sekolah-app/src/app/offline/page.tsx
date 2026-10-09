export const runtime = 'edge';
"use client";

import Link from "next/link";
import { WifiSlash, ArrowsClockwise, ClipboardText } from "@phosphor-icons/react";

export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-ios-bg flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-ios-sm">
        <WifiSlash weight="light" size={44} className="text-amber-800" />
      </div>
      <h1 className="text-2xl font-bold text-ios-label tracking-tight mb-2">Anda Sedang Offline</h1>
      <p className="text-xs text-ios-label-secondary max-w-sm mb-6 leading-relaxed">
        Koneksi internet tidak tersedia saat ini. Seluruh data asesmen yang telah diinput di pos tetap tersimpan aman di memori lokal (IndexedDB) dan akan otomatis disinkronkan saat jaringan kembali terhubung.
      </p>

      <div className="flex items-center gap-2 text-xs text-amber-900 font-bold bg-amber-100/80 px-3.5 py-1.5 rounded-full shadow-xs">
        <span className="sync-dot sync-dot-local" />
        <span>Mode Offline-First Aktif</span>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mt-8">
        <button
          onClick={() => window.location.reload()}
          className="ios-btn bg-ios-blue text-white px-6 text-xs font-bold rounded-ios-md shadow-ios-sm hover:bg-sage-600 transition-colors flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:outline-none"
        >
          <ArrowsClockwise weight="light" size={16} />
          <span>Coba Muat Ulang</span>
        </button>
        <Link
          href="/evaluator"
          className="ios-btn bg-white text-ios-label px-5 text-xs font-semibold rounded-ios-md shadow-xs hover:bg-warm-50 transition-colors flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:outline-none"
        >
          <ClipboardText weight="light" size={16} />
          <span>Kembali ke Input Evaluator</span>
        </Link>
      </div>
    </main>
  );
}

