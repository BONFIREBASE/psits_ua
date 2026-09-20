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

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: "Philippine Society of Information Technology Students — University of Antique",
  alternateName: ["PSITS-UA", "PSITS CCIS UA", "PSITS Antique"],
  url: "https://psits-ua.antiquespride.edu.ph",
  logo: "https://psits-ua.antiquespride.edu.ph/assets/logo/PSITS%20logo.png",
  description:
    "Official student organization of the College of Computing and Information Sciences (CCIS), University of Antique — Main Campus.",
  parentOrganization: {
    "@type": "CollegeOrUniversity",
    name: "University of Antique",
    url: "https://antiquespride.edu.ph",
  },
  department: {
    "@type": "Organization",
    name: "College of Computing and Information Sciences",
    alternateName: "CCIS",
  },
  address: {
    "@type": "PostalAddress",
    addressLocality: "Sibalom",
    addressRegion: "Antique",
    addressCountry: "PH",
  },
  sameAs: [
    "https://facebook.com",
    "https://github.com",
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://psits-ua.antiquespride.edu.ph"
  ),
  title: {
    default:
      "PSITS-UA | Philippine Society of Information Technology Students — University of Antique",
    template: "%s | PSITS-UA",
  },
  description:
    "Official portal of the Philippine Society of Information Technology Students (PSITS) at the University of Antique, College of Computing and Information Sciences.",
  applicationName: "PSITS-UA Portal",
  keywords: [
    "PSITS",
    "PSITS-UA",
    "Philippine Society of Information Technology Students",
    "University of Antique",
    "University of Antique Main Campus",
    "College of Computing and Information Sciences",
    "CCIS",
    "Antique IT Students",
    "BS Information Technology",
    "BSIT",
    // Leadership & Faculty
    "Dr. John C. Amar",
    "Carl Spence Percy",
    // Executive Council & Year Representatives
    "Arvin James Balquin",
    "Jared Patrick Evangelio",
    "Kimberly Ann Erispe",
    "Jin Sung Jung",
    "Charyl Naldo",
    "John Vincent Peniero",
    "Johnric Ysulat",
    "Vhonn Gabriel Habulin",
    "Louise Jan Carlo Tabaldo",
    "Bon Jury Pecaoco",
    "Elijah Arevalo",
    "Angel Nicole Albuera",
    "Christine Sumande",
    "Rona Mae Sangcap",
    "Ramel Azar Jr.",
    "Carmelo Dapar II",
    // Pubmat Creative Team
    "Ma. Echel Vicencio",
    "Aizelle Binoy",
    "Blessy Bielle P. Odango",
    "Mark Gelo S. Wieldt",
    "Rheinheart Masuay",
    "Li Joshua Ramos",
    "Jairoh Noe Bachicha Bremon",
    "Dainielle Zyd Samalague",
    "Clarence Morales",
    "Precious Rhyza S. Ricasio",
    "Ellen June Cardinal",
    // Historical Founder
    "Mrs. Nelly E. Mistio",
    // Institutional Keywords
    "Bonfire Base Studio",
    "Student Organization",
    "Calendar of Activities",
    "Antique Capstone",
    "IT Projects Sibalom",
  ],
  authors: [
    { name: "PSITS-UA Executive Council" },
    { name: "Bonfire Base Studio", url: "https://bonfire.base69.studio" },
  ],
  creator: "Bonfire Base Studio",
  publisher: "PSITS-UA · College of Computing and Information Sciences",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_PH",
    url: "https://psits-ua.antiquespride.edu.ph",
    siteName: "PSITS-UA Official Portal",
    title: "PSITS-UA | Philippine Society of Information Technology Students",
    description:
      "Official portal of PSITS-UA at the University of Antique College of Computing and Information Sciences.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "PSITS-UA Portal",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PSITS-UA | Philippine Society of Information Technology Students",
    description:
      "Official portal of PSITS-UA at the University of Antique College of Computing and Information Sciences.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
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
