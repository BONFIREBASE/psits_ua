import type { Metadata } from "next";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import LayoutShell from "@/components/LayoutShell";
import { ThemeProvider, themeScript } from "@/components/ThemeProvider";

const syne = localFont({
  src: "../public/assets/font/Syne/Syne-VariableFont_wght.ttf",
  variable: "--font-syne",
  display: "swap",
});

const inter = localFont({
  src: "../public/assets/font/Inter/Inter-VariableFont_opsz,wght.ttf",
  variable: "--font-inter",
  display: "swap",
});

const architectsDaughter = localFont({
  src: "../public/assets/font/Architects_Daughter/ArchitectsDaughter-Regular.ttf",
  variable: "--font-handwriting",
  display: "swap",
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
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${syne.variable} ${inter.variable} ${architectsDaughter.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="bg-base text-text font-body transition-colors duration-200">
        <ThemeProvider>
          <LayoutShell>{children}</LayoutShell>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
