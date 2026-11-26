import type { Metadata, Viewport } from "next";
import "./globals.css";
import { CartProvider } from "@/lib/cart-context";
import { CartDrawer } from "@/components/Cart/CartDrawer";
import { DesignCredit } from "@/components/Layout/DesignCredit";

export const metadata: Metadata = {
  title: "MercadoInteligente · Compará precios en Mendoza",
  description: "Compará productos, precios y sucursales de supermercados en Mendoza.",
  manifest: "/manifest.json",
  icons: {
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#23aa49",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body><CartProvider>{children}<CartDrawer/><DesignCredit/></CartProvider></body>
    </html>
  );
}
