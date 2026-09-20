import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Student Projects & Capstone Repository | PSITS-UA',
  description:
    'Explore student-engineered software, web applications, and capstone research developed by IT majors of the College of Computing and Information Sciences, University of Antique.',
  keywords: [
    'PSITS Student Projects',
    'University of Antique Capstone',
    'CCIS Software Projects',
    'Antique Developer Portfolios',
    'IT Student Research Sibalom',
    'Computing Capstone Showcase',
    'Next.js React Student Projects',
  ],
  alternates: {
    canonical: '/projects',
  },
  openGraph: {
    title: 'Student Projects & Capstone Repository | PSITS-UA',
    description:
      'Explore software projects, applications, and capstones engineered by University of Antique IT majors.',
    url: 'https://psits-ua.antiquespride.edu.ph/projects',
  },
}

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
