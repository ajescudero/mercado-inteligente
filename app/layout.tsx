import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Lista Inteligente",
  description: "Tu lista de compras inteligente y amigable",
  manifest: "/manifest.json",
  icons: {
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#FF8F5E",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Prevents zooming issues on mobile inputs
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
