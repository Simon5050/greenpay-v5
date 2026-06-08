import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "@/components/Navbar";

// Syne
const syne = localFont({
  src: [
    { path: "../../public/fonts/Syne/static/Syne-Regular.ttf", weight: "400", style: "normal" },
    { path: "../../public/fonts/Syne/static/Syne-Medium.ttf", weight: "500", style: "normal" },
    { path: "../../public/fonts/Syne/static/Syne-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "../../public/fonts/Syne/static/Syne-Bold.ttf", weight: "700", style: "normal" },
    { path: "../../public/fonts/Syne/static/Syne-ExtraBold.ttf", weight: "800", style: "normal" },
  ],
  variable: "--font-syne",
  display: "swap",
});

// DM Sans
const dmSans = localFont({
  src: [
    { path: "../../public/fonts/DM_Sans/static/DMSans_18pt-Regular.ttf", weight: "400", style: "normal" },
    { path: "../../public/fonts/DM_Sans/static/DMSans_18pt-Medium.ttf", weight: "500", style: "normal" },
    { path: "../../public/fonts/DM_Sans/static/DMSans_18pt-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "../../public/fonts/DM_Sans/static/DMSans_18pt-Bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-dm-sans",
  display: "swap",
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
      <body className="bg-slate-950 text-white font-body antialiased min-h-screen">
        <Providers>
          <div className="relative min-h-screen">
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