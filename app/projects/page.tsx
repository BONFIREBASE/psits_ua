import { getProjects } from '@/lib/supabase'
import {
  projectsData as initialProjects,
  Project,
  ProjectStatus,
} from '@/data/projects'
import ProjectsClient from '@/components/ProjectsClient'

export const revalidate = 60

export default async function ProjectsPage() {
  let projects: Project[] = initialProjects

  try {
    const dbProjects = await getProjects()
    if (dbProjects && dbProjects.length > 0) {
      // Filter out any unapproved / pending submissions
      const publicList: Project[] = dbProjects
        .filter((p) => p.status !== 'Pending')
        .map((p) => {
          const matchedInitial = initialProjects.find(
            (init) =>
              init.title.toLowerCase().trim() === p.title.toLowerCase().trim() ||
              init.id === p.id
          )
          const teamTag = p.tags?.find((t) => t.toLowerCase().startsWith('by:'))
          const teamName =
            teamTag ? teamTag.replace(/^by:\s*/i, '') : matchedInitial?.team || 'PSITS-UA Student Developers'
          const displayTags = (p.tags || []).filter((t) => !t.toLowerCase().startsWith('by:'))
          return {
            id: p.id,
            title: p.title,
            category: (p.category as Project['category']) || matchedInitial?.category || 'Campus Utility',
            description: p.description,
            problemStatement: matchedInitial?.problemStatement,
            tags: displayTags.length > 0 ? displayTags : matchedInitial?.tags || ['PSITS-UA'],
            team: teamName,
            year: matchedInitial?.year || '2026',
            status: (p.status as ProjectStatus) || 'Active',
            featured: matchedInitial?.featured ?? true,
            imageUrl: p.image_url || matchedInitial?.imageUrl || undefined,
            liveUrl: p.demo_url || matchedInitial?.liveUrl || undefined,
            githubUrl: p.github_url || matchedInitial?.githubUrl || undefined,
          }
        })

      // Guarantee flagship projects like Sugalaw PSITS Photobooth are always present
      const merged = [...publicList]
      for (const init of initialProjects) {
        if (!merged.some((p) => p.title.toLowerCase().trim() === init.title.toLowerCase().trim())) {
          merged.unshift(init)
        }
      }
      projects = merged
    }
  } catch (err) {
    console.error('Failed to load server projects for SEO:', err)
  }

  // Generate dynamic Schema.org ItemList with SoftwareApplication & Author credits
  const projectSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'PSITS-UA Student Software & Capstone Repository',
    description:
      'Student-engineered software systems, capstone research, and campus utilities built by IT majors at the University of Antique College of Computing and Information Sciences.',
    itemListElement: projects.map((p, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      item: {
        '@type': 'SoftwareApplication',
        name: p.title,
        description: p.description,
        applicationCategory: p.category,
        author: {
          '@type': 'Person',
          name: p.team,
        },
        ...(p.liveUrl ? { url: p.liveUrl } : {}),
        ...(p.githubUrl ? { codeRepository: p.githubUrl } : {}),
        ...(p.imageUrl ? { image: p.imageUrl } : {}),
      },
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(projectSchema) }}
      />
      <ProjectsClient initialProjects={projects} />
    </>
  )
}
