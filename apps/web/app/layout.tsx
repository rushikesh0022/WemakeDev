import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./nowly.css";
import "./refined.css";
import "./zaply.css";
import "./pico.css";
import "./nesto.css";
import { AppShell } from "@/components/AppShell";
import { CartProvider } from "@/lib/cart-context";
import { PwaBootstrap } from "@/components/PwaBootstrap";

export const metadata: Metadata = {
  title: "Nesto — everything you need, in minutes",
  description: "Fast local shopping, intelligent baskets and shared checkout",
  applicationName: "Nesto"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#173f2a"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <PwaBootstrap />
        <CartProvider><AppShell>{children}</AppShell></CartProvider>
      </body>
    </html>
  );
}
