import type { Metadata } from 'next'
import PublicDuesClient from './PublicDuesClient'
import { getPublicDuesSummaryAction, type PublicDuesSummary } from '@/app/management/dues/actions'
import { DEFAULT_ACADEMIC_YEAR, DEFAULT_SEMESTER, getAllStandardSections } from '@/lib/dues'

export const metadata: Metadata = {
  title: 'Membership Dues Transparency Ledger | PSITS - University of Antique',
  description:
    'Official verifiable transparency ledger of semestral PSITS membership dues (₱25.00/semester) collection and section payment tallies.',
}

export const dynamic = 'force-dynamic'

export default async function PublicDuesPage() {
  const result = await getPublicDuesSummaryAction(DEFAULT_ACADEMIC_YEAR, DEFAULT_SEMESTER)

  const fallbackData: PublicDuesSummary = {
    totalPaid: 0,
    totalCollected: 0,
    academicYear: DEFAULT_ACADEMIC_YEAR,
    semester: DEFAULT_SEMESTER,
    sectionBreakdown: getAllStandardSections().map((sec) => ({
      yearSection: sec,
      count: 0,
      amount: 0,
    })),
    maskedRecords: [],
  }

  const duesData = result.success && result.data ? result.data : fallbackData

  return <PublicDuesClient initialData={duesData} />
}
