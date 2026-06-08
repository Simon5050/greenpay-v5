import type { Metadata } from "next";
import { Syne, DM_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "@/components/Navbar";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  weight: ["400", "500", "600", "700", "800"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "GreenPay — Sustainable P2P Payments",
  description:
    "Send, request, and invoice with USDC. Every transaction plants a seed — 0.5% auto-routed to carbon offset.",
  icons: { icon: "/favicon.svg", apple: "/favicon.svg" },
  manifest: "/site.webmanifest",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${syne.variable} ${dmSans.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
      </head>
      <body className="bg-slate-950 text-white font-body antialiased min-h-screen">
        <Providers>
          <div className="relative min-h-screen">
            {/* Ambient background */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
              <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-forest-900/30 blur-[120px]" />
              <div className="absolute top-1/2 -right-40 w-80 h-80 rounded-full bg-forest-800/20 blur-[100px]" />
              <div className="absolute -bottom-40 left-1/3 w-72 h-72 rounded-full bg-earth-900/20 blur-[100px]" />
            </div>
            <Navbar />
            <main className="relative pt-16">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
