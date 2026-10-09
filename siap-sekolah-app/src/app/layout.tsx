import type { Metadata, Viewport } from "next";
import { DM_Sans, Fraunces, Nunito, Outfit } from "next/font/google";
import { PhosphorConfig } from "@/components/PhosphorConfig";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-outfit",
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-nunito",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "kalamula",
    template: "%s | kalamula",
  },
  description:
    "kalamula: Memandu Transisi, Memetakan Fondasi. Asesmen Diagnostik Kesiapan Belajar Calon Siswa SD.",
  keywords: ["kalamula", "PPDB", "asesmen", "kesiapan sekolah", "PAUD", "SD", "diagnostik", "transisi"],
  authors: [{ name: "Tim Kalamula" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "kalamula",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "kalamula",
    title: "kalamula",
    description: "Memandu Transisi, Memetakan Fondasi.",
  },
};

export const viewport: Viewport = {
  themeColor: "#5C7C68",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, // Prevent zoom on input focus (iOS UX)
  userScalable: false,
  viewportFit: "cover", // Safe area insets for notch devices
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${dmSans.variable} ${outfit.variable} ${nunito.variable} ${fraunces.variable}`}>
      <head>
        {/* PWA Icons */}
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-96x96.png" />
        {/* SW Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(reg) { console.log('[SW] Registered:', reg.scope); })
                    .catch(function(err) { console.error('[SW] Error:', err); });
                });
              }
            `,
          }}
        />
      </head>
      <body className="bg-ios-bg font-sans text-ios-label antialiased">
        <PhosphorConfig>{children}</PhosphorConfig>
      </body>
    </html>
  );
}
