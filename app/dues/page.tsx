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

export default async function PublicDuesPage({
  searchParams,
}: {
  searchParams?: Promise<{ ay?: string; sem?: string }>
}) {
  const resolvedParams = searchParams ? await searchParams : undefined
  const ay = resolvedParams?.ay
  const sem = resolvedParams?.sem

  const result = await getPublicDuesSummaryAction(ay, sem)

  const activeAY = result.data?.academicYear || ay || DEFAULT_ACADEMIC_YEAR
  const activeSem = result.data?.semester || sem || DEFAULT_SEMESTER

  const fallbackData: PublicDuesSummary = {
    totalPaid: 0,
    totalCollected: 0,
    academicYear: activeAY,
    semester: activeSem,
    sectionBreakdown: getAllStandardSections().map((sec: string) => ({
      yearSection: sec,
      count: 0,
      amount: 0,
    })),
    maskedRecords: [],
  }

  const duesData = result.success && result.data ? result.data : fallbackData

  return <PublicDuesClient initialData={duesData} />
}
