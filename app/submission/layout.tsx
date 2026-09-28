import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Official Polo Shirt Design Contest | PSITS-UA',
  description:
    'Submit and vote on student-crafted uniform designs for the College of Computing and Information Sciences, University of Antique. AY 2026–2027.',
  keywords: [
    'PSITS Polo Shirt Contest',
    'CCIS Uniform Design',
    'University of Antique IT Uniform',
    'Student Design Competition',
    'PSITS Voting Portal',
    'Antique Computing Apparel',
  ],
  alternates: {
    canonical: '/submission',
  },
  openGraph: {
    title: 'Official Polo Shirt Design Contest | PSITS-UA',
    description:
      'Submit and vote on student-crafted uniform designs for the College of Computing and Information Sciences, University of Antique.',
    url: '/submission',
    images: [
      {
        url: '/assets/logo/PSITS%20logo.png',
        width: 1200,
        height: 630,
        alt: 'PSITS-UA Official Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Official Polo Shirt Design Contest | PSITS-UA',
    description:
      'Submit and vote on student-crafted uniform designs for the College of Computing and Information Sciences, University of Antique.',
    images: ['/assets/logo/PSITS%20logo.png'],
  },
}

export default function SubmissionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
