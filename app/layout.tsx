import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "GONTEC Aprobaciones",
  description: "Panel de aprobaciones GONTEC - Presupuestos y Órdenes de Compra",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  manifest: "/manifest.json",
  themeColor: "#5ec8f2",
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/icon-192x192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "GONTEC Aprobaciones",
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
