import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Calendar of Activities (COA) | PSITS-UA',
  description:
    'Official Calendar of Activities (PRES-FM-008), IT General Assemblies, Hackathons, Technical Seminars, and Student Events for the College of Computing and Information Sciences at the University of Antique.',
  keywords: [
    'PSITS Calendar of Activities',
    'COA PSITS-UA',
    'PRES-FM-008',
    'University of Antique IT Events',
    'CCIS Hackathon',
    'IT General Assembly',
    'Computing Seminars Antique',
    'Student Activities Sibalom',
  ],
  alternates: {
    canonical: '/events',
  },
  openGraph: {
    title: 'Calendar of Activities (COA) | PSITS-UA',
    description:
      'Official Calendar of Activities (PRES-FM-008), IT Assemblies, and Competitions at the University of Antique CCIS.',
    url: 'https://psits-ua.antiquespride.edu.ph/events',
  },
}

export default function EventsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
