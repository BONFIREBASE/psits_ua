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
    url: 'https://psits-ua.antiquespride.edu.ph/submission',
  },
}

export default function SubmissionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
