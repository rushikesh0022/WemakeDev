import type { Metadata } from "next";
import "./globals.css";
import "./nowly.css";
import "./refined.css";
import "./zaply.css";
import "./pico.css";
import { AppShell } from "@/components/AppShell";
import { CartProvider } from "@/lib/cart-context";

export const metadata: Metadata = {
  title: "Pico — your neighbourhood store, in minutes",
  description: "Fast shopping with an intelligent basket builder",
  applicationName: "Pico"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <CartProvider><AppShell>{children}</AppShell></CartProvider>
      </body>
    </html>
  );
}
