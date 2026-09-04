import type { Metadata } from "next";
import { Syne, Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  weight: ["400", "600", "700", "800"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "PSITS-UA | Philippine Society of IT Students — University of Antique",
  description:
    "Official website of PSITS-UA, the IT student organization of the University of Antique.",
  openGraph: {
    title: "PSITS-UA",
    description: "Students Together in Information Technology.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/assets/logo/PSITS%20logo.png",
    shortcut: "/assets/logo/PSITS%20logo.png",
    apple: "/assets/logo/PSITS%20logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${syne.variable} ${inter.variable}`}>
      <body className="bg-base text-text font-body">
        <Navbar />
        <main>{children}</main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
