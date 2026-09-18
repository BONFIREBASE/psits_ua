export type ProjectCategory = 'All' | 'Capstone' | 'Open Source' | 'Campus Utility' | 'Hackathon'

export type ProjectStatus = 'Active' | 'In Development' | 'Completed' | 'Pending'

export interface Project {
  id: string
  title: string
  category: 'Capstone' | 'Open Source' | 'Campus Utility' | 'Hackathon'
  description: string
  problemStatement?: string
  tags: string[]
  team: string
  year: string
  status: ProjectStatus
  featured?: boolean
  imageUrl?: string
  githubUrl?: string
  liveUrl?: string
}

export const projectsData: Project[] = [
  {
    id: 'proj-photobooth',
    title: 'Sugalaw PSITS Photobooth',
    category: 'Campus Utility',
    description:
      'Official interactive digital photobooth and keepsake station engineered for campus-wide university celebrations, orientation programs, and departmental festivals.',
    problemStatement:
      'Provides high-quality instant photo-captures and memorable digital keepsakes for kasUbAy students, faculty, and guests at the TiripUnAn Hall.',
    tags: ['Campus Utility', 'Event System', 'Photography', 'PSITS-UA'],
    team: 'PSITS-UA Pubmat & Tech Team',
    year: '2026',
    status: 'Active',
    featured: true,
    imageUrl: '/assets/photobooth.jpg',
    liveUrl:
      'https://www.facebook.com/permalink.php?story_fbid=pfbid022pzu1p5hxva4affPjag7srv5pGweRnA1JJJscknxyqKb6aobMLWgeDTnrDH7sFHAl&id=100086983023496',
  },
]
