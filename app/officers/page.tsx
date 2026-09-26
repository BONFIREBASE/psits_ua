import type { Metadata } from 'next'
import {
  dean,
  adviser,
  officers as initialOfficers,
  pubmatTeam as initialPubmat,
  Officer,
} from '@/data/officers'
import { getOfficers, sortOfficersByHierarchy } from '@/lib/supabase'
import OfficersDirectoryClient from '@/components/OfficersDirectoryClient'

export const metadata: Metadata = {
  title: 'Officers & Leadership Directory | PSITS-UA',
  description:
    'Meet the PSITS-UA Executive Council, CCIS Dean Dr. John C. Amar, BSIT Program Head Carl Spence Percy, and student leaders for Academic Year 2026–2027.',
  keywords: [
    'PSITS Officers',
    'PSITS-UA Leadership Directory',
    'University of Antique IT Officers',
    'College of Computing and Information Sciences Leaders',
    'Student Council Antique',
    // Dean & Adviser
    'Dr. John C. Amar',
    'Carl Spence Percy',
    // Executive Council & Year Representatives
    'Arvin James Balquin',
    'Jared Patrick Evangelio',
    'Kimberly Ann Erispe',
    'Jin Sung Jung',
    'Charyl Naldo',
    'John Vincent Peniero',
    'Johnric Ysulat',
    'Vhonn Gabriel Habulin',
    'Louise Jan Carlo Tabaldo',
    'Bon Jury Pecaoco',
    'Elijah Arevalo',
    'Angel Nicole Albuera',
    'Christine Sumande',
    'Rona Mae Sangcap',
    'Ramel Azar Jr.',
    'Carmelo Dapar II',
    // Pubmat Creative Team
    'Ma. Echel Vicencio',
    'Aizelle Binoy',
    'Blessy Bielle P. Odango',
    'Mark Gelo S. Wieldt',
    'Rheinheart Masuay',
    'Li Joshua Ramos',
    'Jairoh Noe Bachicha Bremon',
    'Dainielle Zyd Samalague',
    'Clarence Morales',
    'Precious Rhyza S. Ricasio',
    'Ellen June Cardinal',
    // Historical Founder
    'Mrs. Nelly E. Mistio',
  ],
  alternates: {
    canonical: '/officers',
  },
}

export default async function OfficersPage() {
  const dbOfficers = await getOfficers()

  const pubmatMembers: Officer[] = sortOfficersByHierarchy(
    dbOfficers && dbOfficers.length > 0
      ? dbOfficers.filter((o) => o.is_pubmat).map((o) => ({
          name: o.name,
          position: o.pubmat_role || o.position,
          roleGroup: 'Operations & PR' as Officer['roleGroup'],
          department: o.year_section || 'Pubmat Creative Team',
          image: o.image_url || undefined,
          isPubmat: true,
          pubmatRole: o.pubmat_role || o.position,
          quote: o.quote || undefined,
        }))
      : initialPubmat.map((p) => ({
          name: p.name,
          position: p.role,
          roleGroup: 'Operations & PR' as Officer['roleGroup'],
          department: 'Pubmat Creative Team',
          image: p.image || undefined,
          isPubmat: true,
          pubmatRole: p.role,
          quote: undefined,
        }))
  )

  const officersList: Officer[] = sortOfficersByHierarchy(
    dbOfficers && dbOfficers.length > 0
      ? dbOfficers.filter((o) => !o.is_pubmat).map((o) => ({
          name: o.name,
          position: o.position,
          roleGroup: o.role_group as Officer['roleGroup'],
          department: o.year_section,
          image: o.image_url || undefined,
          isPubmat: false,
          quote: o.quote || undefined,
        }))
      : initialOfficers
  )

  const executives = officersList.filter((o) => o.roleGroup === 'Executive')
  const secretariat = officersList.filter(
    (o) => o.roleGroup === 'Secretariat & Finance'
  )
  const operations = officersList.filter((o) => o.roleGroup === 'Operations & PR')
  const representatives = officersList.filter(
    (o) => o.roleGroup === 'Year Representatives'
  )

  const leadershipSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'PSITS-UA Leadership Directory (AY 2026–2027)',
    description:
      'Executive Council, Faculty Advisers, and Student Leaders of PSITS at the University of Antique College of Computing and Information Sciences.',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        item: {
          '@type': 'Person',
          name: dean.name,
          jobTitle: `${dean.title}, ${dean.college}`,
          affiliation: {
            '@type': 'CollegeOrUniversity',
            name: dean.institution,
          },
        },
      },
      {
        '@type': 'ListItem',
        position: 2,
        item: {
          '@type': 'Person',
          name: adviser.name,
          jobTitle: adviser.title,
          affiliation: {
            '@type': 'CollegeOrUniversity',
            name: adviser.institution,
          },
        },
      },
      ...officersList.map((o, idx) => ({
        '@type': 'ListItem',
        position: idx + 3,
        item: {
          '@type': 'Person',
          name: o.name,
          jobTitle: `${o.position} — PSITS-UA`,
          worksFor: {
            '@type': 'Organization',
            name: 'PSITS-UA',
          },
          affiliation: {
            '@type': 'CollegeOrUniversity',
            name: 'University of Antique',
          },
        },
      })),
      ...pubmatMembers.map((p, idx) => ({
        '@type': 'ListItem',
        position: officersList.length + idx + 3,
        item: {
          '@type': 'Person',
          name: p.name,
          jobTitle: `${p.position} — Creative Pubmat Team`,
          worksFor: {
            '@type': 'Organization',
            name: 'PSITS-UA',
          },
        },
      })),
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(leadershipSchema) }}
      />
      <OfficersDirectoryClient
        adviser={adviser}
        executives={executives}
        secretariat={secretariat}
        operations={operations}
        representatives={representatives}
        pubmatMembers={pubmatMembers}
      />
    </>
  )
}
