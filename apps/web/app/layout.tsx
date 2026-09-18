import type { Metadata } from "next";
import "./globals.css";
import "./nowly.css";
import "./refined.css";
import "./zaply.css";
import { AppShell } from "@/components/AppShell";
import { CartProvider } from "@/lib/cart-context";

export const metadata: Metadata = {
  title: "Zaply — good things arrive faster",
  description: "Fast shopping with an intelligent basket builder",
  applicationName: "Zaply"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <CartProvider><AppShell>{children}</AppShell></CartProvider>
      </body>
    </html>
  );
}
