import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import PWAProvider from "@/components/PWAProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#5ec8f2",
};

export const metadata: Metadata = {
  title: "Aprobaciones",
  description: "Panel de aprobaciones - Presupuestos y Órdenes de Compra",
  manifest: "/api/manifest",
  icons: {
    // Iconos dinámicos por tenant: las rutas /api/* derivan el tenant del Host
    // y devuelven el logo o un SVG con la inicial y colores del tenant.
    // No usar PNGs estáticos en /public porque están marcados con un tenant fijo.
    icon: [
      { url: "/api/icon", type: "image/svg+xml" },
    ],
    apple: "/api/apple-touch-icon",
    shortcut: "/api/icon",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Aprobaciones",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PWAProvider>
          <Providers>{children}</Providers>
        </PWAProvider>
      </body>
    </html>
  );
}
