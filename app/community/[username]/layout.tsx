import type { Metadata } from 'next'
import { getStudentProfileByHandleAction } from '../actions'
import { normalizeCommunityHandle } from '@/lib/community-validation'

interface ProfileLayoutProps {
  children: React.ReactNode
  params: Promise<{ username: string }>
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>
}): Promise<Metadata> {
  const { username: rawParam } = await params
  const cleanHandle = normalizeCommunityHandle(decodeURIComponent(rawParam || ''))

  if (!cleanHandle) {
    return {
      title: 'Student Profile',
      description:
        'View student profiles on PSITS-UA Community — the Philippine Society of Information Technology Students at the University of Antique.',
    }
  }

  // Fetch profile data server-side for dynamic SEO
  const res = await getStudentProfileByHandleAction(cleanHandle)
  const profile = res.success && res.profile ? res.profile : null

  const displayName = profile?.displayName || cleanHandle
  const handle = `@${cleanHandle}`
  const yearSection = profile?.yearSection || 'BSIT'
  const isOfficer = profile?.isOfficer
  const officerTitle = profile?.officerTitle || ''
  const bio = profile?.bio || ''

  // Build rich title
  const roleTag = isOfficer && officerTitle ? ` · ${officerTitle}` : ''
  const title = `${displayName} (${handle})${roleTag} — PSITS-UA Community`

  // Build rich description
  const descParts: string[] = []
  descParts.push(`View ${displayName}'s profile on PSITS-UA Community.`)
  if (bio) {
    descParts.push(bio.length > 120 ? bio.slice(0, 117) + '...' : bio)
  }
  if (isOfficer && officerTitle) {
    descParts.push(`${officerTitle} of PSITS-UA.`)
  }
  descParts.push(
    `${yearSection} student at the University of Antique, College of Computing and Information Sciences.`
  )
  const description = descParts.join(' ')

  // Build keywords
  const keywords: string[] = [
    displayName,
    cleanHandle,
    'PSITS',
    'PSITS-UA',
    'University of Antique',
    yearSection,
    'Community',
    'Student Profile',
    'College of Computing and Information Sciences',
    'BSIT',
  ]
  if (isOfficer && officerTitle) {
    keywords.push(officerTitle, 'Officer')
  }

  // Determine OG image — prefer user avatar, fallback to org logo
  const ogImage =
    profile?.avatar && !profile.avatar.startsWith('preset:') && !profile.avatar.startsWith('data:')
      ? profile.avatar
      : '/assets/logo/PSITS%20logo.png'

  const profileUrl = `/community/${cleanHandle}`

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: profileUrl,
    },
    openGraph: {
      type: 'profile',
      locale: 'en_PH',
      url: profileUrl,
      siteName: 'PSITS-UA Official Portal',
      title,
      description,
      images: [
        {
          url: ogImage,
          width: 400,
          height: 400,
          alt: `${displayName}'s PSITS-UA profile picture`,
        },
      ],
      ...(cleanHandle ? { username: cleanHandle } : {}),
      ...(displayName
        ? {
            firstName: displayName.split(' ')[0],
            lastName: displayName.split(' ').slice(1).join(' ') || undefined,
          }
        : {}),
    },
    twitter: {
      card: 'summary',
      title: `${displayName} (${handle}) — PSITS-UA`,
      description,
      images: [ogImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
      },
    },
  }
}

export default async function ProfileLayout({ children }: ProfileLayoutProps) {
  return <>{children}</>
}
