import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Fraunces } from "next/font/google";
import { PhosphorConfig } from "@/components/PhosphorConfig";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
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
  other: {
    google: "notranslate",
  },
};

export const viewport: Viewport = {
  themeColor: "#486B5A",
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
    <html
      lang="id"
      translate="no"
      className={`notranslate ${plusJakartaSans.variable} ${fraunces.variable}`}
    >
      <head>
        {/* Prevent browser auto-translate prompts */}
        <meta name="google" content="notranslate" />
        {/* Material Design Icons (MDI) CDN */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@mdi/font@7.4.47/css/materialdesignicons.min.css"
        />
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
      <body className="notranslate bg-[#F6F2E9] font-sans text-[#22352B] antialiased">
        <PhosphorConfig>{children}</PhosphorConfig>
      </body>
    </html>
  );
}
